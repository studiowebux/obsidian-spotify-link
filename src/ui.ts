import { Editor, Notice } from "obsidian";
import {
  getAllPlaylists,
  getCurrentlyPlayingTrack,
  getCurrentlyPlayingTrackAsString,
} from "./api";
import { processAllPlaylists, processCurrentlyPlayingTrack } from "./output";
import { TemplateOptions, Track, TrackCommandResult } from "./types";

export async function handleEditor(
  editor: Editor,
  clientId: string,
  clientSecret: string,
): Promise<TrackCommandResult> {
  try {
    const data = await getCurrentlyPlayingTrack(clientId, clientSecret);
    const trackAsString = await getCurrentlyPlayingTrackAsString(
      clientId,
      clientSecret,
    );
    if (editor) {
      editor.replaceSelection(
        `> ${trackAsString}` +
          `\n> ${new Date().toDateString()} - ${new Date().toLocaleTimeString()}` +
          `\n\n`,
      );
    }
    if (data?.item?.type === "track") {
      return { trackId: (data.item as Track).id, playlistNames: [] };
    }
  } catch (e) {
    console.error("Spotify Link Plugin:", e);
    new Notice(e instanceof Error ? e.message : String(e));
  }
  return { trackId: null, playlistNames: [] };
}

export async function handleTemplateEditor(
  editor: Editor,
  template: string,
  clientId: string,
  clientSecret: string,
  options?: TemplateOptions,
): Promise<TrackCommandResult> {
  try {
    const data = await getCurrentlyPlayingTrack(clientId, clientSecret);
    const result = await processCurrentlyPlayingTrack(clientId, clientSecret, data, template, options);
    if (editor) {
      editor.replaceSelection(`${result.content}\n\n`);
    }
    if (data?.item?.type === "track") {
      return { trackId: (data.item as Track).id, playlistNames: result.playlistNames };
    }
  } catch (e) {
    console.error("Spotify Link Plugin:", e);
    new Notice(e instanceof Error ? e.message : String(e));
  }
  return { trackId: null, playlistNames: [] };
}

export async function handlePlaylistsEditor(
  editor: Editor,
  template: string,
  clientId: string,
  clientSecret: string,
  options?: TemplateOptions,
) {
  try {
    const playlists = await getAllPlaylists(clientId, clientSecret);
    if (editor) {
      editor.replaceSelection(
        `${processAllPlaylists(playlists, template, options)}\n\n`,
      );
    }
  } catch (e) {
    console.error("Spotify Link Plugin:", e);
    new Notice(e instanceof Error ? e.message : String(e));
  }
}
