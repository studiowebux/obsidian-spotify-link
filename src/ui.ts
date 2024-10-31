import { Editor, Notice } from "obsidian";
import {
  getCurrentlyPlayingTrack,
  getCurrentlyPlayingTrackAsString,
} from "./api";
import { processCurrentlyPlayingTrack } from "./output";

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
    new Notice(e.message);
  }
}

export async function handleTemplateEditor(
  editor: Editor,
  template: string,
  clientId: string,
  clientSecret: string,
) {
  try {
    const track = await getCurrentlyPlayingTrack(clientId, clientSecret);
    if (editor) {
      editor.replaceSelection(
        `${await processCurrentlyPlayingTrack(clientId, clientSecret, track, template)}\n\n`,
      );
    }
  } catch (e) {
    new Notice(e.message);
  }
}
