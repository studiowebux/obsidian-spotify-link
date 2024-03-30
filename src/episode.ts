import { CurrentlyPlayingTrack, Episode } from "./types";
import { millisToMinutesAndSeconds } from "./utils";

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
		progress
	)}** (${((progress / duration) * 100).toFixed(0)}%)](${url})`;
}

export function getEpisodeMessage(
	data: CurrentlyPlayingTrack,
	template: string
) {
	if (!isEpisode(data)) throw new Error("Not an episode.");
	const episode = data.item as Episode;

	return template
		.replace(/{{ episode_name }}|{{episode_name}}/g, episode.name)
		.replace(
			/{{ episode_link }}|{{episode_link}}/g,
			episode.external_urls.spotify
		)
		.replace(/{{ description }}|{{description}}/g, episode.description)
		.replace(
			/{{ duration_ms }}|{{duration_ms}}/g,
			episode.duration_ms.toString()
		)
		.replace(
			/{{ audio_preview_url }}|{{audio_preview_url}}/g,
			`![Audio preview url](${episode.audio_preview_url})`
		)
		.replace(
			/{{ episode_cover_large }}|{{episode_cover_large}}/g,
			`![${episode.name}](${episode.images[0]?.url})`
		)
		.replace(
			/{{ episode_cover_medium }}|{{episode_cover_medium}}/g,
			`![${episode.name}](${episode.images[1]?.url})`
		)
		.replace(
			/{{ episode_cover_small }}|{{episode_cover_small}}/g,
			`![${episode.name}](${episode.images[2]?.url})`
		)
		.replace(
			/{{ episode_cover_link_large }}|{{episode_cover_link_large}}/g,
			episode.images[0].url
		)
		.replace(
			/{{ episode_cover_link_medium }}|{{episode_cover_link_medium}}/g,
			episode.images[1]?.url
		)
		.replace(
			/{{ episode_cover_link_small }}|{{episode_cover_link_small}}/g,
			episode.images[2]?.url
		)
		.replace(/{{ release_date }}|{{release_date}}/g, episode.release_date)
		.replace(/{{ show_name }}|{{show_name}}/g, episode.show.name)
		.replace(/{{ publisher }}|{{publisher}}/g, episode.show.publisher)
		.replace(
			/{{ show_description }}|{{show_description}}/g,
			episode.show.description
		)
		.replace(
			/{{ show_link }}|{{show_link}}/g,
			episode.show.external_urls.spotify
		)
		.replace(
			/{{ total_episodes }}|{{total_episodes}}/g,
			episode.show.total_episodes.toString()
		)
		.replace(
			/{{ timestamp }}|{{timestamp}}/g,
			`${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`
		);
}
