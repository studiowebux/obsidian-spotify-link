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
- `{{ album_release }}` - Release date (YYYY-MM-DD)

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
- `{{ popularity }}` - Popularity score 0-100
- `{{ artist_image }}` - Artist images as markdown
- `{{ genres }}` - Comma-separated genres
- `{{ genres_array }}` - Quoted genre array: `"genre1", "genre2"`
- `{{ genres_hashtag }}` - Hashtag format: `#genre_one #genre_two`

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
- `{{ release_date }}` - Episode release date

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

Genres across multiple artists are deduplicated automatically.

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
