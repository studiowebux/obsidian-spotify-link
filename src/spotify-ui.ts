import { Editor, Notice } from "obsidian";
import { getCurrentlyPlayingTrackAsString } from "./spotify-api";

export async function handleEditor(editor: Editor) {
	try {
		editor.replaceSelection(
			'\n<div class="section">' +
				"\n\n---\n" +
				"> " +
				new Date().toLocaleString() +
				"\n" +
				"> " +
				((await getCurrentlyPlayingTrackAsString()) + "\n\n") +
				'<p class="text-content">\n\n' +
				"</p>\n" +
				"</div>\n"
		);
		editor.setCursor(editor.getCursor().line - 3);
	} catch (e) {
		new Notice(e.message);
	}
}
