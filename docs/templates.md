---
title: Templates
description: Template system and variable reference for Spotify Link
tags:
  - templates
  - variables
  - customization
---

# Templates

Template system for customizing Spotify data insertion.

## Template Types

### Inline Templates

Direct string in settings:

```
'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}
{{ timestamp }}
```

### File-based Templates

Reference to vault file:

```
Templates/Spotify/track.md
```

File contains same syntax as inline templates.

## Variables

### Track Variables

**Basic Info**

- `{{ song_name }}` - Track title
- `{{ song_link }}` - Markdown link with track name and artists
- `{{ song_url }}` - Spotify URL (plain text)

**Album**

- `{{ album }}` - Album name
- `{{ album_link }}` - Markdown link to album
- `{{ album_url }}` - Album Spotify URL
- `{{ album_release }}` - Release date, format controlled by setting or inline override (see [Date formatting](#date-formatting))

**Album Covers**

- `{{ album_cover_large }}` - Large cover as markdown image
- `{{ album_cover_medium }}` - Medium cover as markdown image
- `{{ album_cover_small }}` - Small cover as markdown image
- `{{ album_cover_link_large }}` - Large cover as markdown link
- `{{ album_cover_link_medium }}` - Medium cover as link
- `{{ album_cover_link_small }}` - Small cover as link
- `{{ album_cover_url_large }}` - Large cover URL (plain)
- `{{ album_cover_url_medium }}` - Medium cover URL
- `{{ album_cover_url_small }}` - Small cover URL

Image tokens accept an optional inline size override — see [Image dimensions](#image-dimensions).

**Artists**

- `{{ artists }}` - Comma-separated artist names
- `{{ artist_name }}` - Same as artists
- `{{ artists_formatted:PREFIX:SUFFIX }}` - Custom formatting
- `{{ main_artist_url }}` - Primary artist API URL

Example formatted artists:

```
{{ artists_formatted:  - [[:]] }}
```

Output:
```
 - [[Artist One]]
 - [[Artist Two]]
```

Hashtag format:

```
{{ artists_formatted:#: }}
```

Output: `#Artist_One #Artist_Two`

**Artist Metadata**

- `{{ followers }}` - Follower count (single: number, multiple: "Name: count")
- `{{ popularity }}` - Artist popularity score 0–100 (single: number, multiple: "Name: score")
- `{{ track_popularity }}` - Track popularity score 0–100 (Spotify's score for the track itself)
- `{{ album_popularity }}` - Album popularity score 0–100. Requires a separate API call (`GET /v1/albums/{id}`) — only fetched when the token is present in the template
- `{{ artist_image }}` - Artist images as markdown image (accepts inline size override, see [Image dimensions](#image-dimensions))
- `{{ artist_image_link }}` - Artist images as markdown link (no `!` prefix)
- `{{ artist_image_url }}` - Artist image URLs (plain text)
- `{{ genres }}` - Comma-separated artist genres, deduplicated across all artists
- `{{ genres_array }}` - Artist genre list formatted for YAML/Dataview arrays: `"genre1", "genre2"`, deduplicated across all artists
- `{{ genres_hashtag }}` - Artist genres as hashtags: `#genre_one #genre_two`, deduplicated across all artists
- `{{ album_genres }}` - Comma-separated album genres. Requires a separate API call (`GET /v1/albums/{id}`) — only fetched when the token is present in the template. Returns empty string if the album has no genres.
- `{{ album_genres_array }}` - Album genres formatted for YAML/Dataview arrays: `"genre1", "genre2"`
- `{{ album_genres_hashtag }}` - Album genres as hashtags: `#genre_one #genre_two`

**Playlists**

- `{{ playlists }}` - Comma-separated names of the user's owned playlists that contain the current track, plus "Liked Songs" if saved. Requires `playlist-read-private` and `user-library-read` scopes (included in the default scope for new installations). Only fetched when the token is present in the template.

> **Performance note:** The Spotify API does not provide a way to look up which playlists contain a given track. The plugin must scan each of your owned playlists individually, which can be slow depending on how many playlists you have and how many tracks they contain. The scan runs in parallel batches (configurable via the *Playlist concurrency* setting) to minimize wait time. A notification shows progress and reports the total time when complete.

**Timestamps**

- `{{ timestamp }}` - Local date and time
- `{{ timestampz }}` - UTC ISO format
- `{{ timestamp(YYYY-MM-DD) }}` - Custom date format
- `{{ timestamp(HH:mm) }}` - Custom time format
- `{{ timestamp(YYYY-MM-DD HH:mm) }}` - Combined format
- `{{ timestampz(...) }}` - UTC variants

### Episode Variables

**Basic Info**

- `{{ episode_name }}` - Episode title
- `{{ episode_link }}` - Markdown link to episode
- `{{ episode_url }}` - Episode Spotify URL (plain text)
- `{{ description }}` - Full description
- `{{ description[100] }}` - Truncated to 100 chars (adds `...`)
- `{{ release_date }}` - Release date, format controlled by setting or inline override (see [Date formatting](#date-formatting))

**Episode Covers**

- `{{ episode_cover_large }}` - Large cover as markdown image
- `{{ episode_cover_medium }}` - Medium cover as markdown image
- `{{ episode_cover_small }}` - Small cover as markdown image
- `{{ episode_cover_link_large }}` - Large cover as link
- `{{ episode_cover_link_medium }}` - Medium cover as link
- `{{ episode_cover_link_small }}` - Small cover as link
- `{{ episode_cover_url_large }}` - Large cover URL (plain)
- `{{ episode_cover_url_medium }}` - Medium cover URL
- `{{ episode_cover_url_small }}` - Small cover URL

Image tokens accept an optional inline size override — see [Image dimensions](#image-dimensions).

**Show Info**

- `{{ show_name }}` - Podcast name
- `{{ show_link }}` - Spotify URL for show
- `{{ show_description }}` - Podcast description
- `{{ publisher }}` - Podcast publisher
- `{{ total_episodes }}` - Total episode count

**Playback**

- `{{ duration_ms }}` - Episode duration in milliseconds
- `{{ progress_ms }}` - Current position in milliseconds
- `{{ progress_sec }}` - Current position in seconds
- `{{ progress_min_sec }}` - Formatted as "MM:SS"
- `{{ audio_preview_url }}` - Preview audio URL (if available)

**Timestamps**

Same format as track timestamps (see above).

### All Playlists Variables

Used with the "all playlists" commands. Each token is replaced per playlist.

**Basic Info**

- `{{ playlist_name }}` - Playlist name
- `{{ playlist_link }}` - Markdown link to playlist on Spotify
- `{{ playlist_url }}` - Spotify URL (plain text, `open.spotify.com`)
- `{{ playlist_description }}` - Playlist description
- `{{ playlist_track_count }}` - Number of tracks in the playlist

**Covers**

- `{{ playlist_cover_large }}` - Largest cover as markdown image
- `{{ playlist_cover_small }}` - Smallest cover as markdown image
- `{{ playlist_cover_url }}` - Largest cover URL (plain text)

Image tokens accept an optional inline size override — see [Image dimensions](#image-dimensions).

**Metadata**

- `{{ playlist_owner }}` - Owner display name
- `{{ playlist_public }}` - `true` or `false`
- `{{ playlist_collaborative }}` - `true` or `false`

**Example output** for `{{ playlist_name }} ({{ playlist_track_count }} tracks) — {{ playlist_url }}`:

```
My Favorites (142 tracks) — https://open.spotify.com/playlist/abc123
```

**Example output** for `{{ playlist_link }}`:

```
[My Favorites](https://open.spotify.com/playlist/abc123)
```

**Cover images — size variants:**

No size (full width):
```
{{ playlist_cover_large }}
→ ![My Favorites](https://mosaic.scdn.co/image/abc123)
```

Inline size override:
```
{{ playlist_cover_large|200x200 }}
→ ![My Favorites|200x200](https://mosaic.scdn.co/image/abc123)
```

Width only:
```
{{ playlist_cover_small|100 }}
→ ![My Favorites|100](https://mosaic.scdn.co/image/abc123-small)
```

Inside a Markdown table (escaped pipe):
```
| Cover |
| ----- |
| {{ playlist_cover_large\|150x150 }} |
→ ![My Favorites\|150x150](https://mosaic.scdn.co/image/abc123)
```

The *Default image size* setting (e.g. `200x200`) applies to all cover tokens unless overridden inline. See [Image dimensions](#image-dimensions) for details.

### Track by ID / URL

All track variables are available when using the **"Append track by Spotify ID or URL"** or **"Create file for track by Spotify ID or URL"** commands. These commands accept:

- A full Spotify track URL: `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`
- A bare track ID: `4iV5W9uYEdYUVa79Axb7Rh`

The same song template (slot 1) is used. `{{ timestamp }}` reflects the time of insertion, not playback. `{{ playlists }}` is supported if playlist features are enabled.

### Recently Played Variables

Supports all track variables plus:

- `{{ played_at }}` - When track was played (YYYY-MM-DD HH:mm)

## Examples

### Minimal Track Template

```
'{{ song_name }}' by {{ artists }}
{{ timestamp }}
```

### Detailed Track Template

```
**Song Name:** {{ song_name }}
**Song URL:** {{ song_link }}
**Album Name:** {{ album }}
**Album Release Date:** {{ album_release }}
**Album URL:** {{ album_link }}
**Cover:** {{ album_cover_medium }}
**Artists:** {{ artists }}
**Genres:** {{ genres_hashtag }}
**Added at:** *{{ timestamp }}*
```

### Track with Playlists

```
**Song:** {{ song_name }}
**Artists:** {{ artists }}
**Playlists:** {{ playlists }}
```

Output: `**Playlists:** My Favorites, Workout Mix, Chill Vibes`

### All Playlists Template

```
---
playlist: "{{ playlist_name }}"
url: "{{ playlist_url }}"
tracks: {{ playlist_track_count }}
public: {{ playlist_public }}
collaborative: {{ playlist_collaborative }}
owner: "{{ playlist_owner }}"
---

## {{ playlist_name }}

{{ playlist_cover_large|300x300 }}

**Link:** {{ playlist_link }}
**Tracks:** {{ playlist_track_count }}
**Owner:** {{ playlist_owner }}
**Public:** {{ playlist_public }} | **Collaborative:** {{ playlist_collaborative }}

> {{ playlist_description }}

---
```

### Minimal All Playlists Template

```
- {{ playlist_link }} ({{ playlist_track_count }} tracks)
```

### Episode Template

```
**Episode:** {{ episode_name }}
**Show:** {{ show_name }}
**Publisher:** {{ publisher }}
**Description:** {{ description[200] }}
**Progress:** {{ progress_min_sec }}
**Released:** {{ release_date }}
{{ timestamp }}
```

### Recently Played Template

```
'{{ song_name }}' by {{ artists }} from {{ album }} @ {{ played_at }}
```

### Dataview Integration

```
---
track: "{{ song_name }}"
artists: [{{ artists_formatted:":, }}]
album: "{{ album }}"
release: {{ album_release }}
genres: [{{ genres_array }}]
---

# {{ song_name }}

{{ album_cover_medium }}

**Artists:** {{ artists }}
**Genres:** {{ genres_hashtag }}
```

## Template Processing

Variable substitution uses regex replacement:

1. Load template (file or inline)
2. Fetch Spotify data
3. Replace variables with actual values
4. Handle special cases (formatting, truncation)
5. Return processed string

Whitespace in variable syntax is optional:

- `{{ song_name }}` = `{{song_name}}`

## Advanced Formatting

### Conditional Artist Display

Single artist: followers as number
Multiple artists: "Name: count" per artist

Template automatically adapts based on artist count.

### Genre Deduplication

Spotify assigns genres at the **artist** and **album** level — there are no genres on the track object itself.

- `{{ genres }}`, `{{ genres_array }}`, `{{ genres_hashtag }}` — sourced from the artist(s). Collected from all artists on the track and deduplicated automatically. A track with two artists sharing a genre will still list that genre only once.
- `{{ album_genres }}`, `{{ album_genres_array }}`, `{{ album_genres_hashtag }}` — sourced from the album. Fetched via a separate API call; only made when the token is present in the template.

In practice, album-level genres on Spotify are often empty or sparse. Artist genres tend to be more populated.

### Timestamp Formats

Combine date/time components:

```
{{ timestamp(YYYY-MM-DD HH:mm) }}
```

UTC variants with `z` suffix:

```
{{ timestampz(YYYY-MM-DD HH:mm) }}
```

### Image Size Selection

Spotify provides three sizes (indices 0, 1, 2):

- `[0]` - Large (typically 640x640)
- `[1]` - Medium (typically 300x300)
- `[2]` - Small (typically 64x64)

### Image Dimensions

By default Obsidian renders images at full available width. You can constrain the size two ways:

**Global default** — set *Default image size* in plugin settings (e.g. `200x200`). Applies to every image token unless overridden.

**Inline override** — append `|WxH` or `|W` directly to the token:

```
{{ album_cover_medium|100x100 }}
{{ album_cover_large|300 }}
{{ artist_image|50x50 }}
{{ episode_cover_medium|150x150 }}
```

Inline override takes precedence over the setting. The value is passed directly to Obsidian's image syntax (`![alt|WxH](url)`), so any value Obsidian accepts works here.

**Inside Markdown tables** — `|` is the column separator in Markdown, so escape it with `\|`:

```
| Cover | Date |
| ----- | ---- |
| {{ album_cover_medium\|100x100 }} | {{ album_release\|YYYY }} |
```

The plugin detects the `\|` and preserves it in the generated output (`![alt\|WxH](url)`), keeping the table structure intact.

> **Note:** the *Global default* image size setting does not carry the table context — it always outputs a bare `|`. If you need a sized image inside a table, use the inline `\|` override explicitly.

### Date Formatting

`{{ album_release }}` (tracks) and `{{ release_date }}` (episodes) output Spotify's raw date by default (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY` depending on precision).

**Global default** — set *Default release date format* in plugin settings. Tokens: `YYYY`, `MM`, `DD`.

**Inline override** — append `|FORMAT` to the token:

```
{{ album_release|YYYY }}
{{ album_release|YYYY-MM }}
{{ album_release|MM/DD/YYYY }}
{{ release_date|YYYY }}
```

**Inside Markdown tables** — use `\|` instead of `|`:

```
{{ album_release\|YYYY }}
{{ release_date\|YYYY-MM }}
```

Inline override takes precedence over the setting. Leaving both empty preserves the original Spotify date string (fully backward compatible).

> **Note:** date tokens produce plain text output (no `|` character), so the *Global default* date format works fine inside tables without any special handling.
