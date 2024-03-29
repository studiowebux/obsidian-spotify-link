import { CurrentlyPlayingTrack } from "./types";
import { millisToMinutesAndSeconds } from "./utils";

export function processCurrentlyPlayingTrackInput(
	data: CurrentlyPlayingTrack
): string {
	let message = "";
	if (data && data.is_playing) {
		if (!data.item || !data.item.name || !data.item.artists) {
			console.error("processCurrentlyPlayingTrackInput", data);
			// This should never have happened
			return `Feel free to submit this issue on Github Issues. Simply copy the provided content below: ${JSON.stringify(
				data
			)}`;
		}
		const song_name = data.item?.name || "Error: Song name unavailable";
		const artists = data.item?.artists || [];
		const progress = data.progress_ms;
		const duration = parseInt(data.item.duration_ms);
		const url = data.item.external_urls.spotify;
		message = `['**${song_name}**' by ***${artists
			.map((a) => a?.name || "Unknown")
			.join(", ")}*** **${millisToMinutesAndSeconds(progress)}** (${(
			(progress / duration) *
			100
		).toFixed(0)}%)](${url})`;
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
		if (!data.item || !data.item.name || !data.item.artists) {
			console.error("processCurrentlyPlayingTrack", data);
			// This should never have happened
			return `Feel free to submit this issue on Github Issues. Simply copy the provided content below: ${JSON.stringify(
				data
			)}`;
		}
		message = template
			.replace(/{{ song_name }}|{{song_name}}/g, data.item.name)
			.replace(
				/{{ song_link }}|{{song_link}}/g,
				data.item.external_urls.spotify
			)
			.replace(
				/{{ artists }}|{{artist}}/g,
				data.item.artists.map((a) => a.name).join(", ")
			)
			.replace(
				/{{ album_release }}|{{album_release}}/g,
				data.item.album.release_date
			)
			.replace(
				/{{ album_cover_large }}|{{album_cover_large}}/g,
				`![${data.item.album.name}](${data.item.album.images[0].url})`
			)
			.replace(
				/{{ album_cover_medium }}|{{album_cover_medium}}/g,
				`![${data.item.album.name}](${data.item.album.images[1]?.url})`
			)
			.replace(
				/{{ album_cover_small }}|{{album_cover_small}}/g,
				`![${data.item.album.name}](${data.item.album.images[2]?.url})`
			)
			.replace(
				/{{ album_cover_link_large }}|{{album_cover_link_large}}/g,
				data.item.album.images[0].url
			)
			.replace(
				/{{ album_cover_link_medium }}|{{album_cover_link_medium}}/g,
				data.item.album.images[1]?.url
			)
			.replace(
				/{{ album_cover_link_small }}|{{album_cover_link_small}}/g,
				data.item.album.images[2]?.url
			)
			.replace(
				/{{ album_link }}|{{album_link}}/g,
				data.item.album.external_urls.spotify
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
