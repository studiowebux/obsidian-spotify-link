import { App, PluginSettingTab, Setting } from "obsidian";
import SpotifyLinkPlugin from "./main";

export default class SettingsTab extends PluginSettingTab {
	plugin: SpotifyLinkPlugin;

	constructor(app: App, plugin: SpotifyLinkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// INSTRUCTIONS
		const div = containerEl.createDiv();
		div.createEl("p", {
			text:
				"Follow the link below to get your Client Id and Client Secret, you need a spotify account to get access.",
		});
		div.createEl("a", {
			href: "https://developer.spotify.com/dashboard/",
			text: "Spotify Developer",
		});
		const ol = div.createEl("ol");
		ol.createEl("li", { text: "Create an App" });
		ol.createEl("li", { text: "Click Settings" });
		ol.createEl("li", { text: "Copy the Client Id and Secret" });
		ol.createEl("li", {
			text: "Set the Redirect URI to : obsidian://spotify-auth/",
		});
		ol.createEl("li", {
			text:
				"Select the Spotify icon located in Obsidian's left sidebar to connect.",
		});

		const reconnectDiv = div.createDiv();
		reconnectDiv.createEl("h6", { text: "Reconnecting / Rotated credentials" });
		reconnectDiv.createEl("p", {
			text:
				"After updating your Client ID or Secret (e.g. after rotating keys), you must re-authenticate by clicking the Spotify icon in Obsidian's left sidebar. Saving new credentials here does not automatically reconnect. The status bar at the bottom shows your current connection state.",
		});

		div.createEl("p", {
			text:
				"NOTICE: The id and secret will be stored unencrypted on your local device. If you sync your data to a public source, the id and secret will be shown as-is. Use the eye icon next to each field to verify your values.",
		});

		//
		// Settings
		//
		new Setting(containerEl)
			.setName("Spotify Client ID")
			.setDesc("Client ID (Keep this secured)")
			.addText((text) => {
				text.setPlaceholder("Enter your client id")
					.setValue(this.plugin.settings.spotifyClientId)
					.onChange(async (value) => {
						this.plugin.settings.spotifyClientId = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.setAttribute("type", "password");
			})
			.addExtraButton((btn) => {
				btn.setIcon("eye")
					.setTooltip("Toggle visibility")
					.onClick(() => {
						const input = btn.extraSettingsEl.parentElement?.querySelector(
							"input",
						) as HTMLInputElement | null;
						if (input) {
							const isHidden = input.type === "password";
							input.type = isHidden ? "text" : "password";
							btn.setIcon(isHidden ? "eye-off" : "eye");
						}
					});
			});
		new Setting(containerEl)
			.setName("Spotify Client Secret")
			.setDesc("Client Secret (Keep this secured)")
			.addText((text) => {
				text.setPlaceholder("Enter your client Secret")
					.setValue(this.plugin.settings.spotifyClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.spotifyClientSecret = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.setAttribute("type", "password");
			})
			.addExtraButton((btn) => {
				btn.setIcon("eye")
					.setTooltip("Toggle visibility")
					.onClick(() => {
						const input = btn.extraSettingsEl.parentElement?.querySelector(
							"input",
						) as HTMLInputElement | null;
						if (input) {
							const isHidden = input.type === "password";
							input.type = isHidden ? "text" : "password";
							btn.setIcon(isHidden ? "eye-off" : "eye");
						}
					});
			});
		new Setting(containerEl)
			.setName("Spotify State")
			.setDesc("State")
			.addText((text) => {
				text.setPlaceholder("Enter your State")
					.setValue(this.plugin.settings.spotifyState)
					.onChange(async (value) => {
						this.plugin.settings.spotifyState = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.setAttribute("type", "password");
			})
			.addExtraButton((btn) => {
				btn.setIcon("eye")
					.setTooltip("Toggle visibility")
					.onClick(() => {
						const input = btn.extraSettingsEl.parentElement?.querySelector(
							"input",
						) as HTMLInputElement | null;
						if (input) {
							const isHidden = input.type === "password";
							input.type = isHidden ? "text" : "password";
							btn.setIcon(isHidden ? "eye-off" : "eye");
						}
					});
			});
		new Setting(containerEl)
			.setName("Spotify Redirect URI")
			.setDesc("Redirect URI (Read Only)")
			.addText((text) => {
				text.setValue("obsidian://spotify-auth/").setDisabled(true);
			});

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Templates" });
		const divDoc = containerEl.createDiv();

		divDoc.createEl("h6", { text: "External resources" });
		divDoc.createEl("p", { text: "Available variables (song):" });
		divDoc
			.createEl("ul")
			.createEl("li", { text: "{{ album }}" })
			.createEl("li", { text: "{{ album_release }}" })
			.createEl("li", { text: "{{ album_cover_large }}" })
			.createEl("li", { text: "{{ album_cover_medium }}" })
			.createEl("li", { text: "{{ album_cover_small }}" })
			.createEl("li", { text: "{{ album_cover_link_large }}" })
			.createEl("li", { text: "{{ album_cover_link_medium }}" })
			.createEl("li", { text: "{{ album_cover_link_small }}" })
			.createEl("li", { text: "{{ album_link }}" })
			.createEl("li", { text: "{{ artists }}" })
			.createEl("li", { text: "{{ artists_formatted:PREFIX:SUFFIX }}" })
			.createEl("li", { text: "{{ song_name }}" })
			.createEl("li", { text: "{{ song_link }}" })
			.createEl("li", { text: "{{ timestampz }}" })
			.createEl("li", { text: "{{ timestamp(HH:mm) }}" })
			.createEl("li", { text: "{{ timestampz(HH:mm) }}" })
			.createEl("li", { text: "{{ timestamp(YYYY-MM-DD) }}" })
			.createEl("li", { text: "{{ timestampz(YYYY-MM-DD) }}" })
			.createEl("li", { text: "{{ timestamp(YYYY-MM-DD HH:mm) }}" })
			.createEl("li", { text: "{{ timestampz(YYYY-MM-DD HH:mm) }}" })
			.createEl("li", { text: "{{ genres }}" })
			.createEl("li", { text: "{{ genres_array }}" })
			.createEl("li", { text: "{{ genres_hashtag }}" })
			.createEl("li", { text: "{{ followers }}" })
			.createEl("li", { text: "{{ artist_image }}" })
			.createEl("li", { text: "{{ popularity }}" })
			.createEl("li", { text: "{{ artist_names }}" })
			.createEl("li", { text: "{{ album_cover_url_large }}" })
			.createEl("li", { text: "{{ album_cover_url_medium }}" })
			.createEl("li", { text: "{{ album_cover_url_small }}" })
			.createEl("li", { text: "{{ song_url }}" })
			.createEl("li", { text: "{{ album_url }}" })
			.createEl("li", { text: "{{ main_artist_url }}" })
			.createEl("li", { text: "{{ playlists }}" });

		divDoc.createEl("p", { text: "Available variables (podcast):" });
		divDoc
			.createEl("ul")
			.createEl("li", { text: "{{ episode_name }}" })
			.createEl("li", { text: "{{ episode_link }}" })
			.createEl("li", { text: "{{ description }}" })
			.createEl("li", { text: "{{ duration_ms }}" })
			.createEl("li", { text: "{{ audio_preview_url }}" })
			.createEl("li", { text: "{{ episode_cover_large }}" })
			.createEl("li", { text: "{{ episode_cover_medium }}" })
			.createEl("li", { text: "{{ episode_cover_small }}" })
			.createEl("li", { text: "{{ episode_cover_link_large }}" })
			.createEl("li", { text: "{{ episode_cover_link_medium }}" })
			.createEl("li", { text: "{{ episode_cover_link_small }}" })
			.createEl("li", { text: "{{ release_date }}" })
			.createEl("li", { text: "{{ show_name }}" })
			.createEl("li", { text: "{{ publisher }}" })
			.createEl("li", { text: "{{ show_description }}" })
			.createEl("li", { text: "{{ show_link }}" })
			.createEl("li", { text: "{{ total_episodes }}" })
			.createEl("li", { text: "{{ progress_ms }}" })
			.createEl("li", { text: "{{ progress_sec }}" })
			.createEl("li", { text: "{{ progress_min_sec }}" })
			.createEl("li", { text: "{{ timestamp }}" })
			.createEl("li", { text: "{{ timestampz }}" })
			.createEl("li", { text: "{{ timestamp(HH:mm) }}" })
			.createEl("li", { text: "{{ timestampz(HH:mm) }}" })
			.createEl("li", { text: "{{ timestamp(YYYY-MM-DD) }}" })
			.createEl("li", { text: "{{ timestampz(YYYY-MM-DD) }}" })
			.createEl("li", { text: "{{ timestamp(YYYY-MM-DD HH:mm) }}" })
			.createEl("li", { text: "{{ timestampz(YYYY-MM-DD HH:mm) }}" });

		divDoc.createEl("p", { text: "Template Selection:" });
		divDoc.createEl("p", {
			text:
				"You have two options to specify a template: 'Inline' or 'Path-based'.",
		});
		divDoc
			.createEl("ul")
			.createEl("li", {
				text:
					"To use the inline method, simply include your template directly.",
			})
			.createEl("li", {
				text:
					"For path-based selection, you must reference the Vault. A valid example would be: 'Templates/Spotify/track.md' and the content structure is exactly the same as the inline template.",
			});

		new Setting(containerEl)
			.setName("Template for song")
			.setDesc(
				"Define a custom template to print the currently playing song (Song only) or a path to your template definition",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder(
						"Example: '{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n{{ timestamp }}",
					)
					.setValue(this.plugin.settings.templates[0])
					.onChange(async (value) => {
						this.plugin.settings.templates[0] = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Template for podcast")
			.setDesc(
				"Define a custom template to print the currently playing episode (Podcast only) or a path to your template definition",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder(
						"Example: '{{ podcast_name }}': {{ description }} released {{ release_date }}\n{{ timestamp }}",
					)
					.setValue(this.plugin.settings.templates[1])
					.onChange(async (value) => {
						this.plugin.settings.templates[1] = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Template for recently played tracks")
			.setDesc(
				"Define a custom template to print the recently played tracks or a path to your template definition",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder(
						"Example: '{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n",
					)
					.setValue(this.plugin.settings.templates[2])
					.onChange(async (value) => {
						this.plugin.settings.templates[2] = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Default destination")
			.setDesc(
				"Destination to store track or episode when using the command palette, default at the root of your vault",
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.defaultDestination)
					.onChange(async (value) => {
						this.plugin.settings.defaultDestination = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Allow overwrite")
			.setDesc("Overwrite the file if it already exists in the vault.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.overwrite);
				toggle.onChange(async (value: boolean) => {
					this.plugin.settings.overwrite = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Auto Open")
			.setDesc(
				"Automatically open the newly created file in the active leaf.",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoOpen);
				toggle.onChange(async (value: boolean) => {
					this.plugin.settings.autoOpen = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Append Artist Name(s)")
			.setDesc("Append artist name(s) to create unique filename.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.appendArtistNames);
				toggle.onChange(async (value: boolean) => {
					this.plugin.settings.appendArtistNames = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Default image size")
			.setDesc(
				"Default rendered size for cover and artist images (e.g. 200x200 or 200). Leave empty to let Obsidian use full width. Can be overridden per-token with {{ album_cover_medium|100x100 }}.",
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. 200x200")
					.setValue(this.plugin.settings.defaultImageSize)
					.onChange(async (value) => {
						this.plugin.settings.defaultImageSize = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default release date format")
			.setDesc(
				"Format for {{ album_release }} and {{ release_date }}. Tokens: YYYY, MM, DD. Leave empty to use the raw Spotify date (YYYY-MM-DD). Can be overridden per-token with {{ album_release|YYYY }}.",
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. YYYY")
					.setValue(this.plugin.settings.defaultReleaseDateFormat)
					.onChange(async (value) => {
						this.plugin.settings.defaultReleaseDateFormat = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Playlists" });

		new Setting(containerEl)
			.setName("Enable playlist features")
			.setDesc(
				"Enable playlist-related commands and the {{ playlists }} template token. Disable to opt out of all playlist API calls.",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enablePlaylists);
				toggle.onChange(async (value: boolean) => {
					this.plugin.settings.enablePlaylists = value;
					await this.plugin.saveSettings();
				});
			});

		const divPlaylistDoc = containerEl.createDiv();
		divPlaylistDoc.createEl("p", {
			text: "Available variables (all playlists template):",
		});
		divPlaylistDoc
			.createEl("ul")
			.createEl("li", { text: "{{ playlist_name }}" })
			.createEl("li", { text: "{{ playlist_link }}" })
			.createEl("li", { text: "{{ playlist_url }}" })
			.createEl("li", { text: "{{ playlist_description }}" })
			.createEl("li", { text: "{{ playlist_track_count }}" })
			.createEl("li", { text: "{{ playlist_cover_large }}" })
			.createEl("li", { text: "{{ playlist_cover_small }}" })
			.createEl("li", { text: "{{ playlist_cover_url }}" })
			.createEl("li", { text: "{{ playlist_owner }}" })
			.createEl("li", { text: "{{ playlist_public }}" })
			.createEl("li", { text: "{{ playlist_collaborative }}" });

		new Setting(containerEl)
			.setName("Playlist destination")
			.setDesc(
				"Folder for individual playlist files. Leave empty to use the vault root.",
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. Music/Playlists")
					.setValue(this.plugin.settings.playlistDestination)
					.onChange(async (value) => {
						this.plugin.settings.playlistDestination = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto-regenerate playlist notes")
			.setDesc(
				"When enabled, adding a song (via any track command) will automatically regenerate the individual playlist note files that contain that track. Requires individual playlist files to exist (use 'Create individual files for all playlists' first).",
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoRegeneratePlaylists);
				toggle.onChange(async (value: boolean) => {
					this.plugin.settings.autoRegeneratePlaylists = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Template for all playlists")
			.setDesc(
				"Define a custom template applied per playlist when using the 'all playlists' commands, or a path to your template definition",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder(
						"Example: **{{ playlist_name }}**\n{{ playlist_link }}\nTracks: {{ playlist_track_count }}",
					)
					.setValue(this.plugin.settings.templates[3] ?? "")
					.onChange(async (value) => {
						this.plugin.settings.templates[3] = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Spotify Integration (Advanced)" });
		new Setting(containerEl)
			.setName("Playlist concurrency")
			.setDesc(
				"Number of playlists to check in parallel when resolving {{ playlists }}. Higher = faster but more API calls at once. Default: 10.",
			)
			.addText((text) =>
				text
					.setPlaceholder("10")
					.setValue(String(this.plugin.settings.playlistConcurrency))
					.onChange(async (value) => {
						const n = parseInt(value, 10);
						this.plugin.settings.playlistConcurrency = n > 0 ? n : 10;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Spotify Scopes")
			.setDesc(
				"Scopes (space-separated list). The {{ playlists }} token requires 'playlist-read-private' and 'user-library-read'. Update only if you know what you are doing.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your Scopes")
					.setValue(this.plugin.settings.spotifyScopes)
					.onChange(async (value) => {
						this.plugin.settings.spotifyScopes = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("hr");

		containerEl.createEl("h5", { text: "Reset" });
		new Setting(containerEl)
			.setName("Clear Spotify session")
			.setDesc(
				"Removes the stored Spotify access token, refresh token, and expiration from local storage. Use this to force a full re-authentication.",
			)
			.addButton((button) =>
				button
					.setButtonText("Clear session")
					.setWarning()
					.onClick(() => {
						window.localStorage.removeItem("access_token");
						window.localStorage.removeItem("refresh_token");
						window.localStorage.removeItem("expires_in");
						button.setButtonText("Cleared!");
						button.setDisabled(true);
					})
			);

		containerEl.createEl("hr");

		containerEl.createEl("a", {
			href: "https://studiowebux.github.io/obsidian-spotify-link",
			text: "Official Plugin Documentation",
		});
	}
}
