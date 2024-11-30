import { millisToMinutesAndSeconds, padZero } from "./utils";
import { Artist, CurrentlyPlayingTrack, Track, TrackType } from "./types";

export function getTrackType(data: CurrentlyPlayingTrack): TrackType {
	return data.currently_playing_type;
}
export function isTrack(data: CurrentlyPlayingTrack) {
	return data.item.type === "track";
}

export function getTrackMessageTimestamp(data: CurrentlyPlayingTrack) {
	if (!isTrack(data)) throw new Error("Not a track.");
	const track = data.item as Track;
	const song_name = track?.name || "Error: Song name unavailable";
	const artists = track?.artists || [];
	const progress = data.progress_ms;
	const duration = parseInt(track.duration_ms);
	const url = track.external_urls.spotify;
	return `['**${song_name}**' by ***${artists
		.map((a) => a?.name || "Unknown")
		.join(", ")}*** **${millisToMinutesAndSeconds(progress)}** (${(
		(progress / duration) *
		100
	).toFixed(0)}%)](${url})`;
}

export function getTrackMessage(
	data: CurrentlyPlayingTrack,
	artists: Artist[],
	template: string,
) {
	if (!isTrack(data)) throw new Error("Not a track.");
	const track = data.item as Track;
	console.log(template);
	return template
		.replace(/{{ song_name }}|{{song_name}}/g, track.name)
		.replace(
			/{{ song_link }}|{{song_link}}/g,
			`[${track.name} - ${track.artists.map((a) => a.name).join(", ")}](${track.external_urls.spotify})`,
		)
		.replace(
			/{{ artists }}|{{artist}}/g,
			track.artists.map((a) => a.name).join(", "),
		)
		.replace(
			/{{ artists_formatted(:.*?)?(:.*?)? }}|{{artists_formatted(:.*?)?(:.*?)?}}/g,
			(_match, ...options) => {
				console.log("Bonjour");
				const matches = options
					.slice(0, options.length - 2)
					.filter((m) => m !== undefined);

				const prefix = matches[0]?.substring(1) || "";
				const suffix = matches[1]?.substring(1) || "";

				return track.artists
					.map((a) => `${prefix}${a.name}${suffix}`)
					.join("\n");
			},
		)
		.replace(
			/{{ album_release }}|{{album_release}}/g,
			track.album.release_date,
		)
		.replace(
			/{{ album_cover_large }}|{{album_cover_large}}/g,
			`![${track.album.name}](${track.album.images[0].url})`,
		)
		.replace(
			/{{ album_cover_medium }}|{{album_cover_medium}}/g,
			`![${track.album.name}](${track.album.images[1]?.url})`,
		)
		.replace(
			/{{ album_cover_small }}|{{album_cover_small}}/g,
			`![${track.album.name}](${track.album.images[2]?.url})`,
		)
		.replace(
			/{{ album_cover_link_large }}|{{album_cover_link_large}}/g,
			`[Cover - ${track.album.name}](${track.album.images[0].url})`,
		)
		.replace(
			/{{ album_cover_link_medium }}|{{album_cover_link_medium}}/g,
			`[Cover - ${track.album.name}](${track.album.images[1]?.url})`,
		)
		.replace(
			/{{ album_cover_link_small }}|{{album_cover_link_small}}/g,
			`[Cover - ${track.album.name}](${track.album.images[2]?.url})`,
		)
		.replace(
			/{{ album_link }}|{{album_link}}/g,
			`[${track.album.name}](${track.album.external_urls.spotify})`,
		)
		.replace(/{{ album }}|{{album}}/g, track.album.name)
		.replace(
			/{{ timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}|{{timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}/g,
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
		)
		.replace(
			/{{ genres }}|{{genres}}/g,
			Array.from(new Set(artists?.map((artist) => artist.genres)))
				.flat(Infinity)
				.join(", "),
		)
		.replace(
			/{{ genres_array }}|{{genres_array}}/g,
			Array.from(
				new Set(
					artists?.map((artist) =>
						artist.genres?.map((g) => `"${g}"`),
					),
				),
			)
				.flat(Infinity)
				.join(", "),
		)
		.replace(
			/{{ genres_hashtag }}|{{genres_hashtag}}/g,
			Array.from(
				new Set(
					artists?.map((artist) =>
						artist.genres?.map((g) => `#${g.replace(/ /g, "_")}`),
					),
				),
			)
				.flat(Infinity)
				.join(" "),
		)
		.replace(
			/{{ followers }}|{{followers}}/g,
			artists.length > 1
				? artists
						?.map(
							(artist) =>
								`${artist.name}: ${artist.followers.total}`,
						)
						.join(", ")
				: artists[0].followers.total.toString(),
		)
		.replace(
			/{{ popularity }}|{{popularity}}/g,
			artists.length > 1
				? artists
						?.map(
							(artist) => `${artist.name}: ${artist.popularity}`,
						)
						.join(", ")
				: artists[0].popularity.toString(),
		)
		.replace(
			/{{ artist_image }}|{{artist_image}}/g,
			artists
				?.map((artist) => `![${artist.name}](${artist.images[0].url})`)
				.join(", "),
		)
		.replace(
			/{{ artist_name }}|{{artist_name}}/g,
			artists?.map((artist) => artist.name).join(", "),
		);
}
