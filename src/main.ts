import { Editor, Notice, Plugin, addIcon } from "obsidian";
import { SpotifyLinkSettings, SpotifyAuthCallback } from "./types";
import { getSpotifyUrl, handleCallback, requestRefreshToken } from "./api";
import SettingsTab, { DEFAULT_SETTINGS } from "./settingsTab";
import { handleEditor } from "./ui";
import { onLogin, onAutoLogin } from "./events";

export default class SpotifyLinkPlugin extends Plugin {
	settings: SpotifyLinkSettings;

	// States
	spotifyConnected: boolean = false;
	spotifyUrl: string = "";
	statusBar: HTMLElement;

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
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
			'<path fill="currentColor" d="M 52.021502,2.019 C 24.520376,2.019 2.019,24.520376 2.019,52.021502 2.019,79.517624 24.520376,102.019 52.021502,102.019 79.517624,102.019 102.019,79.517624 102.019,52.021502 102.019,24.520376 79.767861,2.019 52.021502,2.019 Z m 22.996847,72.248636 c -0.995946,1.496422 -2.74761,2.001902 -4.254041,1.005956 -11.756168,-7.256894 -26.50518,-8.758321 -44.006806,-4.759522 -1.741655,0.510485 -3.243081,-0.740703 -3.743557,-2.247134 -0.50548,-1.751665 0.745709,-3.243081 2.25214,-3.748562 18.993043,-4.254041 35.498724,-2.497372 48.496071,5.50523 1.751664,0.745709 2.001902,2.742606 1.256193,4.244032 z m 6.005706,-13.74806 c -1.256194,1.746659 -3.503328,2.497372 -5.259997,1.246183 -13.497823,-8.237826 -33.992293,-10.750212 -49.742255,-5.745458 -1.991893,0.50548 -4.254042,-0.500475 -4.749512,-2.492368 -0.505481,-2.011911 0.500475,-4.26405 2.497372,-4.764526 18.247335,-5.49522 40.753716,-2.742605 56.248436,6.761424 1.501426,0.745708 2.25214,3.24308 1.005956,4.994745 z m 0.49547,-14.008308 C 65.519325,37.017248 38.768912,36.016297 23.514421,40.775819 a 4.6944597,4.6944597 0 0 1 -5.745459,-3.002853 4.689455,4.689455 0 0 1 2.997848,-5.760472 c 17.751865,-5.249988 47.004655,-4.254042 65.507232,6.761423 2.247135,1.246184 2.997848,4.249037 1.74666,6.496172 -1.251189,1.751664 -4.249037,2.492367 -6.501177,1.241179 z" style="stroke-width:5.00475" />'
		);
		this.addRibbonIcon("spotify", "Connect Spotify", async () => {
			onLogin(
				this.settings.spotifyClientId,
				this.settings.spotifyState,
				this.settings.spotifyScopes
			);
		});

		//
		// STATUS BAR
		//
		this.statusBar = this.addStatusBarItem();
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 30000)
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
						this.settings.spotifyState
					);
					new Notice(
						"Spotify Link Plugin: Connected to Spotify !",
						3000
					);
					this.spotifyUrl = await getSpotifyUrl(
						this.settings.spotifyClientId,
						this.settings.spotifyClientSecret
					);
				} catch (e) {
					new Notice(
						"[ERROR] Spotify Link Plugin: " + e.message,
						3000
					);
					this.spotifyConnected = false;
				} finally {
					this.updateStatusBar();
				}
			}
		);

		//
		// USER INTERACTION
		//
		this.addCommand({
			id: "append-currently-playing-track",
			name: "Append Spotify currently playing track with timestamp",
			editorCallback: async (editor: Editor) => {
				await handleEditor(
					editor,
					this.settings.spotifyClientId,
					this.settings.spotifyClientSecret
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
						this.settings.spotifyClientSecret
					);
					new Notice(`Spotify Link Plugin: Access Refreshed`);
				} catch (e) {
					new Notice(`[ERROR] Spotify Link Plugin: ${e.message}`);
				}
			},
		});

		//
		// Events
		//
		try {
			const info = await onAutoLogin(
				this.settings.spotifyClientId,
				this.settings.spotifyClientSecret
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
			`Spotify ${!this.spotifyConnected ? "not" : ""} Connected`
		);
		this.statusBar.onClickEvent((ev) => {
			window.open(this.spotifyUrl);
		});
	}
}
