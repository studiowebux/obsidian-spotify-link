import { Editor, Notice } from "obsidian";
import {
  getAllPlaylists,
  getCurrentlyPlayingTrack,
  getCurrentlyPlayingTrackAsString,
} from "./api";
import { processAllPlaylists, processCurrentlyPlayingTrack } from "./output";
import { TemplateOptions } from "./types";

export async function handleEditor(
  editor: Editor,
  clientId: string,
  clientSecret: string,
) {
  try {
    const track = await getCurrentlyPlayingTrackAsString(
      clientId,
      clientSecret,
    );
    if (editor) {
      editor.replaceSelection(
        `> ${track}` +
          `\n> ${new Date().toDateString()} - ${new Date().toLocaleTimeString()}` +
          `\n\n`,
      );
    }
  } catch (e) {
    new Notice(e instanceof Error ? e.message : String(e));
  }
}

export async function handleTemplateEditor(
  editor: Editor,
  template: string,
  clientId: string,
  clientSecret: string,
  options?: TemplateOptions,
) {
  try {
    const track = await getCurrentlyPlayingTrack(clientId, clientSecret);
    if (editor) {
      editor.replaceSelection(
        `${await processCurrentlyPlayingTrack(clientId, clientSecret, track, template, options)}\n\n`,
      );
    }
  } catch (e) {
    new Notice(e instanceof Error ? e.message : String(e));
  }
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
    new Notice(e instanceof Error ? e.message : String(e));
  }
}
