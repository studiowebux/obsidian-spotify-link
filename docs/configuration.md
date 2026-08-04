---
title: Configuration
description: Plugin settings and Spotify App setup
tags:
  - configuration
  - setup
  - spotify-api
---

# Configuration

Setup and configuration reference for Spotify Link plugin.

## Spotify App Setup

### Create Developer Application

1. Navigate to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with Spotify account
3. Click "Create app"
4. Fill app details (name/description)
5. Click "Settings"
6. Copy Client ID and Client Secret
7. Add Redirect URI: `obsidian://spotify-auth/`
8. Save changes

:::warning
Client ID and Secret are stored unencrypted in plugin data. Avoid syncing to public repositories.
:::

## Plugin Settings

### Authentication

**Spotify Client ID**
- Required for API access
- Displayed as password field
- Location: Plugin Settings → Spotify Client ID

**Spotify Client Secret**
- Required for token exchange
- Displayed as password field
- Keep secure

**Spotify State**
- OAuth state parameter for CSRF protection
- Default: `it-can-be-anything`
- Change if implementing custom security

**Spotify Scopes**
- Default: `user-read-currently-playing user-read-recently-played playlist-read-private user-library-read`
- `playlist-read-private` and `user-library-read` are required for the `{{ playlists }}` template token
- Modify only if extending functionality
- Space-separated list
- **Existing users:** if you installed before these scopes were added, append `playlist-read-private user-library-read` to your scopes setting and re-authenticate (click the Spotify ribbon icon)

### Templates

Four template slots:

