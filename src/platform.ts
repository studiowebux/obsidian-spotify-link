import { Platform } from "obsidian";

type ElectronShell = { openExternal(url: string): void };

declare global {
	interface Window {
		electron?: { shell?: ElectronShell; remote?: { shell?: ElectronShell } };
		require?: (module: string) => { shell?: ElectronShell };
	}
}

// Obsidian exposes Electron differently across versions; none of these exist on mobile.
function getElectronShell(): ElectronShell | null {
	if (!Platform.isDesktopApp) return null;
	try {
		return (
			window.electron?.shell ??
			window.electron?.remote?.shell ??
			window.require?.("electron")?.shell ??
			null
		);
	} catch (e) {
		console.error("Spotify Link Plugin: could not resolve Electron shell", e);
		return null;
	}
}

// Web viewer intercepts window.open and loads the page in an in-app webview
// that cannot follow the obsidian:// redirect; shell.openExternal bypasses it.
export function openExternal(url: string): boolean {
	const shell = getElectronShell();

	if (shell) {
		try {
			shell.openExternal(url);
			return true;
		} catch (e) {
			console.error("Spotify Link Plugin: shell.openExternal failed", e);
		}
	}

	try {
		window.open(url, "_blank");
		return false;
	} catch (e) {
		console.error("Spotify Link Plugin: window.open failed", e);
		return false;
	}
}
