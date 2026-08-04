import { getAlbum, getArtist, getPlaylistsForTrack, getTrack } from "./api.ts";
import { getEpisodeMessage, getEpisodeMessageTimestamp } from "./episode.ts";
import {
	getRecentlyPlayedTrackMessage,
	getTrackMessage,
	getTrackMessageTimestamp,
	getTrackType,
} from "./track.ts";
import type { AlbumDetail, CurrentlyPlayingTrack, RecentlyPlayed, TemplateOptions, Track, TrackProcessingResult } from "./types.ts";


function needsAlbum(template: string): boolean {
	return /\{\{?\s*album_(popularity|genres[_a-z]*)\s*\}?\}/i.test(template);
}

export function processCurrentlyPlayingTrackInput(
	data: CurrentlyPlayingTrack,
): string {
	if (data && data.is_playing) {
		if (getTrackType(data) === "track") {
			return getTrackMessageTimestamp(data);
		}
		if (getTrackType(data) === "episode") {
			return getEpisodeMessageTimestamp(data);
		}

		throw new Error(
			"The data received is not handle. You can request it by opening a GitHub issue and providing the track URL so that I can adjust the tool accordingly.",
		);
	}
	return "No song is playing.";
}

async function _processTrack(
	clientId: string,
	clientSecret: string,
	track: Track,
	template: string,
	options?: TemplateOptions,
): Promise<TrackProcessingResult> {
	const [artists, album] = await Promise.all([
		Promise.all(track.artists.map((artist) => getArtist(clientId, clientSecret, artist.id))),
		needsAlbum(template)
			? getAlbum(clientId, clientSecret, track.album.id)
			: Promise.resolve(undefined),
	]);

	const playlistsEnabled = options?.enablePlaylists !== false;
	const needsPlaylists = playlistsEnabled && /\{\{?\s*playlists\s*\}?\}/i.test(template);
	const playlistNames = needsPlaylists
		? await getPlaylistsForTrack(clientId, clientSecret, track.id, options?.playlistConcurrency ?? 10)
		: [];

	return {
		content: getTrackMessage(track, artists, template, playlistNames, options, album),
		playlistNames,
	};
}

export async function processCurrentlyPlayingTrack(
	clientId: string,
	clientSecret: string,
	data: CurrentlyPlayingTrack,
	template = `'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n{{ timestamp }}`,
	options?: TemplateOptions,
): Promise<TrackProcessingResult> {
	if (data && data.is_playing) {
		if (getTrackType(data) === "track") {
			return _processTrack(clientId, clientSecret, data.item as Track, template, options);
		}
		if (getTrackType(data) === "episode") {
			return { content: getEpisodeMessage(data, template, options), playlistNames: [] };
		}

		throw new Error(
			"The data received is not handle. You can request it by opening a GitHub issue and providing the track URL so that I can adjust the tool accordingly.",
		);
	}
	return { content: "No song is playing.", playlistNames: [] };
}

export async function processRecentlyPlayedTracks(
	clientId: string,
	clientSecret: string,
	data: RecentlyPlayed | null,
	template = `'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }} @ {{ played_at }}`,
	options?: TemplateOptions,
): Promise<string> {
	if (!data?.items?.length) {
		throw new Error(
			"No recently played tracks found. Spotify only returns plays from the current day.",
		);
	}

	// An existing install can have this template saved as an empty string.
	const resolved = template.trim()
		? template
		: "- '{{ song_name }}' by {{ artists }} from {{ album }} @ {{ played_at }}";

	const messages: string[] = [];
	for (const item of data.items) {
		const track = item.track as Track;
		const [artists, album] = await Promise.all([
			Promise.all(track.artists.map((artist) => getArtist(clientId, clientSecret, artist.id))),
			needsAlbum(resolved)
				? getAlbum(clientId, clientSecret, track.album.id)
				: Promise.resolve(undefined as AlbumDetail | undefined),
		]);
		messages.push(
			getRecentlyPlayedTrackMessage(item, artists, resolved, options, album),
		);
	}

	return messages.join("\n");
}

export async function processTrackById(
	clientId: string,
	clientSecret: string,
	trackIdOrUrl: string,
	template: string,
	options?: TemplateOptions,
): Promise<TrackProcessingResult> {
	const track = await getTrack(clientId, clientSecret, trackIdOrUrl);
	return _processTrack(clientId, clientSecret, track, template, options);
}
