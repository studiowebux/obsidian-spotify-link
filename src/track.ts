import { formatSpotifyDate, millisToMinutesAndSeconds, padZero } from "./utils";
import { AlbumDetail, Artist, CurrentlyPlayingTrack, TemplateOptions, Track, TrackType } from "./types";


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
	return `['**${song_name}**' by ***${
		artists
			.map((a) => a?.name || "Unknown")
			.join(", ")
	}*** **${millisToMinutesAndSeconds(progress)}** (${
		(
			(progress / duration) *
			100
		).toFixed(0)
	}%)](${url})`;
}

export function getTrackMessage(
	track: Track,
	artists: Artist[],
	template: string,
	playlistNames: string[] = [],
	options?: TemplateOptions,
	album?: AlbumDetail,
) {
	const defaultImageSize = options?.defaultImageSize ?? "";
	const defaultReleaseDateFormat = options?.defaultReleaseDateFormat ?? "";
	return template
		.replace(/{{ song_name }}|{{song_name}}/g, track.name)
		.replace(
			/{{ song_link }}|{{song_link}}/g,
			`[${track.name} - ${
				track.artists.map((a) => a.name).join(", ")
			}](${track.external_urls.spotify})`,
		)
		.replace(
			/{{ artists }}|{{artists}}/g,
			track.artists.map((a) => a.name).join(", "),
		)
		.replace(
			/{{ artists_formatted(:.*?)?(:.*?)? }}|{{artists_formatted(:.*?)?(:.*?)?}}/g,
			(_match, ...opts) => {
				const matches = opts
					.slice(0, opts.length - 2)
					.filter((m) => m !== undefined);

				const prefix = matches[0]?.substring(1) || "";
				const suffix = matches[1]?.substring(1) || "";
				const isTag = prefix === "#";

				if (isTag) {
					return track.artists
						.map(
							(a) =>
								`${prefix}${
									a.name?.replace(/ /g, "_")
								}${suffix}`,
						)
						.join("\n");
				}

				return track.artists
					.map((a) => `${prefix}${a.name}${suffix}`)
					.join("\n");
			},
		)
		.replace(
			/{{ album_release(\\?\|[^\s}]*)? }}|{{album_release(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const fmtParam = p1 ?? p2;
				const fmt = fmtParam?.replace(/^\\?\|/, '') || defaultReleaseDateFormat;
				return formatSpotifyDate(track.album.release_date, fmt);
			},
		)
		.replace(
			/{{ album_cover_large(\\?\|[^\s}]*)? }}|{{album_cover_large(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[0]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_medium(\\?\|[^\s}]*)? }}|{{album_cover_medium(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[1]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_small(\\?\|[^\s}]*)? }}|{{album_cover_small(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[2]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_link_large }}|{{album_cover_link_large}}/g,
			`[Cover - ${track.album.name}](${track.album.images[0]?.url})`,
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
			(_match, ...tsOpts) => {
				const matches = tsOpts
					.slice(0, tsOpts.length - 2)
					.filter((m) => m !== undefined);

				let timestamp = "";
				const hasYearMonthDate = matches.includes("YYYY-MM-DD");
				const hasHourMinutes = matches.includes(" HH:mm") ||
					matches.includes("HH:mm");
				if (matches.includes("z")) {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getUTCFullYear()}-${
							padZero(new Date().getUTCMonth() + 1)
						}-${padZero(new Date().getUTCDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getUTCHours())}:${
							padZero(new Date().getUTCMinutes())
						}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toISOString()}`;
					}
				} else {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getFullYear()}-${
							padZero(new Date().getMonth() + 1)
						}-${padZero(new Date().getDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getHours())}:${
							padZero(new Date().getMinutes())
						}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toDateString()} - ${
							new Date().toLocaleTimeString()
						}`;
					}
				}

				return timestamp;
			},
		)
		.replace(
			/{{ genres }}|{{genres}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.join(", "),
		)
		.replace(
			/{{ genres_array }}|{{genres_array}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.map((g) => `"${g}"`)
				.join(", "),
		)
		.replace(
			/{{ genres_hashtag }}|{{genres_hashtag}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.map((g) => `#${g.replace(/ /g, "_")}`)
				.join(" "),
		)
		.replace(
			/{{ followers }}|{{followers}}/g,
			artists.length > 1
				? artists
					?.map(
						(artist) => `${artist.name}: ${artist.followers?.total ?? 0}`,
					)
					.join(", ")
				: (artists[0].followers?.total ?? 0).toString(),
		)
		.replace(
			/{{ popularity }}|{{popularity}}/g,
			artists.length > 1
				? artists
					?.map(
						(artist) => `${artist.name}: ${artist.popularity ?? 0}`,
					)
					.join(", ")
				: (artists[0].popularity ?? 0).toString(),
		)
		.replace(
			/{{ track_popularity }}|{{track_popularity}}/g,
			(track.popularity ?? 0).toString(),
		)
		.replace(
			/{{ album_popularity }}|{{album_popularity}}/g,
			album ? (album.popularity ?? 0).toString() : "",
		)
		.replace(
			/{{ album_genres }}|{{album_genres}}/g,
			album ? Array.from(new Set(album.genres ?? [])).join(", ") : "",
		)
		.replace(
			/{{ album_genres_array }}|{{album_genres_array}}/g,
			album ? Array.from(new Set(album.genres ?? [])).map((g) => `"${g}"`).join(", ") : "",
		)
		.replace(
			/{{ album_genres_hashtag }}|{{album_genres_hashtag}}/g,
			album ? Array.from(new Set(album.genres ?? [])).map((g) => `#${g.replace(/ /g, "_")}`).join(" ") : "",
		)
		.replace(
			/{{ artist_image_link }}|{{artist_image_link}}/g,
			artists
				?.map((artist) => `[${artist.name}](${artist.images[0]?.url})`)
				.join(", "),
		)
		.replace(
			/{{ artist_image_url }}|{{artist_image_url}}/g,
			artists
				?.map((artist) => `${artist.images[0]?.url}`)
				.join(", "),
		)
		.replace(
			/{{ artist_image(\\?\|[^\s}]*)? }}|{{artist_image(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return artists
					?.map((artist) => `![${artist.name}${sizeStr}](${artist.images[0]?.url})`)
					.join(", ");
			},
		)
		.replace(
			/{{ artist_name }}|{{artist_name}}/g,
			artists?.map((artist) => artist.name).join(", "),
		)
		.replace(
			/{{ album_cover_url_large }}|{{album_cover_url_large}}/g,
			`${track.album.images[0]?.url}`,
		)
		.replace(
			/{{ album_cover_url_medium }}|{{album_cover_url_medium}}/g,
			`${track.album.images[1]?.url}`,
		)
		.replace(
			/{{ album_cover_url_small }}|{{album_cover_url_small}}/g,
			`${track.album.images[2]?.url}`,
		)
		.replace(/{{ song_url }}|{{song_url}}/g, track.external_urls.spotify)
		.replace(/{{ album_url }}|{{album_url}}/g, track.album.external_urls.spotify)
		.replace(
			/{{ main_artist_url }}|{{main_artist_url}}/g,
			track.artists[0]?.href,
		)
		.replace(
			/{{ playlists }}|{{playlists}}/g,
			playlistNames.join(", "),
		);
}

export function getRecentlyPlayedTrackMessage(
	data: {
		track: Track;
		played_at: string;
		context: {
			type: string;
			href: string;
			external_urls: {
				spotify: string;
			};
			url: string;
		};
	},
	artists: Artist[],
	template: string,
	options?: TemplateOptions,
	album?: AlbumDetail,
) {
	const track = data.track as Track;
	const defaultImageSize = options?.defaultImageSize ?? "";
	const defaultReleaseDateFormat = options?.defaultReleaseDateFormat ?? "";
	return template
		.replace(/{{ song_name }}|{{song_name}}/g, track.name)
		.replace(
			/{{ played_at }}|{{played_at}}/g,
			`${`${new Date(data.played_at).getFullYear()}-${
				padZero(new Date(data.played_at).getMonth() + 1)
			}-${padZero(new Date(data.played_at).getDate())}`} ${
				padZero(new Date(data.played_at).getHours())
			}:${padZero(new Date(data.played_at).getMinutes())}`,
		)
		.replace(
			/{{ song_link }}|{{song_link}}/g,
			`[${track.name} - ${
				track.artists.map((a) => a.name).join(", ")
			}](${track.external_urls.spotify})`,
		)
		.replace(
			/{{ artists }}|{{artists}}/g,
			track.artists.map((a) => a.name).join(", "),
		)
		.replace(
			/{{ artists_formatted(:.*?)?(:.*?)? }}|{{artists_formatted(:.*?)?(:.*?)?}}/g,
			(_match, ...opts) => {
				const matches = opts
					.slice(0, opts.length - 2)
					.filter((m) => m !== undefined);

				const prefix = matches[0]?.substring(1) || "";
				const suffix = matches[1]?.substring(1) || "";
				const isTag = prefix === "#";

				if (isTag) {
					return track.artists
						.map(
							(a) =>
								`${prefix}${
									a.name?.replace(/ /g, "_")
								}${suffix}`,
						)
						.join("\n");
				}

				return track.artists
					.map((a) => `${prefix}${a.name}${suffix}`)
					.join("\n");
			},
		)
		.replace(
			/{{ album_release(\\?\|[^\s}]*)? }}|{{album_release(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const fmtParam = p1 ?? p2;
				const fmt = fmtParam?.replace(/^\\?\|/, '') || defaultReleaseDateFormat;
				return formatSpotifyDate(track.album.release_date, fmt);
			},
		)
		.replace(
			/{{ album_cover_large(\\?\|[^\s}]*)? }}|{{album_cover_large(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[0]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_medium(\\?\|[^\s}]*)? }}|{{album_cover_medium(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[1]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_small(\\?\|[^\s}]*)? }}|{{album_cover_small(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${track.album.name}${sizeStr}](${track.album.images[2]?.url})`;
			},
		)
		.replace(
			/{{ album_cover_link_large }}|{{album_cover_link_large}}/g,
			`[Cover - ${track.album.name}](${track.album.images[0]?.url})`,
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
			(_match, ...tsOpts) => {
				const matches = tsOpts
					.slice(0, tsOpts.length - 2)
					.filter((m) => m !== undefined);

				let timestamp = "";
				const hasYearMonthDate = matches.includes("YYYY-MM-DD");
				const hasHourMinutes = matches.includes(" HH:mm") ||
					matches.includes("HH:mm");
				if (matches.includes("z")) {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getUTCFullYear()}-${
							padZero(new Date().getUTCMonth() + 1)
						}-${padZero(new Date().getUTCDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getUTCHours())}:${
							padZero(new Date().getUTCMinutes())
						}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toISOString()}`;
					}
				} else {
					if (hasYearMonthDate) {
						timestamp += `${new Date().getFullYear()}-${
							padZero(new Date().getMonth() + 1)
						}-${padZero(new Date().getDate())}`;
					}
					if (hasHourMinutes) {
						if (timestamp.length > 0) {
							timestamp += " ";
						}
						timestamp += `${padZero(new Date().getHours())}:${
							padZero(new Date().getMinutes())
						}`;
					}

					if (matches.length === 1) {
						timestamp = `${new Date().toDateString()} - ${
							new Date().toLocaleTimeString()
						}`;
					}
				}

				return timestamp;
			},
		)
		.replace(
			/{{ genres }}|{{genres}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.join(", "),
		)
		.replace(
			/{{ genres_array }}|{{genres_array}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.map((g) => `"${g}"`)
				.join(", "),
		)
		.replace(
			/{{ genres_hashtag }}|{{genres_hashtag}}/g,
			Array.from(new Set(artists?.flatMap((artist) => artist.genres ?? [])))
				.map((g) => `#${g.replace(/ /g, "_")}`)
				.join(" "),
		)
		.replace(
			/{{ followers }}|{{followers}}/g,
			artists.length > 1
				? artists
					?.map(
						(artist) => `${artist.name}: ${artist.followers?.total ?? 0}`,
					)
					.join(", ")
				: (artists[0].followers?.total ?? 0).toString(),
		)
		.replace(
			/{{ popularity }}|{{popularity}}/g,
			artists.length > 1
				? artists
					?.map(
						(artist) => `${artist.name}: ${artist.popularity ?? 0}`,
					)
					.join(", ")
				: (artists[0].popularity ?? 0).toString(),
		)
		.replace(
			/{{ track_popularity }}|{{track_popularity}}/g,
			(track.popularity ?? 0).toString(),
		)
		.replace(
			/{{ album_popularity }}|{{album_popularity}}/g,
			album ? (album.popularity ?? 0).toString() : "",
		)
		.replace(
			/{{ album_genres }}|{{album_genres}}/g,
			album ? Array.from(new Set(album.genres ?? [])).join(", ") : "",
		)
		.replace(
			/{{ album_genres_array }}|{{album_genres_array}}/g,
			album ? Array.from(new Set(album.genres ?? [])).map((g) => `"${g}"`).join(", ") : "",
		)
		.replace(
			/{{ album_genres_hashtag }}|{{album_genres_hashtag}}/g,
			album ? Array.from(new Set(album.genres ?? [])).map((g) => `#${g.replace(/ /g, "_")}`).join(" ") : "",
		)
		.replace(
			/{{ artist_image_link }}|{{artist_image_link}}/g,
			artists
				?.map((artist) => `[${artist.name}](${artist.images[0]?.url})`)
				.join(", "),
		)
		.replace(
			/{{ artist_image_url }}|{{artist_image_url}}/g,
			artists
				?.map((artist) => `${artist.images[0]?.url}`)
				.join(", "),
		)
		.replace(
			/{{ artist_image(\\?\|[^\s}]*)? }}|{{artist_image(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return artists
					?.map((artist) => `![${artist.name}${sizeStr}](${artist.images[0]?.url})`)
					.join(", ");
			},
		)
		.replace(
			/{{ artist_name }}|{{artist_name}}/g,
			artists?.map((artist) => artist.name).join(", "),
		)
		.replace(
			/{{ album_cover_url_large }}|{{album_cover_url_large}}/g,
			`${track.album.images[0]?.url}`,
		)
		.replace(
			/{{ album_cover_url_medium }}|{{album_cover_url_medium}}/g,
			`${track.album.images[1]?.url}`,
		)
		.replace(
			/{{ album_cover_url_small }}|{{album_cover_url_small}}/g,
			`${track.album.images[2]?.url}`,
		)
		.replace(/{{ song_url }}|{{song_url}}/g, track.external_urls.spotify)
		.replace(/{{ album_url }}|{{album_url}}/g, track.album.external_urls.spotify)
		.replace(
			/{{ main_artist_url }}|{{main_artist_url}}/g,
			track.artists[0]?.href,
		);
}
