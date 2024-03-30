import { getEpisodeMessage, getEpisodeMessageTimestamp } from "./episode";
import {
	getTrackMessage,
	getTrackMessageTimestamp,
	getTrackType,
} from "./track";
import { CurrentlyPlayingTrack } from "./types";

export function processCurrentlyPlayingTrackInput(
	data: CurrentlyPlayingTrack
): string {
	if (data && data.is_playing) {
		if (getTrackType(data) === "track") {
			return getTrackMessageTimestamp(data);
		}
		if (getTrackType(data) === "episode") {
			return getEpisodeMessageTimestamp(data);
		}

		throw new Error(
			"The data received is not handle. You can request it by opening a GitHub issue and providing the track URL so that I can adjust the tool accordingly."
		);
	}
	return "No song is playing.";
}

export function processCurrentlyPlayingTrack(
	data: CurrentlyPlayingTrack,
	template = `'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n{{ timestamp }}`
): string {
	if (data && data.is_playing) {
		if (getTrackType(data) === "track") {
			return getTrackMessage(data, template);
		}
		if (getTrackType(data) === "episode") {
			return getEpisodeMessage(data, template);
		}

		throw new Error(
			"The data received is not handle. You can request it by opening a GitHub issue and providing the track URL so that I can adjust the tool accordingly."
		);
	}
	return "No song is playing.";
}
