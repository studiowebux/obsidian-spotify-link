This is the template I use to test and update this plugin

**Song Name:** {{ song_name }}
**Song URL:** {{ song_link }}
**Album Name:** {{ album }}
**Album Release Date:** {{ album_release }}
**Album URL:** {{ album_link }}
**Cover:** {{ album_cover_medium }}
**Cover URL:** {{ album_cover_link_medium }}
**Artists:** {{ artists }}
**Added at:** *{{ timestamp }}*

**Timestamp tests:**

timestamp : {{ timestamp }}
timestampz : {{ timestampz }}
timestamp(HH:mm) : {{ timestamp(HH:mm) }}
timestampz(HH:mm) : {{ timestampz(HH:mm) }}
timestamp(YYYY-MM-DD) : {{ timestamp(YYYY-MM-DD) }}
timestampz(YYYY-MM-DD) : {{ timestampz(YYYY-MM-DD) }}
timestamp(YYYY-MM-DD HH:mm) : {{ timestamp(YYYY-MM-DD HH:mm) }}
timestampz(YYYY-MM-DD HH:mm) : {{ timestampz(YYYY-MM-DD HH:mm) }}

## Genres

| Token | Output |
| ----- | ------ |
| artist genres | {{ genres }} |
| artist genres array | {{ genres_array }} |
| artist genres hashtag | {{ genres_hashtag }} |
| per-artist breakdown | {{ genres_by_artist }} |
| per-artist (semicolon) | {{ genres_by_artist:; }} |
| album genres | {{ album_genres }} |
| album genres array | {{ album_genres_array }} |
| album genres hashtag | {{ album_genres_hashtag }} |

Artists values:

artist_name: {{ artist_name }}
Popularity: {{ popularity }}
Followers: {{ followers }}
Artist images: {{ artist_image }}

Artists
{{ artists_formatted:  - [[:]] }}

**Image dimension tests (inline override):**

Cover large, no size (uses setting default): {{ album_cover_large }}
Cover medium, fixed 200x200: {{ album_cover_medium|200x200 }}
Cover small, width only 100: {{ album_cover_small|100 }}
Artist image, fixed 50x50: {{ artist_image|50x50 }}

**Date format tests (inline override):**

Raw date (uses setting default): {{ album_release }}
Year only: {{ album_release|YYYY }}
Year-Month: {{ album_release|YYYY-MM }}
Full date: {{ album_release|YYYY-MM-DD }}
US format: {{ album_release|MM/DD/YYYY }}

**Table context — use `\|` (escaped pipe) inside Markdown tables:**

In Markdown tables `|` separates columns, so the inline override pipe must be escaped with `\|`.

| Token | Syntax | Result |
| ----- | ------ | ------ |
| album_cover_medium | `{{ album_cover_medium\|200x200 }}` | {{ album_cover_medium\|200x200 }} |
| album_cover_large | `{{ album_cover_large\|100x100 }}` | {{ album_cover_large\|100x100 }} |
| album_release | `{{ album_release\|YYYY }}` | {{ album_release\|YYYY }} |
| artist_image | `{{ artist_image\|50x50 }}` | {{ artist_image\|50x50 }} |
