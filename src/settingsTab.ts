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
      text: "Follow the link below to get your Client Id and Client Secret, you need a spotify account to get access.",
    });
    div.createEl("a", {
      href: "https://developer.spotify.com/dashboard/",
      text: "Spotify Developer",
    });
    div
      .createEl("ol")
      .createEl("li", { text: "Create an App" })
      .createEl("li", { text: "Click Settings" })
      .createEl("li", { text: "Copy the Client Id and Secret" })
      .createEl("li", {
        text: "Set the Redirect URI to : obsidian://spotify-auth/",
      })
      .createEl("li", {
        text: "Select the Spotify icon located in Obsidian's left sidebar to connect.",
      });
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
        text
          .setPlaceholder("Enter your client id")
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
        text
          .setPlaceholder("Enter your client Secret")
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
        text
          .setPlaceholder("Enter your State")
          .setValue(this.plugin.settings.spotifyState)
          .onChange(async (value) => {
            this.plugin.settings.spotifyState = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.setAttribute("type", "password");
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

    divDoc.createEl("a", {
      href: "https://studiowebux.github.io/obsidian-plugins-docs/docs/spotify-link/custom-template",
      text: "Custom Template Documentation",
    });
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
      .createEl("li", { text: "{{ song_name }}" })
      .createEl("li", { text: "{{ song_link }}" })
      .createEl("li", { text: "{{ timestamp }}" });

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
      .createEl("li", { text: "{{ timestamp }}" });

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
          }),
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
          }),
      );

    containerEl.createEl("hr");

    containerEl.createEl("h5", { text: "Spotify Integration (Advanced)" });
    new Setting(containerEl)
      .setName("Spotify Scopes")
      .setDesc(
        "Scopes (comma-delimited list, you should update this only if you know what you are doing.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your Scopes")
          .setValue(this.plugin.settings.spotifyScopes)
          .onChange(async (value) => {
            this.plugin.settings.spotifyScopes = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("hr");

    containerEl.createEl("a", {
      href: "https://studiowebux.github.io/obsidian-plugins-docs/docs/category/plugin-spotify-link",
      text: "Official Plugin Documentation",
    });
  }
}
