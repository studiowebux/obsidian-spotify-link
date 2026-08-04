// Pure OAuth helpers — no Obsidian imports, so tests can require() this directly.

export type AuthRedirect = {
	code?: string;
	state?: string;
	error?: string;
};

export function buildLoginUrl(
	clientId: string,
	state: string,
	scope: string,
	redirectUri: string,
): string {
	// scope is space-separated; shell.openExternal will not fix an unencoded URL.
	const q = new URLSearchParams({
		response_type: "code",
		client_id: clientId,
		scope: scope,
		redirect_uri: redirectUri,
		state: state,
	});
	return `https://accounts.spotify.com/authorize?${q.toString()}`;
}

/**
 * Parse a pasted redirect URL. Accepts a full `obsidian://spotify-auth/?...`,
 * a bare `?code=...&state=...`, or just the query string.
 */
export function parseAuthRedirect(input: string): AuthRedirect {
	if (!input) return {};

	const trimmed = input.trim();
	const queryStart = trimmed.indexOf("?");
	let query = queryStart >= 0 ? trimmed.slice(queryStart + 1) : trimmed;

	const hashIndex = query.indexOf("#");
	if (hashIndex >= 0) query = query.slice(0, hashIndex);

	if (!query.includes("=")) return {};

	const params = new URLSearchParams(query);
	const result: AuthRedirect = {};
	const code = params.get("code");
	const state = params.get("state");
	const error = params.get("error");
	if (code) result.code = code;
	if (state) result.state = state;
	if (error) result.error = error;
	return result;
}
