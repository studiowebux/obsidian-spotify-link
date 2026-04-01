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
