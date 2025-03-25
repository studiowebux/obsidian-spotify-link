import {
	Editor,
	Menu,
	MenuItem,
	Notice,
	Plugin,
	TFile,
	type Vault,
	addIcon,
	normalizePath,
} from "obsidian";
import {
	SpotifyLinkSettings,
	SpotifyAuthCallback,
	CurrentlyPlayingTrack,
	RecentlyPlayed,
	Track,
} from "./types";
import {
	getArtist,
	getSpotifyUrl,
	handleCallback,
	requestRefreshToken,
} from "./api";
import SettingsTab from "./settingsTab";
import { handleEditor, handleTemplateEditor } from "./ui";
import { onLogin, onAutoLogin } from "./events";
import { DEFAULT_SETTINGS } from "./default";
import {
	getCurrentlyPlayingTrack,
	getCurrentlyPlayingTrackAsString,
	getRecentlyPlayedTracks,
} from "./api";
import {
	processCurrentlyPlayingTrack,
	processRecentlyPlayedTracks,
} from "./output";
import { isPath } from "./utils";

export default class SpotifyLinkPlugin extends Plugin {
	settings: SpotifyLinkSettings;

	// States
	spotifyConnected = false;
	spotifyUrl = "";
	statusBar: HTMLElement;

	async loadOrGetTemplate(input: string): Promise<string> {
		try {
			if (!input) return "";
			const exists = await this.app.vault.adapter.exists(input, true);
			if (exists) {
				return this.app.vault.adapter.read(input);
			} else {
				// Retry adding the .md file extension automatically.
				const exists_with_md = await this.app.vault.adapter.exists(
					input + ".md",
					true,
				);
				if (exists_with_md) {
					return this.app.vault.adapter.read(input + ".md");
				}
			}

			if (isPath(input)) {
				new Notice(
					"[WARN] Spotify Link Plugin: The provided template looks like a path, if so, the file hasn't been found.",
					10000,
				);
			}

			return input; // This is the inline template.
		} catch (e) {
			new Notice("[ERROR] Spotify Link Plugin: " + e.message, 10000);
			return "";
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async autoOpen(filename: string) {
		if (this.settings.autoOpen === true) {
			try {
				await this.app.workspace
					.getLeaf()
					.openFile(
						this.app.vault.getAbstractFileByPath(filename) as TFile,
					);
			} catch (e) {
				new Notice("[ERROR] Spotify Link Plugin: " + e.message, 10000);
			}
		}
	}

	async createFolder(vault: Vault, folder: string) {
		try {
			await vault.createFolder(folder);
		} catch (e) {
			if (e.message !== "Folder already exists.") {
				new Notice("[ERROR] Spotify Link Plugin: " + e.message, 10000);
			}
		}
	}

	async overwrite(filename: string, content: string, exists: boolean) {
		if (this.settings.overwrite === true) {
			try {
				await this.app.vault.modify(
					this.app.vault.getAbstractFileByPath(filename) as TFile,
					content,
				);
				if (exists) {
					new Notice(
						"Spotify Link Plugin: track or episode overwritten.",
					);
				}
			} catch (e) {
				new Notice("[ERROR] Spotify Link Plugin: " + e.message, 10000);
			}
		}
	}

	async getName(track?: CurrentlyPlayingTrack): Promise<string> {
		let name = new Date().toISOString();

		if (track?.item?.name) {
			name = track?.item?.name;

			if (this.settings.appendArtistNames) {
				const artists = await Promise.all(
					(track.item as Track).artists.map((artist) =>
						getArtist(
							this.settings.spotifyClientId,
							this.settings.spotifyClientSecret,
							artist.id,
						),
					),
				);

				name += `-${artists.map((artist) => artist.name).join("_")}`;
			}
		}

		return name;
	}

	async createFile(parent: string, id: string) {
		let content = "";
		let track: CurrentlyPlayingTrack | RecentlyPlayed | string | null =
			null;
		let template_index = -1;

		if (
			id === "create-file-for-currently-playing-episode" ||
			id === "create-file-for-currently-playing-track"
		) {
			track = await getCurrentlyPlayingTrackAsString(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
			);
			content =
				`> ${track}` +
				`\n> ${new Date().toDateString()} - ${new Date().toLocaleTimeString()}` +
				`\n\n`;
		} else if (
			id === "create-file-for-recently-played-tracks-using-template"
		) {
			template_index = 2;

			const tracks = await getRecentlyPlayedTracks(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
			);

			content = `${await processRecentlyPlayedTracks(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
				tracks,
				await this.loadOrGetTemplate(
					this.settings.templates[template_index],
				),
			)}\n\n`;
		} else {
			track = await getCurrentlyPlayingTrack(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
			);

			if (
				id ===
				"create-file-for-currently-playing-episode-using-template"
			) {
				template_index = 1;
			} else if (
				id === "create-file-for-currently-playing-track-using-template"
			) {
				template_index = 0;
			}
			content = `${await processCurrentlyPlayingTrack(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
				track,
				await this.loadOrGetTemplate(
					this.settings.templates[template_index],
				),
			)}\n\n`;
		}

		const filename = `${normalizePath(
			`/${parent}/${await this.getName(track as CurrentlyPlayingTrack)}`,
		).replace(/[:|.]/g, "_")}.md`;

		const exists = await this.app.vault.adapter.exists(filename, true);
		const folder = filename.substring(0, filename.lastIndexOf("/"));
		try {
			await this.createFolder(this.app.vault, folder);
			await this.app.vault.create(filename, content);
			await this.autoOpen(filename);
		} catch (e) {
			await this.overwrite(filename, content, exists);
			// Auto open the file even if there is an error.
			// Probably an already exists as the others should be handle correctly.
			await this.autoOpen(filename);
			new Notice("[ERROR] Spotify Link Plugin: " + e.message, 10000);
		}
	}

	async onload() {
		//
		// SETTINGS
		//
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		//
		// BUTTON TO SIGN IN
		//
		addIcon(
			"spotify",
			'<path fill="currentColor" d="M 52.021502,2.019 C 24.520376,2.019 2.019,24.520376 2.019,52.021502 2.019,79.517624 24.520376,102.019 52.021502,102.019 79.517624,102.019 102.019,79.517624 102.019,52.021502 102.019,24.520376 79.767861,2.019 52.021502,2.019 Z m 22.996847,72.248636 c -0.995946,1.496422 -2.74761,2.001902 -4.254041,1.005956 -11.756168,-7.256894 -26.50518,-8.758321 -44.006806,-4.759522 -1.741655,0.510485 -3.243081,-0.740703 -3.743557,-2.247134 -0.50548,-1.751665 0.745709,-3.243081 2.25214,-3.748562 18.993043,-4.254041 35.498724,-2.497372 48.496071,5.50523 1.751664,0.745709 2.001902,2.742606 1.256193,4.244032 z m 6.005706,-13.74806 c -1.256194,1.746659 -3.503328,2.497372 -5.259997,1.246183 -13.497823,-8.237826 -33.992293,-10.750212 -49.742255,-5.745458 -1.991893,0.50548 -4.254042,-0.500475 -4.749512,-2.492368 -0.505481,-2.011911 0.500475,-4.26405 2.497372,-4.764526 18.247335,-5.49522 40.753716,-2.742605 56.248436,6.761424 1.501426,0.745708 2.25214,3.24308 1.005956,4.994745 z m 0.49547,-14.008308 C 65.519325,37.017248 38.768912,36.016297 23.514421,40.775819 a 4.6944597,4.6944597 0 0 1 -5.745459,-3.002853 4.689455,4.689455 0 0 1 2.997848,-5.760472 c 17.751865,-5.249988 47.004655,-4.254042 65.507232,6.761423 2.247135,1.246184 2.997848,4.249037 1.74666,6.496172 -1.251189,1.751664 -4.249037,2.492367 -6.501177,1.241179 z" style="stroke-width:5.00475" />',
		);
		this.addRibbonIcon("spotify", "Connect Spotify", () => {
			onLogin(
				this.settings.spotifyClientId,
				this.settings.spotifyState,
				this.settings.spotifyScopes,
			);
		});

		//
		// STATUS BAR
		//
		this.statusBar = this.addStatusBarItem();
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 30000),
		);

		//
		// HANDLE CALLBACK
		//
		this.registerObsidianProtocolHandler(
			"spotify-auth",
			async (params: SpotifyAuthCallback) => {
				try {
					this.spotifyConnected = await handleCallback(
						params,
						this.settings.spotifyClientId,
						this.settings.spotifyClientSecret,
						this.settings.spotifyState,
					);
					new Notice(
						"Spotify Link Plugin: Connected to Spotify !",
						3000,
					);
					this.spotifyUrl = await getSpotifyUrl(
						this.settings.spotifyClientId,
						this.settings.spotifyClientSecret,
					);
				} catch (e) {
					new Notice(
						"[ERROR] Spotify Link Plugin: " + e.message,
						3000,
					);
					this.spotifyConnected = false;
				} finally {
					this.updateStatusBar();
				}
			},
		);

		//
		// USER INTERACTION
		//

		//
		// Episode focused
		//

		this.addCommand({
			id: "append-currently-playing-episode-using-template",
			name: "Append Spotify currently playing episode using template",
			editorCallback: async (editor: Editor) => {
				await handleTemplateEditor(
					editor,
					await this.loadOrGetTemplate(this.settings.templates[1]),
					this.settings.spotifyClientId,
					this.settings.spotifyClientSecret,
				);
			},
		});
		this.addCommand({
			id: "append-currently-playing-episode",
			name: "Append Spotify currently playing episode with timestamp",
			editorCallback: async (editor: Editor) => {
				await handleEditor(
					editor,
					this.settings.spotifyClientId,
					this.settings.spotifyClientSecret,
				);
			},
		});
		//
		// Song focused
		//
		this.addCommand({
			id: "append-currently-playing-track-using-template",
			name: "Append Spotify currently playing track using template",
			editorCallback: async (editor: Editor) => {
				await handleTemplateEditor(
					editor,
					await this.loadOrGetTemplate(this.settings.templates[0]),
					this.settings.spotifyClientId,
					this.settings.spotifyClientSecret,
				);
			},
		});
		this.addCommand({
			id: "append-currently-playing-track",
			name: "Append Spotify currently playing track with timestamp",
			editorCallback: async (editor: Editor) => {
				await handleEditor(
					editor,
					this.settings.spotifyClientId,
					this.settings.spotifyClientSecret,
				);
			},
		});
		this.addCommand({
			id: "refresh-session",
			name: "Refresh session",
			callback: async () => {
				try {
					await requestRefreshToken(
						this.settings.spotifyClientId,
						this.settings.spotifyClientSecret,
					);
					new Notice(`Spotify Link Plugin: Access Refreshed`);
				} catch (e) {
					new Notice(`[ERROR] Spotify Link Plugin: ${e.message}`);
				}
			},
		});

		this.addCommand({
			id: "create-file-for-currently-playing-episode-using-template",
			name: "Create file for currently playing episode using template",
			callback: async () => {
				await this.createFile(
					this.settings.defaultDestination ?? "",
					"create-file-for-currently-playing-episode-using-template",
				);
			},
		});
		this.addCommand({
			id: "create-file-for-currently-playing-episode",
			name: "Create file for currently playing episode",
			callback: async () => {
				await this.createFile(
					this.settings.defaultDestination ?? "",
					"create-file-for-currently-playing-episode",
				);
			},
		});
		this.addCommand({
			id: "create-file-for-currently-playing-track-using-template",
			name: "Create file for currently playing track using template",
			callback: async () => {
				await this.createFile(
					this.settings.defaultDestination ?? "",
					"create-file-for-currently-playing-track-using-template",
				);
			},
		});
		this.addCommand({
			id: "create-file-for-currently-playing-track",
			name: "Create file for currently playing track",
			callback: async () => {
				await this.createFile(
					this.settings.defaultDestination ?? "",
					"create-file-for-currently-playing-track",
				);
			},
		});

		// Recently Played tracks
		this.addCommand({
			id: "create-file-for-recently-played-tracks-using-template",
			name: "Create file for recently played tracks using template",
			callback: async () => {
				await this.createFile(
					this.settings.defaultDestination ?? "",
					"create-file-for-recently-played-tracks-using-template",
				);
			},
		});

		//
		// Create new page and fill content
		//
		if (this.settings?.menu) {
			for (const customMenu of this.settings.menu) {
				if (!customMenu.enabled) return;
				const menuCreateFile = (menu: Menu, file: TFile) => {
					menu.addItem((item: MenuItem) => {
						item.setTitle(customMenu.name).onClick(async () => {
							try {
								await this.createFile(file.path, customMenu.id);
							} catch (e) {
								new Notice(
									`[ERROR] Spotify Link Plugin: ${e.message}`,
								);
								return false;
							}
						});
					});
				};
				this.registerEvent(
					this.app.workspace.on("file-menu", menuCreateFile),
				);
			}
		} else {
			new Notice("Your spotify link configuration might be outdated.");
		}

		//
		// Events
		//
		try {
			const info = await onAutoLogin(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret,
			);
			this.spotifyConnected = info.success;
			this.spotifyUrl = info.spotifyUrl;
		} catch (e) {
			new Notice(`[ERROR] Spotify Link Plugin: ${e.message}`);
			return false;
		} finally {
			this.updateStatusBar();
		}
	}

	onunload() {}

	updateStatusBar() {
		this.statusBar.setText(
			`Spotify ${!this.spotifyConnected ? "not" : ""} Connected`,
		);
	}
}
