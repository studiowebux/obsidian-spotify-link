---
title: Changelog
description: Release history for Spotify Link
tags:
  - changelog
  - releases
---

# Changelog

## 1.16.0

Reliability release. Three plugin bugs and one upstream API migration.

### Fixed

- **Authentication failed when the Web viewer core plugin was enabled.** The login URL was opened with `window.open`, which Web viewer intercepts — the consent page loaded in an in-app view that cannot follow the `obsidian://spotify-auth/` redirect. Login now goes through the system browser, with a copy-link and a paste-the-redirect-URL fallback. See [Known issue](configuration.md#known-issue-the-web-viewer-core-plugin).
- **Auto-login never ran on a default install.** A disabled context-menu entry aborted plugin startup before the session was restored, so the status bar stayed on "Spotify not Connected" until *Refresh session* was run by hand. Context menu toggles now also apply without reloading the plugin.
- **Playlist commands failed with no message at all.** *Create individual files for all playlists* had no error handling: when the call failed, no folder, no file and no notice were produced, and the reason was only visible in the developer console. Every command now reports failures.
- **Playlist folders were not created for nested destinations,** and a *Playlist destination* pointing at the vault root produced a bogus folder path. Missing parent folders are now created.
- **Errors said nothing useful.** Obsidian's `requestUrl` throws on any 4xx before the plugin can read Spotify's response, so the existing scope hints never ran and users saw `Request failed, status 403`. Failures are now mapped to actionable messages naming the failing call, the missing scope, and what to do — see [Troubleshooting](configuration.md#troubleshooting).
- The authorization URL is now correctly percent-encoded.
- "No song is playing" is reported as such instead of "Unable to get the currently playing track".

### Changed — Spotify API migration

Spotify migrated Development Mode apps on 9 March 2026 ([changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026), [migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)). Every plugin user runs such an app, so the plugin moved to the current endpoints:

- Playlist contents are read from `/playlists/{id}/items` instead of the removed `/playlists/{id}/tracks`.
- Saved-track checks use `/me/library/contains` instead of the removed `/me/tracks/contains`.
- Playlist track counts read `items.total` instead of `tracks.total`.

This restores `{{ playlists }}` and `{{ playlist_track_count }}`, which had been silently returning nothing.

### Deprecated

The following render `_deprecated_` when Spotify returns no value for them, which for most accounts is always. They are kept so existing templates do not start printing raw `{{ ... }}` text in notes, and will be removed in a future release:

`{{ popularity }}`, `{{ followers }}`, `{{ track_popularity }}`, `{{ album_popularity }}`, `{{ album_genres }}`, `{{ album_genres_array }}`, `{{ album_genres_hashtag }}`, `{{ audio_preview_url }}`

Artist genres (`{{ genres }}` and friends) still work, but Spotify only classifies some artists — an empty result is missing upstream data, not a plugin failure. See [Genres — best effort](templates.md#genres--best-effort).

Where Spotify does still return a value it is rendered as before. The `/albums/{id}` request is still made only when a template uses one of the album variables.

### Note

Development Mode apps now require the app owner to hold an active Spotify Premium subscription. Without it, every request fails with 403 regardless of plugin settings.
