import { Notice, RequestUrlParam, RequestUrlResponse, requestUrl } from "obsidian";
import { SpotifyCall, SpotifyError, describeSpotifyError, parseBody } from "./errors.ts";
import {
	AccessTokenResponse,
	Artist,
	AuthorizationCodeResponse,
	CurrentlyPlayingTrack,
	Episode,
	Me,
	PlaylistDetail,
	PlaylistSummary,
	RecentlyPlayed,
	RefreshTokenResponse,
	SpotifyAuthCallback,
	Track,
} from "./types.ts";
import { prepareData } from "./utils.ts";
import { buildLoginUrl } from "./auth.ts";
import { processCurrentlyPlayingTrackInput } from "./output.ts";

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

type SpotifyResponse = {
	status: number;
	headers: Record<string, string>;
	json: any;
};

/**
 * requestUrl throws on status >= 400 by default, hiding Spotify's error body,
 * and its .json getter throws on an empty one. Both are handled here.
 */
async function spotifyRequest(
	params: RequestUrlParam,
	call: SpotifyCall,
): Promise<SpotifyResponse> {
	const t0 = Date.now();
	clog(call.fn, `${params.method ?? "GET"} ${params.url}`);

	let response: RequestUrlResponse;
	try {
		response = await requestUrl({ ...params, throw: false });
	} catch (e) {
		clog(call.fn, "network error", e);
		throw new SpotifyError(describeSpotifyError(0, null, call), 0, call, e);
	}

	const json = parseBody(response.text);
	cres(call.fn, response.status, Date.now() - t0, json);

	if (response.status >= 400) {
		throw new SpotifyError(
			describeSpotifyError(response.status, json, call, response.headers),
			response.status,
			call,
			json,
		);
	}

	return { status: response.status, headers: response.headers, json };
}