1. **Template for song** - Track insertion format
2. **Template for podcast** - Episode insertion format
3. **Template for recently played tracks** - History format
4. **Template for all playlists** - Per-playlist format (see [All Playlists Variables](templates.md#all-playlists-variables))

Templates can be:

- **Inline**: Direct template string in settings
- **Path-based**: Reference to vault file (e.g., `Templates/Spotify/track.md`)

See [Templates → Variables](templates.md#variables) for the full token reference, including:
- `{{ genres }}`, `{{ genres_array }}`, `{{ genres_hashtag }}` — artist genres (deduplicated)
- `{{ genres_by_artist }}` / `{{ genres_by_artist:SEP }}` — per-artist genre breakdown with optional separator override
- `{{ album_genres }}`, `{{ album_popularity }}`, `{{ track_popularity }}`, `{{ popularity }}`, `{{ followers }}` — deprecated, render `_deprecated_` (see [Deprecated variables](templates.md#deprecated-variables))

Path resolution attempts:

1. Exact path
2. Path with `.md` extension
3. Fallback to inline if not found

### File Behavior

**Default destination**
- Target folder for created files
- Empty = vault root
- Example: `Music/Tracks`

**Allow overwrite**
- Toggle: Overwrite existing files
- Default: `false`
- When disabled, shows error on collision

**Auto Open**
- Toggle: Open created files automatically
- Default: `false`
- Opens in active leaf

**Append Artist Name(s)**
- Toggle: Include artists in filename
- Default: `false`
- Format: `TrackName-Artist1_Artist2.md`

**Default image size**
- Rendered size for all cover and artist image tokens
- Default: `""` (Obsidian renders at full width)
- Format: `WxH` (e.g. `200x200`) or width only (e.g. `200`)
- Can be overridden per-token: `{{ album_cover_medium|100x100 }}`

**Default release date format**
- Output format for `{{ album_release }}` and `{{ release_date }}`
- Default: `""` (raw Spotify date, e.g. `2024-03-15`)
- Tokens: `YYYY`, `MM`, `DD` (e.g. `YYYY` → `2024`, `MM/YYYY` → `03/2024`)
- Can be overridden per-token: `{{ album_release|YYYY }}`

### Playlists

**Enable playlist features**
- Toggle: Enable or disable all playlist-related commands and the `{{ playlists }}` template token
- Default: `true`
- When disabled, playlist commands show a notice and return early, and `{{ playlists }}` resolves to empty

**Playlist destination**
- Target folder for individual playlist files
- Empty = vault root
- Example: `Music/Playlists`
- Can be overridden by the context menu (right-click → folder)

**Auto-regenerate playlist notes**
- Toggle: Automatically regenerate individual playlist note files when a track command runs
- Default: `false`
- When enabled, after adding a song, the plugin finds which playlists contain that track and updates the corresponding note files
- Requires individual playlist files to exist first (use the "Create individual files for all playlists" command)
- If the track template already uses `{{ playlists }}`, the playlist lookup result is cached and reused (no extra API call)

**Playlist concurrency**
- Number of playlists to check in parallel when resolving `{{ playlists }}`
- Default: `10`
- Higher values = faster but more concurrent API calls

### Context Menu

Each item can be toggled on or off in **Plugin Settings → Context Menu**. Changes take effect immediately.

Right-clicking a **file** creates the new note in that file's parent folder. Right-clicking a **folder** creates it inside that folder.

Default items and their default state:

| Item | Default |
|---|---|
| Create file for currently playing episode using template | enabled |
| Create file for currently playing episode | enabled |
| Create file for currently playing track using template | enabled |
| Create file for currently playing track | enabled |
| Create file for recently played tracks using template | enabled |
| Create file for track by Spotify ID or URL using template | disabled |

New items added in future versions are automatically merged into existing settings (no manual reset required).

## Initial Connection

1. Configure Client ID and Secret
2. Click Spotify icon in left ribbon
3. Your system browser opens the Spotify consent page
4. Grant permissions
5. Redirect back to Obsidian
6. Status bar updates to "Spotify Connected"

### Known issue: the Web viewer core plugin

**Symptom:** you click the Spotify ribbon icon and the consent page opens *inside* Obsidian in a tab. You approve access and nothing happens — the status bar still says "Spotify not Connected".

**Why:** Obsidian's **Web viewer** core plugin intercepts `window.open` so external links open in an in-app tab instead of your browser. That in-app view cannot follow the `obsidian://spotify-auth/` redirect that hands the authorization code back to the plugin, so the flow dead-ends.

**What the plugin does about it:** the login now goes through Electron's `shell.openExternal`, which hands the URL to your operating system and bypasses the interception. If that is unavailable (mobile, unusual setups), the login dialog gives you two fallbacks:

- **Copy link** — paste it into a real browser yourself.
- **Paste the redirect URL** — after approving in the browser, copy the `obsidian://spotify-auth/?code=...&state=...` URL it was sent to and paste it into the dialog to finish connecting.

You do not need to disable Web viewer.

## Token Management

Tokens automatically refresh when expired. Manual refresh available via command palette:

`Spotify Link: Refresh session`

Token persistence across Obsidian restarts via localStorage.

## Default Settings

```typescript
{
  spotifyClientId: "",
  spotifyClientSecret: "",
  spotifyScopes: "user-read-currently-playing user-read-recently-played playlist-read-private user-library-read",
  spotifyState: "it-can-be-anything",
  templates: [
    "**Song Name:** {{ song_name }}\n**Album:** {{ album }}...",
    "**Episode Name:** {{ episode_name }}\n**Description:** {{ description }}...",
    "",
    "**{{ playlist_name }}**\n{{ playlist_link }}\nTracks: {{ playlist_track_count }}..."
  ],
  defaultDestination: "",
  overwrite: false,
  autoOpen: false,
  appendArtistNames: false,
  defaultImageSize: "",
  defaultReleaseDateFormat: "",
  enablePlaylists: true,
  autoRegeneratePlaylists: false,
  playlistDestination: "",
  playlistConcurrency: 10
}
```

### Reset

**Clear Spotify session**
- Removes `access_token`, `refresh_token`, and `expires_in` from localStorage
- The first step of [Start from a clean slate](#start-from-a-clean-slate) — use it after changing scopes or whenever the connection state looks wrong
- After clearing, click the Spotify ribbon icon to re-authenticate

## Start from a clean slate

When the plugin misbehaves in a way you cannot explain, reset it in this order. Each step throws away more state, so stop as soon as it works.

1. **Clear Spotify session** (Settings → Reset). Removes `access_token`, `refresh_token` and `expires_in` from local storage. This fixes anything caused by a stale or partially-written token — including tokens issued before you changed your scopes.
2. **Reload the plugin** (Settings → Community plugins → toggle off/on). Re-runs the startup auto-login with the cleared state.
3. **Click the Spotify ribbon icon** and authenticate again. This is required after step 1 — clearing the session logs you out on purpose.
4. **Re-check the Spotify app settings** if it still fails: the Redirect URI must be exactly `obsidian://spotify-auth/`, and the Client ID/Secret must match the app you are looking at.
5. **Full reset.** Quit Obsidian, delete `.obsidian/plugins/spotify-link/data.json` in your vault, restart. This discards every setting including your templates, so copy anything you want to keep first.

Why the split: your credentials and templates live in `data.json`, but your session tokens live in the browser's local storage. Clearing one does not clear the other, which is why "it still says not connected" can survive a settings change.

## Troubleshooting

Errors are surfaced as notices and logged in full to the developer console (`Ctrl+Shift+I` / `Cmd+Option+I`), prefixed with `Spotify Link Plugin:`. Every message names the call that failed, e.g. `[getAllPlaylists]`.

| What you see | What it means | What to do |
|---|---|---|
| *Add your Client ID and Client Secret…* | The ribbon was clicked before credentials were saved | Fill both fields in settings |
| *Your Spotify session is no longer valid* (401) | Token expired or was revoked | Click the ribbon icon to reconnect, or run *Clear Spotify session* |
| *Spotify refused this request (403)* | Missing scope, or your app lost access | The message names the scope — add it to *Spotify Scopes* and re-authenticate. Also check the Premium requirement below |
| *Not found (404)* | The item does not exist, or the endpoint was removed | Verify the track/episode URL; if it is a plugin call, report it |
| *Spotify rate limit reached (429)* | Too many calls too quickly | Wait the reported delay; lower *Playlist concurrency*; disable *Auto-regenerate playlist notes* |
| *Nothing is currently playing* | Spotify returned 204 — playback is stopped | Start playback and retry |
| *Could not reach Spotify* | No network, or requests are blocked | Check connectivity/VPN/firewall |
| *Spotify is having trouble* (5xx) | Outage on Spotify's side | Retry later |

### Development Mode apps require Premium

Since February 2026, the app you created in the Spotify Developer Dashboard runs in Development Mode, and Spotify requires **the app owner to hold an active Spotify Premium subscription**. If the subscription lapses the app stops working and every call fails with 403 — no plugin setting can work around it. Access resumes when the subscription does.

See the [February 2026 changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) and [migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide).

### Fields Spotify no longer returns

Some template variables render `_deprecated_` because Spotify removed the underlying field, not because the plugin failed. See [Deprecated variables](templates.md#deprecated-variables) for the list and the reasoning.

**Template not found**
- Verify path relative to vault root
- Check file extension (auto-appends `.md`)
- Fallback to inline if path invalid

**Template produces an error notice**
- Open the Obsidian developer console (Ctrl+Shift+I on Windows/Linux, Cmd+Option+I on Mac) and look for `Spotify Link Plugin:` entries — the full stack trace is logged there alongside every error notice
- Common causes: a token referencing a field the Spotify API did not return for that track (e.g. `{{ genres }}` for a local file, `{{ followers }}` for an artist with no follower data). These are now safely guarded and return `""` or `0` instead of crashing.
