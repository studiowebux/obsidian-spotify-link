import { CurrentlyPlayingTrack, Episode, TemplateOptions } from "./types";
import { formatSpotifyDate, millisToMinutesAndSeconds, millisToSeconds, padZero } from "./utils";

export function isEpisode(data: CurrentlyPlayingTrack) {
	return data.item.type === "episode";
}

export function getEpisodeMessageTimestamp(data: CurrentlyPlayingTrack) {
	if (!isEpisode(data)) throw new Error("Not an episode.");
	const episode = data.item as Episode;

	const episode_name = episode?.name;
	const description = episode?.description;
	const release_date = episode?.release_date;
	const progress = data.progress_ms;
	const duration = episode.duration_ms;
	const url = episode.external_urls.spotify;
	return `['**${episode_name}**': ***${description}***, released ${release_date} | **${millisToMinutesAndSeconds(
		progress,
	)}** (${((progress / duration) * 100).toFixed(0)}%)](${url})`;
}

export function getEpisodeMessage(
	data: CurrentlyPlayingTrack,
	template: string,
	options?: TemplateOptions,
) {
	if (!isEpisode(data)) throw new Error("Not an episode.");
	const episode = data.item as Episode;
	const progressInMilliseconds = data.progress_ms.toFixed(0);
	const progressInSeconds = millisToSeconds(data.progress_ms);
	const progressInMinutesAndSeconds = millisToMinutesAndSeconds(
		data.progress_ms,
	);
	const defaultImageSize = options?.defaultImageSize ?? "";
	const defaultReleaseDateFormat = options?.defaultReleaseDateFormat ?? "";

	return template
		.replace(/{{ episode_name }}|{{episode_name}}/g, episode.name)
		.replace(
			/{{ episode_link }}|{{episode_link}}/g,
			`[${episode.name}](${episode.external_urls.spotify})`,
		)
		.replace(
			/{{ description }}|{{description}}|{{ description\[(\d+)\] }}|{{description\[(\d+)\]}}/g,
			(_, len) => {
				let parsed_len = len;
				if (parseInt(len) > episode.description.length || isNaN(len))
					parsed_len = episode.description.length;

				return `${episode.description.slice(0, parsed_len)}${
					episode.description.length != parsed_len ? "..." : ""
				}`;
			},
		)
		.replace(
			/{{ duration_ms }}|{{duration_ms}}/g,
			episode.duration_ms.toString(),
		)
		.replace(
			/{{ audio_preview_url }}|{{audio_preview_url}}/g,
			`![Audio preview url](${episode.audio_preview_url})`,
		)
		.replace(
			/{{ episode_cover_large(\|[^\s}]*)? }}|{{episode_cover_large}}/g,
			(_match, sizeParam) => {
				const size = sizeParam?.substring(1) || defaultImageSize;
				const sizeStr = size ? `|${size}` : "";
				return `![${episode.name}${sizeStr}](${episode.images[0]?.url})`;
			},
		)
		.replace(
			/{{ episode_cover_medium(\|[^\s}]*)? }}|{{episode_cover_medium}}/g,
			(_match, sizeParam) => {
				const size = sizeParam?.substring(1) || defaultImageSize;
				const sizeStr = size ? `|${size}` : "";
				return `![${episode.name}${sizeStr}](${episode.images[1]?.url})`;
			},
		)
		.replace(
			/{{ episode_cover_small(\|[^\s}]*)? }}|{{episode_cover_small}}/g,
			(_match, sizeParam) => {
				const size = sizeParam?.substring(1) || defaultImageSize;
				const sizeStr = size ? `|${size}` : "";
				return `![${episode.name}${sizeStr}](${episode.images[2]?.url})`;
			},
		)
		.replace(
			/{{ episode_cover_link_large }}|{{episode_cover_link_large}}/g,
			`[Cover - ${episode.name}](${episode.images[0].url})`,
		)
		.replace(
			/{{ episode_cover_link_medium }}|{{episode_cover_link_medium}}/g,
			`[Cover - ${episode.name}](${episode.images[1]?.url})`,
		)
		.replace(
			/{{ episode_cover_link_small }}|{{episode_cover_link_small}}/g,
			`[Cover - ${episode.name}](${episode.images[2]?.url})`,
		)
		.replace(
			/{{ episode_cover_url_large }}|{{episode_cover_url_large}}/g,
			`${episode.images[0]?.url}`,
		)
		.replace(
			/{{ episode_cover_url_medium }}|{{episode_cover_url_medium}}/g,
			`${episode.images[1]?.url}`,
		)
		.replace(
			/{{ episode_cover_url_small }}|{{episode_cover_url_small}}/g,
			`${episode.images[2]?.url}`,
		)
		.replace(
			/{{ episode_url }}|{{episode_url}}/g,
			episode.external_urls.spotify,
		)
		.replace(
			/{{ release_date(\|[^\s}]*)? }}|{{release_date}}/g,
			(_match, fmtParam) => {
				const fmt = fmtParam?.substring(1) || defaultReleaseDateFormat;
				return formatSpotifyDate(episode.release_date, fmt);
			},
		)
		.replace(/{{ show_name }}|{{show_name}}/g, episode.show.name)
		.replace(/{{ publisher }}|{{publisher}}/g, episode.show.publisher)
		.replace(
			/{{ show_description }}|{{show_description}}/g,
			episode.show.description,
		)
		.replace(
			/{{ show_link }}|{{show_link}}/g,
			episode.show.external_urls.spotify,
		)
		.replace(
			/{{ total_episodes }}|{{total_episodes}}/g,
			episode.show.total_episodes.toString(),
		)
		.replace(/{{ progress_ms }}|{{progress_ms}}/g, progressInMilliseconds)
		.replace(/{{ progress_sec }}|{{progress_sec}}/g, progressInSeconds)
		.replace(
			/{{ progress_min_sec }}|{{progress_min_sec}}/g,
			progressInMinutesAndSeconds,
		)
		.replace(
			/{{ timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}|{{timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))?}}/g,
			(_match, ...options) => {
				const matches = options
					.slice(0, options.length - 2)
					.filter((m) => m !== undefined);

				let timestamp = "";
				const hasYearMonthDate = matches.includes("YYYY-MM-DD");
				const hasHourMinutes =
					matches.includes(" HH:mm") || matches.includes("HH:mm");
				if (matches.includes("z")) {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getUTCFullYear()}-${padZero(new Date().getUTCMonth() + 1)}-${padZero(new Date().getUTCDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getUTCHours())}:${padZero(new Date().getUTCMinutes())}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toISOString()}`;
					}
				} else {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getFullYear()}-${padZero(new Date().getMonth() + 1)}-${padZero(new Date().getDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getHours())}:${padZero(new Date().getMinutes())}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`;
					}
				}

				return timestamp;
			},
		);
}
