import { getArtist, getPlaylistsForTrack } from "./api";
import { getEpisodeMessage, getEpisodeMessageTimestamp } from "./episode";
import { getPlaylistMessage } from "./playlist";
import {
	getRecentlyPlayedTrackMessage,
	getTrackMessage,
	getTrackMessageTimestamp,
	getTrackType,
} from "./track";
import { CurrentlyPlayingTrack, PlaylistDetail, RecentlyPlayed, TemplateOptions, Track, TrackProcessingResult } from "./types";

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

export async function processCurrentlyPlayingTrack(
	clientId: string,
	clientSecret: string,
	data: CurrentlyPlayingTrack,
	template = `'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n{{ timestamp }}`,
	options?: TemplateOptions,
): Promise<TrackProcessingResult> {
	if (data && data.is_playing) {
		if (getTrackType(data) === "track") {
			const track = data.item as Track;
			const artists = track.artists.map((artist) =>
				getArtist(clientId, clientSecret, artist.id),
			);

			const playlistsEnabled = options?.enablePlaylists !== false;
			const needsPlaylists = playlistsEnabled && /\{\{?\s*playlists\s*\}?\}/i.test(template);
			const playlistNames = needsPlaylists
				? await getPlaylistsForTrack(clientId, clientSecret, track.id, options?.playlistConcurrency ?? 10)
				: [];

			return {
				content: getTrackMessage(data, await Promise.all(artists), template, playlistNames, options),
				playlistNames,
			};
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
	const messages: string[] = [];
	if (data && data.items) {
		for (const item of data.items) {
			const artists = (item.track as Track).artists.map((artist) =>
				getArtist(clientId, clientSecret, artist.id),
			);
			messages.push(
				getRecentlyPlayedTrackMessage(
					item,
					await Promise.all(artists),
					template,
					options,
				),
			);
		}

		return messages.join("\n");
	}

	return "Nothing fetched from Spotify API.";
}

export function processAllPlaylists(
	playlists: PlaylistDetail[],
	template: string,
	options?: TemplateOptions,
): string {
	if (!playlists || playlists.length === 0) {
		return "No playlists found.";
	}

	return playlists
		.map((playlist) => getPlaylistMessage(playlist, template, options))
		.join("\n");
}

export function processSinglePlaylist(
	playlist: PlaylistDetail,
	template: string,
	options?: TemplateOptions,
): string {
	return getPlaylistMessage(playlist, template, options);
}
