//
// Obsidian Settings
//
export type SpotifyLinkSettings = {
	spotifyClientId: string;
	spotifyClientSecret: string;
	spotifyScopes: string;
	spotifyState: string;
	templates: string[];
};

//
// Spotify
//
export type Track = {
	album: {
		album_type: string;
		total_tracks: number;
		available_markets: string[];
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		images: {
			url: string;
			height: number;
			width: number;
		}[];
		name: string;
		release_date: string;
		release_date_precision: string;
		restrictions: {
			reason: string;
		};
		type: string;
		uri: string;
		artists: [
			{
				external_urls: {
					spotify: string;
				};
				href: string;
				id: string;
				name: string;
				type: string;
				uri: string;
			}
		];
	};
	artists: [
		{
			external_urls: {
				spotify: string;
			};
			followers: {
				href: string;
				total: number;
			};
			genres: string[];
			href: string;
			id: string;
			images: [
				{
					url: string;
					height: number;
					width: number;
				}
			];
			name: string;
			popularity: 0;
			type: string;
			uri: string;
		}
	];
	available_markets: [string];
	disc_number: string;
	duration_ms: string;
	explicit: boolean;
	external_ids: {
		isrc: string;
		ean: string;
		upc: string;
	};
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	is_playable: boolean;
	linked_from: object;
	restrictions: {
		reason: string;
	};
	name: string;
	popularity: number;
	preview_url: string;
	track_number: number;
	type: "track";
	uri: string;
	is_local: boolean;
};

export type Episode = {
	audio_preview_url: string | null;
	description: string;
	html_description: string;
	duration_ms: number;
	explicit: boolean;
	external_urls: {
		spotify: string;
	};
	href: string;
	id: string;
	images: {
		url: string;
		height: number;
		width: number;
	}[];
	is_externally_hosted: boolean;
	is_playable: boolean;
	languages: [string];
	name: string;
	release_date: string;
	release_date_precision: "year" | "month" | "day";
	resume_point: { fully_played: boolean; resume_position_ms: number };
	type: "episode";
	uri: string;
	restriction: { reason: string };
	show: {
		available_markets: [string];
		copyrights: [{ text: string; type: string }];
		description: string;
		html_description: string;
		explicit: boolean;
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		images: [
			{
				url: string;
				height: number;
				width: number;
			}
		];
		is_externally_hosted: boolean;
		languages: [string];
		name: string;
		publisher: string;
		type: "show";
		uri: string;
		total_episodes: number;
	};
};

export type CurrentlyPlayingTrack = {
	device: {
		id: string;
		is_active: boolean;
		is_private_session: boolean;
		is_restricted: boolean;
		name: string;
		type: string;
		volume_percent: number;
		supports_volume: boolean;
	};
	repeat_state: string;
	shuffle_state: boolean;
	context: {
		type: string;
		href: string;
		external_urls: {
			spotify: string;
		};
		uri: string;
	};
	timestamp: number;
	progress_ms: number;
	is_playing: boolean;
	item: Track | Episode;
	currently_playing_type: TrackType;
	actions: {
		interrupting_playback: boolean;
		pausing: boolean;
		resuming: boolean;
		seeking: boolean;
		skipping_next: boolean;
		skipping_prev: boolean;
		toggling_repeat_context: boolean;
		toggling_shuffle: boolean;
		toggling_repeat_track: boolean;
		transferring_playback: boolean;
	};
};

export type AccessTokenResponse = {
	access_token: string;
	token_type: string;
	scope: string;
	expires_in: number;
	refresh_token: string;
};

export type RefreshTokenResponse = {
	access_token: string;
	token_type: "Bearer";
	scope: string;
	expires_in: number;
	refresh_token: string;
};

export type AuthorizationCodeResponse = {
	access_token: string;
	token_type: string;
	scope: string;
	expires_in: number;
	refresh_token: string;
};

export type SpotifyAuthCallback = {
	action: string;
	error?: string;
	code?: string;
	state: string;
};

export type Me = {
	country: string;
	display_name: string;
	email: string;
	explicit_content: {
		filter_enabled: boolean;
		filter_locked: boolean;
	};
	external_urls: {
		spotify: string;
	};
	followers: {
		href: string;
		total: number;
	};
	href: string;
	id: string;
	images: [
		{
			url: string;
			height: number;
			width: number;
		}
	];
	product: string;
	type: string;
	uri: string;
};

export type TrackType = "track" | "episode" | "ad" | "unknown";
