import { RequestUrlResponse, requestUrl } from "obsidian";
import {
  AccessTokenResponse,
  Artist,
  AuthorizationCodeResponse,
  CurrentlyPlayingTrack,
  Me,
  RefreshTokenResponse,
  SpotifyAuthCallback,
} from "./types";
import { prepareData } from "./utils";
import { processCurrentlyPlayingTrackInput } from "./output";

export const SPOTIFY_API_BASE_ADDRESS = "https://api.spotify.com/v1";
export const REDIRECT_URI = "obsidian://spotify-auth/";

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
