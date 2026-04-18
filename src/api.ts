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

// Debug logger — set to true to see all API calls in the developer console
const DEBUG = false;
function clog(fn: string, msg: string, ...rest: unknown[]): void {
	if (DEBUG) console.debug(`[spotify-link] ${fn} — ${msg}`, ...rest);
}
function cres(fn: string, status: number, elapsed: number, json: unknown): void {
	if (DEBUG) console.debug(`[spotify-link] ${fn} — status ${status} (${elapsed}ms)`, json);
}

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
	clog("handleCallback", "start");
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
	clog("handleCallback", "success — tokens stored");
	return true;
}

// Step 3
async function requestAccessToken(
	clientId: string,
	clientSecret: string,
	code: string,
	redirect_uri: string,
): Promise<AuthorizationCodeResponse> {
	clog("requestAccessToken", "POST https://accounts.spotify.com/api/token");
	const data = {
		code: code,
		redirect_uri: redirect_uri,
		grant_type: "authorization_code",
	};
	const res = await requestUrl({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	});
	cres("requestAccessToken", res.status, 0, res.json);
	return res.json;
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
	clog("requestRefreshToken", "POST https://accounts.spotify.com/api/token");
	const refreshToken = getRefreshToken();
	const data = {
		client_id: clientId,
		refresh_token: refreshToken,
		grant_type: "refresh_token",
	};
	const res = await requestUrl({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	});
	cres("requestRefreshToken", res.status, 0, res.json);
	const response: RefreshTokenResponse = res.json;

	setAccessToken(response.access_token);
	setRefreshToken(response.refresh_token || refreshToken);
	setExpiration(response.expires_in);
	clog("requestRefreshToken", "tokens refreshed");

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
	const url = `${SPOTIFY_API_BASE_ADDRESS}/me/player/currently-playing?additional_types=track,episode`;
	clog("getCurrentlyPlayingTrack", `GET ${url}`);
	const t0 = Date.now();

	try {
		const response: RequestUrlResponse = await requestUrl({
			url,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;
		cres("getCurrentlyPlayingTrack", response.status, Date.now() - t0, json);
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}

		const currentlyPlayingTrack: CurrentlyPlayingTrack | null = json;

		if (!currentlyPlayingTrack)
			throw new Error("Unable to get the currently playing track.");
		return currentlyPlayingTrack;
	} catch (e) {
		clog("getCurrentlyPlayingTrack", "error", e);
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
	const url = `${SPOTIFY_API_BASE_ADDRESS}/tracks/${id}`;
	clog("getTrack", `GET ${url}`);
	const t0 = Date.now();

	try {
		const response: RequestUrlResponse = await requestUrl({
			url,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		const { json } = response;
		cres("getTrack", response.status, Date.now() - t0, json);
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		if (!json) throw new Error("Unable to get the track.");
		return json as Track;
	} catch (e) {
		clog("getTrack", "error", e);
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
	const url = `${SPOTIFY_API_BASE_ADDRESS}/me`;
	clog("getMe", `GET ${url}`);
	const t0 = Date.now();

	const response: RequestUrlResponse = await requestUrl({
		url,
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const { json } = response;
	cres("getMe", response.status, Date.now() - t0, json);
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
	const url = `${SPOTIFY_API_BASE_ADDRESS}/artists/${artistId}`;
	clog("getArtist", `GET ${url}`);
	const t0 = Date.now();

	try {
		const response: RequestUrlResponse = await requestUrl({
			url,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;
		cres("getArtist", response.status, Date.now() - t0, json);
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		const artist: Artist | null = json;
		if (!artist) throw new Error("Unable to get the artist.");
		return artist;
	} catch (e) {
		clog("getArtist", "error", e);
		throw new Error("Unable to get the artist.");
	}
}

export async function getAlbum(
	clientId: string,
	clientSecret: string,
	albumId: string,
): Promise<AlbumDetail> {
	const token = await getAccessToken(clientId, clientSecret);
	const url = `${SPOTIFY_API_BASE_ADDRESS}/albums/${albumId}`;
	clog("getAlbum", `GET ${url}`);
	const t0 = Date.now();

	try {
		const response: RequestUrlResponse = await requestUrl({
			url,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		const { json } = response;
		cres("getAlbum", response.status, Date.now() - t0, json);
		if (response.status !== 200) {
			throw new Error(json?.error?.message || response.status);
		}
		if (!json) throw new Error("Unable to get the album.");
		return { id: json.id, name: json.name, popularity: json.popularity, genres: json.genres ?? [] } as AlbumDetail;
	} catch (e) {
		clog("getAlbum", "error", e);
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

		const reqUrl =
			url ||
			`${SPOTIFY_API_BASE_ADDRESS}/me/player/recently-played?limit=${LIMIT}&after=${beginningOfDayEpochTime}`;
		clog("getRecentlyPlayedTracks", `GET ${reqUrl}`);
		const t0 = Date.now();

		const response: RequestUrlResponse = await requestUrl({
			url: reqUrl,
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		const { json } = response;
		cres("getRecentlyPlayedTracks", response.status, Date.now() - t0, json);

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
		clog("getRecentlyPlayedTracks", "error", e);
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
	clog("getPlaylistsForTrack", `start trackId=${trackId}`);
	const notice = new Notice("Spotify Link: Fetching playlists...", 0);
	try {
		// Step 1: Check Liked Songs (single API call)
		try {
			const likedUrl = `${SPOTIFY_API_BASE_ADDRESS}/me/tracks/contains?ids=${trackId}`;
			clog("getPlaylistsForTrack", `GET ${likedUrl}`);
			const likedRes: RequestUrlResponse = await requestUrl({
				url: likedUrl,
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			cres("getPlaylistsForTrack/liked-songs", likedRes.status, 0, likedRes.json);
			if (likedRes.status === 200 && likedRes.json?.[0] === true) {
				matchingNames.push("Liked Songs");
			}
		} catch (e) {
			clog("getPlaylistsForTrack", "liked-songs check error", e);
			new Notice(
				"Spotify Link: Unable to check Liked Songs. Add 'user-library-read' to your Spotify Scopes and re-authenticate.",
				10000,
			);
		}

		// Step 2: Collect all owned playlists (page 1 sequential, then remaining pages in parallel)
		const me = await getMe(clientId, clientSecret);
		const ownedPlaylists: PlaylistSummary[] = [];
		const PAGE_SIZE = 50;

		const firstPageUrl = `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`;
		clog("getPlaylistsForTrack", `GET ${firstPageUrl}`);
		const firstRes: RequestUrlResponse = await requestUrl({
			url: firstPageUrl,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		cres("getPlaylistsForTrack/playlists-page-1", firstRes.status, 0, firstRes.json);
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
			clog("getPlaylistsForTrack", `fetching ${remainingPages.length} additional playlist page(s) in parallel`);
			const pageResults = await Promise.all(
				remainingPages.map(async (offset) => {
					const res: RequestUrlResponse = await requestUrl({
						url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					cres(`getPlaylistsForTrack/playlists-page-offset=${offset}`, res.status, 0, res.json);
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

		clog("getPlaylistsForTrack", `checking ${ownedPlaylists.length} owned playlist(s) for track`);

		// Step 3: Check playlists in parallel batches
		async function checkPlaylist(playlist: PlaylistSummary): Promise<{ name: string; found: boolean }> {
			let itemsUrl: string | null =
				`${SPOTIFY_API_BASE_ADDRESS}/playlists/${playlist.id}/tracks?limit=100&fields=items(track(id)),next`;
			let found = false;
			let page = 0;

			while (itemsUrl && !found) {
				clog("getPlaylistsForTrack", `checkPlaylist "${playlist.name}" page ${page} GET ${itemsUrl}`);
				const res: RequestUrlResponse = await requestUrl({
					url: itemsUrl,
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				cres(`getPlaylistsForTrack/checkPlaylist "${playlist.name}" page ${page}`, res.status, 0, res.json);
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
				page++;
			}
			clog("getPlaylistsForTrack", `checkPlaylist "${playlist.name}" found=${found}`);
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
		clog("getPlaylistsForTrack", `done — ${matchingNames.length} match(es) in ${elapsed}s`);
		notice.hide();
		new Notice(
			`Spotify Link: Found ${matchingNames.length} playlist(s) in ${elapsed}s`,
			5000,
		);
	} catch (e) {
		clog("getPlaylistsForTrack", "error", e);
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

	clog("getAllPlaylists", "start");
	const notice = new Notice("Spotify Link: Fetching all playlists...", 0);
	try {
		const firstPageUrl = `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`;
		clog("getAllPlaylists", `GET ${firstPageUrl}`);
		const t0 = Date.now();
		const firstRes: RequestUrlResponse = await requestUrl({
			url: firstPageUrl,
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		cres("getAllPlaylists/page-1", firstRes.status, Date.now() - t0, firstRes.json);
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
			clog("getAllPlaylists", `fetching ${remainingPages.length} additional page(s) in parallel`);
			const pageResults = await Promise.all(
				remainingPages.map(async (offset) => {
					const res: RequestUrlResponse = await requestUrl({
						url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					});
					cres(`getAllPlaylists/page-offset=${offset}`, res.status, 0, res.json);
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

		clog("getAllPlaylists", `done — ${playlists.length} playlist(s)`);
		notice.hide();
		new Notice(
			`Spotify Link: Fetched ${playlists.length} playlist(s)`,
			5000,
		);
	} catch (e) {
		clog("getAllPlaylists", "error", e);
		notice.hide();
		throw e;
	}

	return playlists;
}
