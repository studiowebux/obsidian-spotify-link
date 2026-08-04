// Pure error mapping — no Obsidian imports, so tests can require() this directly.

export type SpotifyCall = {
	fn: string;
	scope?: string;
	auth?: boolean;
};

const MIGRATION_URL =
	"https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide";

export class SpotifyError extends Error {
	readonly status: number;
	readonly call: SpotifyCall;
	readonly body: unknown;

	constructor(message: string, status: number, call: SpotifyCall, body?: unknown) {
		super(message);
		this.name = "SpotifyError";
		this.status = status;
		this.call = call;
		this.body = body;
	}
}

export function parseBody(text: string | undefined | null): any {
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export function spotifyMessage(body: unknown): string {
	if (!body || typeof body !== "object") return "";
	const b = body as Record<string, any>;
	if (typeof b.error?.message === "string") return b.error.message;
	if (typeof b.error_description === "string") return b.error_description;
	if (typeof b.error === "string") return b.error;
	return "";
}

function errorCode(body: unknown): string {
	if (!body || typeof body !== "object") return "";
	const b = body as Record<string, any>;
	return typeof b.error === "string" ? b.error : "";
}

function describeAuthError(body: unknown, call: SpotifyCall): string {
	const code = errorCode(body);
	const detail = spotifyMessage(body);

	if (code === "invalid_client" || /client/i.test(detail)) {
		return "Spotify rejected your Client ID or Client Secret. Re-copy both from the Spotify Developer Dashboard (Settings → Basic Information), watch for trailing spaces, then click the Spotify ribbon icon to reconnect.";
	}

	if (code === "invalid_grant") {
		return call.fn === "requestRefreshToken"
			? "Your saved Spotify session was revoked or expired. Run \"Clear Spotify session\" in the plugin settings, then click the Spotify ribbon icon to reconnect."
			: "That authorization code was already used or has expired. Click the Spotify ribbon icon and approve access again.";
	}

	if (code === "invalid_request" || /redirect/i.test(detail)) {
		return `Spotify rejected the login request. Check that the Redirect URI in your Spotify app is exactly "obsidian://spotify-auth/".${detail ? ` (Spotify said: ${detail})` : ""}`;
	}

	return `Spotify refused to issue a session. Verify your Client ID, Client Secret and Redirect URI in the plugin settings, then reconnect.${detail ? ` (Spotify said: ${detail})` : ""}`;
}

export function describeSpotifyError(
	status: number,
	body: unknown,
	call: SpotifyCall,
	headers: Record<string, string> = {},
): string {
	const detail = spotifyMessage(body);
	const suffix = detail ? ` (Spotify said: ${detail})` : "";
	const where = ` [${call.fn}]`;

	if (call.auth && (status === 400 || status === 401)) {
		return describeAuthError(body, call) + where;
	}

	switch (status) {
		case 0:
			return `Could not reach Spotify. Check your internet connection.${where}`;
		case 400:
			return `Spotify rejected the request as invalid — check the track/episode ID or URL.${suffix}${where}`;
		case 401:
			return `Your Spotify session is no longer valid. Click the Spotify icon in the left ribbon to reconnect, or use "Clear Spotify session" in the plugin settings to start clean.${suffix}${where}`;
		case 403:
			return [
				`Spotify refused this request (403).`,
				call.scope
					? `Most likely your token is missing the '${call.scope}' scope: add it to Spotify Scopes in the plugin settings, then re-authenticate with the ribbon icon.`
					: `Most likely your token is missing a required scope — check Spotify Scopes in the plugin settings and re-authenticate.`,
				`It can also mean your Spotify app no longer has access: since February 2026, Development Mode apps require the app owner to have an active Spotify Premium subscription, and some endpoints were removed. See ${MIGRATION_URL}`,
			].join(" ") + `${suffix}${where}`;
		case 404:
			return `Not found (404). The item may not exist, or this endpoint was removed by Spotify's February 2026 Development Mode changes. See ${MIGRATION_URL}${suffix}${where}`;
		case 429: {
			const retry = headers["retry-after"] ?? headers["Retry-After"];
			const wait = retry ? ` Wait ${retry}s and try again.` : " Wait a moment and try again.";
			return `Spotify rate limit reached (429).${wait} Lower "Playlist concurrency" or disable "Auto-regenerate playlist notes" in the plugin settings if this keeps happening.${where}`;
		}
	}

	if (status >= 500) {
		return `Spotify is having trouble (${status}). This is on their side — try again shortly.${suffix}${where}`;
	}

	return `Spotify request failed with status ${status}.${suffix}${where}`;
}
