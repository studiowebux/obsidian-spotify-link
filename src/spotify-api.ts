import {
	AccessTokenResponse,
	CurrentlyPlayingTrack,
	SpotifyAuthCallback,
} from "./spotify.types";

const SPOTIFY_API_BASE_ADDRESS = "https://api.spotify.com/v1";
const REDIRECT_URI = "obsidian://spotify-auth/";
///
/// AUTHENTICATION
///

// Event
export function onLogin(clientId: string, state: string, scope: string): void {
	window.open(generateLoginUrl(clientId, state, scope, REDIRECT_URI));
}

// Step 1
export function generateLoginUrl(
	clientId: string,
	state: string,
	scope: string,
	redirectUri: string
): string {
	const q = `response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
	return `https://accounts.spotify.com/authorize?${q}`;
}

// Step 2

export async function handleCallback(
	params: SpotifyAuthCallback,
	clientId: string,
	clientSecret: string,
	state: string
): Promise<boolean> {
	if (params.state !== state) throw new Error("Invalid state");
	if (params.error) throw new Error(params.error);
	if (!params.code) throw new Error("Missing Code");

	const response: AccessTokenResponse = await requestAccessToken(
		clientId,
		clientSecret,
		params.code,
		REDIRECT_URI
	);
	setAccessToken(response.access_token);
	setRefreshToken(response.refresh_token);
	return true;
}

// Step 3
async function requestAccessToken(
	clientId: string,
	clientSecret: string,
	code: string,
	redirect_uri: string
) {
	const data = {
		code: code,
		redirect_uri: redirect_uri,
		grant_type: "authorization_code",
	};
	return await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
		},
		body: prepareData(data),
	}).then((res) => res.json());
}

// Step 4
export async function setAccessToken(accessToken: string) {
	if (typeof window === "object")
		window.localStorage.setItem("access_token", accessToken);
}
export async function setRefreshToken(refreshToken: string) {
	if (typeof window === "object")
		window.localStorage.setItem("refresh_token", refreshToken);
}

///
/// METHODS
///

export async function getCurrentlyPlayingTrack(): Promise<CurrentlyPlayingTrack> {
	const token = getAccessToken();
	if (!token) throw new Error("You are not connected to Spotify.");

	const currentlyPlayingTrack: CurrentlyPlayingTrack | null = await fetch(
		`${SPOTIFY_API_BASE_ADDRESS}/me/player/currently-playing`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	).then((res) => (res.status === 200 ? res.json() : null));

	if (!currentlyPlayingTrack)
		throw new Error("Unable to get the currently playing track.");

	return currentlyPlayingTrack;
}

export async function getCurrentlyPlayingTrackAsString(): Promise<string> {
	const track = await getCurrentlyPlayingTrack();
	return processCurrentlyPlayingTrackInput(track);
}

///
/// UTILS
///

function prepareData(data: { [key: string]: string }) {
	return Object.keys(data)
		.map(
			(key) =>
				encodeURIComponent(key) + "=" + encodeURIComponent(data[key])
		)
		.join("&");
}

function millisToMinutesAndSeconds(millis: number) {
	const minutes: number = Math.floor(millis / 60000);
	const seconds: number = parseInt(((millis % 60000) / 1000).toFixed(0));
	if (minutes === 0) {
		return (seconds < 10 ? "0" : "") + seconds + "s";
	}
	return minutes + "m:" + (seconds < 10 ? "0" : "") + seconds + "s";
}

function getAccessToken(): string | null {
	if (typeof window === "object")
		return window.localStorage.getItem("access_token") || null;
	return null;
}

function processCurrentlyPlayingTrackInput(
	data: CurrentlyPlayingTrack
): string {
	let message = "";
	if (data && data.is_playing) {
		message = `['**${data.item.name}**' by ***${data.item.artists
			.map((a) => a.name)
			.join(", ")}*** **${millisToMinutesAndSeconds(
			data.progress_ms
		)}** (${(
			(data.progress_ms / parseInt(data.item.duration_ms)) *
			100
		).toFixed(0)}%)](${data.item.external_urls.spotify})`;
	} else {
		message = "No song is playing.";
	}
	return message;
}
