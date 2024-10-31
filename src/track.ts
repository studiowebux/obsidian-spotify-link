import { CurrentlyPlayingTrack, Track, TrackType } from "./types";
import { millisToMinutesAndSeconds, padZero } from "./utils";

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

export function getTrackMessage(data: CurrentlyPlayingTrack, template: string) {
  if (!isTrack(data)) throw new Error("Not a track.");
  const track = data.item as Track;
  return template
    .replace(/{{ song_name }}|{{song_name}}/g, track.name)
    .replace(/{{ song_link }}|{{song_link}}/g, track.external_urls.spotify)
    .replace(
      /{{ artists }}|{{artist}}/g,
      track.artists.map((a) => a.name).join(", "),
    )
    .replace(/{{ album_release }}|{{album_release}}/g, track.album.release_date)
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
      track.album.images[0].url,
    )
    .replace(
      /{{ album_cover_link_medium }}|{{album_cover_link_medium}}/g,
      track.album.images[1]?.url,
    )
    .replace(
      /{{ album_cover_link_small }}|{{album_cover_link_small}}/g,
      track.album.images[2]?.url,
    )
    .replace(
      /{{ album_link }}|{{album_link}}/g,
      track.album.external_urls.spotify,
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
    );
}
