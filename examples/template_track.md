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

Genres Tests:

Genres: {{ genres }}
Genres Array: {{ genres_array }}
Genres hashatg: {{ genres_hashtag }}

Artists values:

artist_name: {{ artist_name }}
Popularity: {{ popularity }}
Followers: {{ followers }}
Artist images: {{ artist_image }}

Artists
{{ artists_formatted:  - [[:]] }}
