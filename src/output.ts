import { CurrentlyPlayingTrack } from "./types";
import { millisToMinutesAndSeconds } from "./utils";

export function processCurrentlyPlayingTrackInput(
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

export function processCurrentlyPlayingTrack(
	data: CurrentlyPlayingTrack,
	template = `'{{ song_name }}' by {{ artists }} from {{ album }} released in {{ album_release }}\n{{ timestamp }}`
): string {
	let message = "";
	if (data && data.is_playing) {
		message = template
			.replace(/{{ song_name }}|{{song_name}}/g, data.item.name)
			.replace(
				/{{ artists }}|{{artist}}/g,
				data.item.artists.map((a) => a.name).join(", ")
			)
			.replace(
				/{{ album_release }}|{{album_release}}/g,
				data.item.album.release_date
			)
			.replace(/{{ album }}|{{album}}/g, data.item.album.name)
			.replace(
				/{{ timestamp }}|{{timestamp}}/g,
				`${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`
			);
	} else {
		message = "No song is playing.";
	}

	return message;
}
