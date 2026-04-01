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

Array of menu items for right-click integration:

```typescript
{
  name: string,
  enabled: boolean,
  id: string
}
```

Default items:
- Create file for currently playing episode (with/without template)
- Create file for currently playing track (with/without template)
- Create file for recently played tracks

## Initial Connection

1. Configure Client ID and Secret
2. Click Spotify icon in left ribbon
3. Browser opens OAuth flow
4. Grant permissions
5. Redirect back to Obsidian
6. Status bar updates to "Spotify Connected"

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
    "**Episode Name:** {{ episode_name }}\n**Description:** {{ description }}..."
  ],
  defaultDestination: "",
  overwrite: false,
  autoOpen: false,
  appendArtistNames: false,
  defaultImageSize: "",
  defaultReleaseDateFormat: ""
}
```

## Troubleshooting

**Connection fails**
- Verify Client ID/Secret
- Check Redirect URI matches exactly
- Ensure scopes are correct

**Token expired**
- Use "Refresh session" command
- Check localStorage for `access_token`

**Template not found**
- Verify path relative to vault root
- Check file extension (auto-appends `.md`)
- Fallback to inline if path invalid
