import { CurrentlyPlayingTrack } from "./types";

export function prepareData(data: { [key: string]: string }) {
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
