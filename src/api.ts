import { Notice, RequestUrlResponse, requestUrl } from "obsidian";
import {
	AccessTokenResponse,
	AlbumDetail,
	Artist,
	AuthorizationCodeResponse,
	CurrentlyPlayingTrack,
	Me,
	PlaylistDetail,
	PlaylistSummary,
	RecentlyPlayed,
	RefreshTokenResponse,
	SpotifyAuthCallback,
	Track,
} from "./types";
import { prepareData } from "./utils";
import { processCurrentlyPlayingTrackInput } from "./output";

export const SPOTIFY_API_BASE_ADDRESS = "https://api.spotify.com/v1";
export const REDIRECT_URI = "obsidian://spotify-auth/";
const LIMIT = 20;

///
/// AUTHENTICATION FLOW
///

// Step 1
export function generateLoginUrl(
	clientId: string,
	state: string,
	scope: string,
	redirectUri: string,
): string {
	const q = `response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
	return `https://accounts.spotify.com/authorize?${q}`;
}

// Step 2
export async function handleCallback(
	params: SpotifyAuthCallback,
	clientId: string,
	clientSecret: string,
	state: string,
): Promise<boolean> {
	if (params.state !== state) throw new Error("Invalid state");
	if (params.error) throw new Error(params.error);
	if (!params.code) throw new Error("Missing Code");

	const response: AccessTokenResponse = await requestAccessToken(
		clientId,
		clientSecret,
		params.code,
		REDIRECT_URI,
	);
	setAccessToken(response.access_token);
	setRefreshToken(response.refresh_token);
	setExpiration(response.expires_in);
	return true;
}

// Step 3
async function requestAccessToken(
	clientId: string,
	clientSecret: string,
	code: string,
	redirect_uri: string,
): Promise<AuthorizationCodeResponse> {
	const data = {
		code: code,
		redirect_uri: redirect_uri,
		grant_type: "authorization_code",
	};
	return await requestUrl({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	}).then((res) => res.json);
}

// Step 4
export function setAccessToken(accessToken: string): void {
	window.localStorage.setItem("access_token", accessToken);
}
export function setRefreshToken(refreshToken: string): void {
	window.localStorage.setItem("refresh_token", refreshToken);
}
export function setExpiration(expiresIn: number): void {
	window.localStorage.setItem(
		"expires_in",
		(new Date().getTime() + expiresIn * 1000).toString(),
	);
}

// Step 5
export async function requestRefreshToken(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const refreshToken = getRefreshToken();
	const data = {
		client_id: clientId,
		refresh_token: refreshToken,
		grant_type: "refresh_token",
	};
	const response: RefreshTokenResponse = await requestUrl({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	}).then((res) => res.json);

	setAccessToken(response.access_token);
	setRefreshToken(response.refresh_token || refreshToken);
	setExpiration(response.expires_in);

	return response.access_token;
}

///
/// METHODS
///

export async function getCurrentlyPlayingTrack(
	clientId: string,
	clientSecret: string,
): Promise<CurrentlyPlayingTrack> {
	const token = await getAccessToken(clientId, clientSecret);

	try {
		const response: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/me/player/currently-playing?additional_types=track,episode`,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}

		const currentlyPlayingTrack: CurrentlyPlayingTrack | null = json;

		if (!currentlyPlayingTrack)
			throw new Error("Unable to get the currently playing track.");
		return currentlyPlayingTrack;
	} catch (e) {
		throw new Error("Unable to get the currently playing track.");
	}
}

export async function getTrack(
	clientId: string,
	clientSecret: string,
	trackIdOrUrl: string,
): Promise<Track> {
	const token = await getAccessToken(clientId, clientSecret);
	// Accept full Spotify URLs like https://open.spotify.com/track/ID?si=... or bare IDs
	const id = trackIdOrUrl.includes("spotify.com/track/")
		? trackIdOrUrl.split("spotify.com/track/")[1].split(/[?#]/)[0]
		: trackIdOrUrl.trim();

	try {
		const response: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/tracks/${id}`,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		const { json } = response;
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		if (!json) throw new Error("Unable to get the track.");
		return json as Track;
	} catch (e) {
		throw new Error("Unable to get the track.");
	}
}

export async function getCurrentlyPlayingTrackAsString(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const track = await getCurrentlyPlayingTrack(clientId, clientSecret);
	return processCurrentlyPlayingTrackInput(track);
}

