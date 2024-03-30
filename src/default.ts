import { SpotifyLinkSettings } from "./types";

export const DEFAULT_SETTINGS: SpotifyLinkSettings = {
	spotifyClientId: "",
	spotifyClientSecret: "",
	spotifyScopes: "user-read-currently-playing",
	spotifyState: "it-can-be-anything",
	templates: [
		"**Song Name:** {{ song_name }}\n**Song URL:** {{ song_link }}\n**Album Name:** {{ album }}\n**Album Release Date:** {{ album_release }}\n**Album URL:** {{ album_link }}\n**Cover:** {{ album_cover_medium }}\n**Cover URL:** {{ album_cover_link_medium }}\n**Artists:** {{ artists }}\n**Added at:** *{{ timestamp }}*",
		"**Episode Name:** {{ episode_name }}\n**Description:** {{ description }}\n**Added at:** *{{ timestamp }}*",
	],
};