function authHeader(token: string): Record<string, string> {
	return { Authorization: `Bearer ${token}` };
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
	return buildLoginUrl(clientId, state, scope, redirectUri);
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
	const data = {
		code: code,
		redirect_uri: redirect_uri,
		grant_type: "authorization_code",
	};
	const res = await spotifyRequest({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	}, { fn: "requestAccessToken", auth: true });
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
	const refreshToken = getRefreshToken();
	const data = {
		client_id: clientId,
		refresh_token: refreshToken,
		grant_type: "refresh_token",
	};
	const res = await spotifyRequest({
		url: "https://accounts.spotify.com/api/token",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	}, { fn: "requestRefreshToken", auth: true });
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
	const response = await spotifyRequest(
		{
			url: `${SPOTIFY_API_BASE_ADDRESS}/me/player/currently-playing?additional_types=track,episode`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getCurrentlyPlayingTrack", scope: "user-read-currently-playing" },
	);

	// Spotify answers 204 with an empty body when nothing is playing.
	if (response.status === 204 || !response.json) {
		throw new Error(
			"Nothing is currently playing on Spotify. Start playback and try again.",
		);
	}

	return response.json as CurrentlyPlayingTrack;
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
	const response = await spotifyRequest(
		{
			url: `${SPOTIFY_API_BASE_ADDRESS}/tracks/${id}`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getTrack" },
	);

	if (!response.json) throw new Error(`No track found for "${trackIdOrUrl}".`);
	return response.json as Track;
}

export async function getEpisode(
	clientId: string,
	clientSecret: string,
	episodeIdOrUrl: string,
): Promise<Episode> {
	const token = await getAccessToken(clientId, clientSecret);
	const id = episodeIdOrUrl.includes("spotify.com/episode/")
		? episodeIdOrUrl.split("spotify.com/episode/")[1].split(/[?#]/)[0]
		: episodeIdOrUrl.trim();
	const response = await spotifyRequest(
		{
			url: `${SPOTIFY_API_BASE_ADDRESS}/episodes/${id}`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getEpisode" },
	);

	if (!response.json) throw new Error(`No episode found for "${episodeIdOrUrl}".`);
	return response.json as Episode;
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
	const response = await spotifyRequest(
		{
			url: `${SPOTIFY_API_BASE_ADDRESS}/me`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getMe" },
	);

	return response.json as Me;
}

export async function getArtist(
	clientId: string,
	clientSecret: string,
	artistId: string,
): Promise<Artist> {
	const token = await getAccessToken(clientId, clientSecret);
	const response = await spotifyRequest(
		{
			url: `${SPOTIFY_API_BASE_ADDRESS}/artists/${artistId}`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getArtist" },
	);

	if (!response.json) throw new Error(`No artist found for id "${artistId}".`);
	return response.json as Artist;
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

	const date = new Date();
	date.setHours(0, 0, 0, 0);
	const beginningOfDayEpochTime = date.getTime();

	const response = await spotifyRequest(
		{
			url: url ||
				`${SPOTIFY_API_BASE_ADDRESS}/me/player/recently-played?limit=${LIMIT}&after=${beginningOfDayEpochTime}`,
			method: "GET",
			headers: authHeader(token),
		},
		{ fn: "getRecentlyPlayedTracks", scope: "user-read-recently-played" },
	);

	const { json } = response;
	if (!json) {
		throw new Error("Spotify returned no recently played tracks for today.");
	}

	if (!recentlyPlayed) {
		recentlyPlayed = json;
	} else {
		recentlyPlayed.items.unshift(...json.items);
	}

	if (json.next) {
		return getRecentlyPlayedTracks(
			clientId,
			clientSecret,
			json.next,
			recentlyPlayed,
		);
	}

	return recentlyPlayed;
}

async function isTrackSaved(token: string, trackId: string): Promise<boolean> {
	try {
		const res = await spotifyRequest(
			{
				url: `${SPOTIFY_API_BASE_ADDRESS}/me/library/contains?uris=spotify:track:${trackId}`,
				method: "GET",
				headers: authHeader(token),
			},
			{ fn: "isTrackSaved", scope: "user-library-read" },
		);
		return res.json?.[0] === true;
	} catch (e) {
		new Notice(
			"Spotify Link: Could not check Liked Songs — " +
				(e instanceof Error ? e.message : String(e)),
			10000,
		);
		return false;
	}
}

/**
 * Names of the user's owned playlists containing the track, plus "Liked Songs"
 * when it is saved. Pages are fetched in parallel, playlists checked in batches
 * of `concurrency`, and each playlist exits early once the track is found.
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
		if (await isTrackSaved(token, trackId)) {
			matchingNames.push("Liked Songs");
		}

		// Step 2: Collect all owned playlists (page 1 sequential, then remaining pages in parallel)
		const me = await getMe(clientId, clientSecret);
		const ownedPlaylists: PlaylistSummary[] = [];
		const PAGE_SIZE = 50;

		const firstRes = await spotifyRequest(
			{
				url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`,
				method: "GET",
				headers: authHeader(token),
			},
			{ fn: "getPlaylistsForTrack", scope: "playlist-read-private" },
		);
		if (!firstRes.json?.items) {
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
					const res = await spotifyRequest(
						{
							url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
							method: "GET",
							headers: authHeader(token),
						},
						{ fn: `getPlaylistsForTrack/page@${offset}`, scope: "playlist-read-private" },
					);
					return res.json?.items ?? [];
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
				`${SPOTIFY_API_BASE_ADDRESS}/playlists/${playlist.id}/items?limit=50&fields=items(item(id)),next`;
			let found = false;

			while (itemsUrl && !found) {
				const res = await spotifyRequest(
					{ url: itemsUrl, method: "GET", headers: authHeader(token) },
					{
						fn: `getPlaylistsForTrack "${playlist.name}"`,
						scope: "playlist-read-private",
					},
				);

				const data = res.json;
				if (!data?.items) break;
				found = data.items.some((entry: { item?: { id?: string } }) =>
					entry.item?.id === trackId
				);
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

function toPlaylistDetail(pl: Record<string, any>): PlaylistDetail {
	return {
		id: pl.id,
		name: pl.name,
		description: pl.description ?? "",
		external_urls: pl.external_urls,
		images: pl.images ?? [],
		owner: { id: pl.owner?.id, display_name: pl.owner?.display_name ?? "" },
		public: pl.public ?? false,
		collaborative: pl.collaborative ?? false,
		items: { total: pl.items?.total ?? 0 },
	};
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
		const firstRes = await spotifyRequest(
			{
				url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=0`,
				method: "GET",
				headers: authHeader(token),
			},
			{ fn: "getAllPlaylists", scope: "playlist-read-private" },
		);
		if (!firstRes.json?.items) {
			notice.hide();
			return playlists;
		}

		const total = firstRes.json.total ?? 0;
		for (const pl of firstRes.json.items) {
			playlists.push(toPlaylistDetail(pl));
		}

		if (total > PAGE_SIZE) {
			const remainingPages: number[] = [];
			for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
				remainingPages.push(offset);
			}
			const pageResults = await Promise.all(
				remainingPages.map(async (offset) => {
					const res = await spotifyRequest(
						{
							url: `${SPOTIFY_API_BASE_ADDRESS}/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
							method: "GET",
							headers: authHeader(token),
						},
						{ fn: `getAllPlaylists/page@${offset}`, scope: "playlist-read-private" },
					);
					return res.json?.items ?? [];
				}),
			);
			for (const items of pageResults) {
				for (const pl of items) {
					playlists.push(toPlaylistDetail(pl));
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