export async function getMe(
	clientId: string,
	clientSecret: string,
): Promise<Me> {
	const token = await getAccessToken(clientId, clientSecret);

	const response: RequestUrlResponse = await requestUrl({
		url: `${SPOTIFY_API_BASE_ADDRESS}/me`,
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const { json } = response;
	if (response.status !== 200) {
		throw new Error(json?.error?.message || response.status);
	}

	return json as Me;
}

export async function getArtist(
	clientId: string,
	clientSecret: string,
	artistId: string,
): Promise<Artist> {
	const token = await getAccessToken(clientId, clientSecret);

	try {
		const response: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/artists/${artistId}`,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		const artist: Artist | null = json;
		if (!artist) throw new Error("Unable to get the artist.");
		return artist;
	} catch (e) {
		throw new Error("Unable to get the artist.");
	}
}

export async function getAlbum(
	clientId: string,
	clientSecret: string,
	albumId: string,
): Promise<AlbumDetail> {
	const token = await getAccessToken(clientId, clientSecret);

	try {
		const response: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/albums/${albumId}`,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		const { json } = response;
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		if (!json) throw new Error("Unable to get the album.");
		return { id: json.id, name: json.name, popularity: json.popularity } as AlbumDetail;
	} catch (e) {
		throw new Error("Unable to get the album.");
	}
}

export async function getSpotifyUrl(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const me = await getMe(clientId, clientSecret);
	return me.external_urls.spotify;
}

///
/// LOCAL GETTERS
///

function getExpiration(): number {
	const expiration = window.localStorage.getItem("expires_in");
	if (!expiration)
		throw new Error(
			"Something went wrong, please manually log back to spotify.",
		);

	return parseInt(expiration);
}

async function getAccessToken(
	clientId: string,
	clientSecret: string,
): Promise<string> {
	const token = window.localStorage.getItem("access_token");
	if (!token) throw new Error("You are not connected to Spotify.");

	if (new Date().getTime() <= getExpiration()) return token;

	return await requestRefreshToken(clientId, clientSecret);
}

function getRefreshToken(): string {
	const token = window.localStorage.getItem("refresh_token");
	if (!token) throw new Error("You are not connected to Spotify.");
	return token;
}

/**
 * Get last 24H
 */
export async function getRecentlyPlayedTracks(
	clientId: string,
	clientSecret: string,
	url: string | null = null,
	recentlyPlayed: RecentlyPlayed | null = null,
): Promise<RecentlyPlayed | null> {
	const token = await getAccessToken(clientId, clientSecret);

	try {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		const beginningOfDayEpochTime = date.getTime();

		const response: RequestUrlResponse = await requestUrl({
			url:
				url ||
				`${SPOTIFY_API_BASE_ADDRESS}/me/player/recently-played?limit=${LIMIT}&after=${beginningOfDayEpochTime}`,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;

		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		if (!recentlyPlayed) {
			recentlyPlayed = json;
		} else {
			recentlyPlayed.items.unshift(...json.items);
		}

		if (json?.next) {
			return getRecentlyPlayedTracks(
				clientId,
				clientSecret,
				json.next,
				recentlyPlayed,
			);
		}
		if (!json) throw new Error("Unable to get recently played tracks.");
		return recentlyPlayed;
	} catch (e) {
		throw new Error("Unable to get recently played tracks.");
	}
}

/**
 * Returns the names of the user's owned playlists that contain the given track,
 * plus "Liked Songs" if the track is saved in the user's library.
 *
 * Optimizations:
 *   - Liked Songs: single /me/tracks/contains call
 *   - Playlist collection: fetch page 1 to get total, then fetch remaining pages in parallel
 *   - Playlist checking: parallel batches (configurable concurrency)
 *   - fields param on tracks endpoint to minimize payload
 *   - Early exit per playlist once track is found
 */
export async function getPlaylistsForTrack(
	clientId: string,
	clientSecret: string,
	trackId: string,
	concurrency = 10,
): Promise<string[]> {
	const token = await getAccessToken(clientId, clientSecret);
	const matchingNames: string[] = [];

	const t0 = Date.now();
	const notice = new Notice("Spotify Link: Fetching playlists...", 0);
	try {
		// Step 1: Check Liked Songs (single API call)
		try {
			const likedRes: RequestUrlResponse = await requestUrl({
				url: `${SPOTIFY_API_BASE_ADDRESS}/me/tracks/contains?ids=${trackId}`,
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (likedRes.status === 200 && likedRes.json?.[0] === true) {
				matchingNames.push("Liked Songs");
			}
		} catch (e) {
			new Notice(
				"Spotify Link: Unable to check Liked Songs. Add 'user-library-read' to your Spotify Scopes and re-authenticate.",
				10000,
			);
		}

		// Step 2: Collect all owned playlists (page 1 sequential, then remaining pages in parallel)
		const me = await getMe(clientId, clientSecret);
		const ownedPlaylists: PlaylistSummary[] = [];
		const PAGE_SIZE = 50;

		const firstRes: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (firstRes.status === 403) {
			notice.hide();
			throw new Error(
				"Missing 'playlist-read-private' scope. Add it to your Spotify Scopes in plugin settings, then click the Spotify icon to re-authenticate.",
			);
		}
		if (firstRes.status !== 200 || !firstRes.json?.items) {
			notice.hide();
			return matchingNames;
		}

		const total = firstRes.json.total ?? 0;
		for (const pl of firstRes.json.items) {
			if (pl.owner?.id === me.id) {
				ownedPlaylists.push({ id: pl.id, name: pl.name, owner: pl.owner });
			}
		}

		if (total > PAGE_SIZE) {
			const remainingPages: number[] = [];
			for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
				remainingPages.push(offset);
			}
			const pageResults = await Promise.all(
				remainingPages.map(async (offset) => {
					const res: RequestUrlResponse = await requestUrl({
						url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.status !== 200 || !res.json?.items) return [];
					return res.json.items;
				}),
			);
			for (const items of pageResults) {
				for (const pl of items) {
					if (pl.owner?.id === me.id) {
						ownedPlaylists.push({ id: pl.id, name: pl.name, owner: pl.owner });
					}
				}
			}
		}

		// Step 3: Check playlists in parallel batches
		async function checkPlaylist(playlist: PlaylistSummary): Promise<{ name: string; found: boolean }> {
			let itemsUrl: string | null =
				`${SPOTIFY_API_BASE_ADDRESS}/playlists/${playlist.id}/tracks?limit=100&fields=items(track(id)),next`;
			let found = false;

			while (itemsUrl && !found) {
				const res: RequestUrlResponse = await requestUrl({
					url: itemsUrl,
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.status !== 200) break;
				const data = res.json;
				if (!data?.items) break;
				for (const item of data.items) {
					if (item.track?.id === trackId) {
						found = true;
						break;
					}
				}
				itemsUrl = data.next ?? null;
			}
			return { name: playlist.name, found };
		}

		for (let i = 0; i < ownedPlaylists.length; i += concurrency) {
			const batch = ownedPlaylists.slice(i, i + concurrency);
			const results = await Promise.all(batch.map(checkPlaylist));
			for (const r of results) {
				if (r.found) matchingNames.push(r.name);
			}
		}

		const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
		notice.hide();
		new Notice(
			`Spotify Link: Found ${matchingNames.length} playlist(s) in ${elapsed}s`,
			5000,
		);
	} catch (e) {
		notice.hide();
		throw e;
	}

	return matchingNames;
}

export async function getAllPlaylists(
	clientId: string,
	clientSecret: string,
): Promise<PlaylistDetail[]> {
	const token = await getAccessToken(clientId, clientSecret);
	const playlists: PlaylistDetail[] = [];
	const PAGE_SIZE = 50;

	const notice = new Notice("Spotify Link: Fetching all playlists...", 0);
	try {
		const firstRes: RequestUrlResponse = await requestUrl({
			url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (firstRes.status === 403) {
			notice.hide();
			throw new Error(
				"Missing 'playlist-read-private' scope. Add it to your Spotify Scopes in plugin settings, then click the Spotify icon to re-authenticate.",
			);
		}
		if (firstRes.status !== 200 || !firstRes.json?.items) {
			notice.hide();
			return playlists;
		}

		const total = firstRes.json.total ?? 0;
		for (const pl of firstRes.json.items) {
			playlists.push({
				id: pl.id,
				name: pl.name,
				description: pl.description ?? "",
				external_urls: pl.external_urls,
				images: pl.images ?? [],
				owner: { id: pl.owner?.id, display_name: pl.owner?.display_name ?? "" },
				public: pl.public ?? false,
				collaborative: pl.collaborative ?? false,
				tracks: { total: pl.tracks?.total ?? 0 },
			});
		}

		if (total > PAGE_SIZE) {
			const remainingPages: number[] = [];
			for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
				remainingPages.push(offset);
			}
			const pageResults = await Promise.all(
				remainingPages.map(async (offset) => {
					const res: RequestUrlResponse = await requestUrl({
						url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (res.status !== 200 || !res.json?.items) return [];
					return res.json.items;
				}),
			);
			for (const items of pageResults) {
				for (const pl of items) {
					playlists.push({
						id: pl.id,
						name: pl.name,
						description: pl.description ?? "",
						external_urls: pl.external_urls,
						images: pl.images ?? [],
						owner: { id: pl.owner?.id, display_name: pl.owner?.display_name ?? "" },
						public: pl.public ?? false,
						collaborative: pl.collaborative ?? false,
						tracks: { total: pl.tracks?.total ?? 0 },
					});
				}
			}
		}

		notice.hide();
		new Notice(
			`Spotify Link: Fetched ${playlists.length} playlist(s)`,
			5000,
		);
	} catch (e) {
		notice.hide();
		throw e;
	}

	return playlists;
}
