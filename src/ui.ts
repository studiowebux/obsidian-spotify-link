import { Editor, Notice } from "obsidian";
import { getCurrentlyPlayingTrackAsString } from "./api";

export async function handleEditor(editor: Editor, clientId: string) {
	try {
		const track = await getCurrentlyPlayingTrackAsString(clientId);
		editor.replaceSelection(
			`> ${track}` +
				`\n> ${new Date().toDateString()} - ${new Date().toLocaleTimeString()}` +
				`\n\n`
		);
		editor.setCursor(editor.getCursor().line - 3);
	} catch (e) {
		new Notice(e.message);
	}
}
