import { App, PluginSettingTab, Setting } from "obsidian";
import { SpotifyLinkSettings } from "./types";
import SpotifyLinkPlugin from "./main";

export const DEFAULT_SETTINGS: SpotifyLinkSettings = {
	spotifyClientId: "",
	spotifyClientSecret: "",
	spotifyScopes: "user-read-currently-playing",
	spotifyState: "it-can-be-anything",
};

export default class SettingsTab extends PluginSettingTab {
	plugin: SpotifyLinkPlugin;

	constructor(app: App, plugin: SpotifyLinkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Spotify Link Settings" });

		containerEl.createEl("h5", { text: "Spotify Integration" });

		// INSTRUCTIONS
		const div = containerEl.createDiv();
		div.createEl("p", {
			text: "Follow the link below to get your Client Id and Client Secret, you need a spotify account to get access.",
		});
		div.createEl("a", {
			href: "https://developer.spotify.com/dashboard/",
			text: "Spotify Developer",
		});
		div.createEl("ul")
			.createEl("li", { text: "Create an App" })
			.createEl("li", { text: "Click Settings" })
			.createEl("li", { text: "Copy the Client Id and Secret" });
		div.createEl("p", {
			text: "NOTICE: The id and secret will be stored unencrypted on your local device. If you sync your data to a public source, the id and secret will be shown as-is.",
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
			});
		containerEl.createEl("hr");
		containerEl.createEl("h5", { text: "Spotify Integration (Advanced)" });
		new Setting(containerEl)
			.setName("Spotify Scopes")
			.setDesc(
				"Scopes (comma-delimited list, you should update this only if you know what you are doing."
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
	}
}
