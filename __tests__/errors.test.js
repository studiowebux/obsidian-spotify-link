const test = require("node:test");
const assert = require("node:assert/strict");

const { describeSpotifyError, spotifyMessage, parseBody, SpotifyError } = require("../src/errors.ts");

const CALL = { fn: "getAllPlaylists", scope: "playlist-read-private" };

test("parseBody returns null for an empty 204 body instead of throwing", () => {
	assert.equal(parseBody(""), null);
	assert.equal(parseBody(undefined), null);
	assert.equal(parseBody(null), null);
});

test("parseBody survives a non-JSON body", () => {
	assert.equal(parseBody("<html>502 Bad Gateway</html>"), null);
	assert.equal(parseBody("   "), null);
});

test("parseBody parses a normal payload", () => {
	assert.deepEqual(parseBody('{"is_playing":true}'), { is_playing: true });
	assert.deepEqual(parseBody("[true]"), [true]);
});

test("spotifyMessage reads the Web API error shape", () => {
	assert.equal(spotifyMessage({ error: { message: "Invalid track id" } }), "Invalid track id");
});

test("spotifyMessage reads the token endpoint error shape", () => {
	assert.equal(spotifyMessage({ error_description: "Invalid client" }), "Invalid client");
	assert.equal(spotifyMessage({ error: "invalid_grant" }), "invalid_grant");
});

test("spotifyMessage returns empty for unusable bodies", () => {
	assert.equal(spotifyMessage(null), "");
	assert.equal(spotifyMessage("boom"), "");
	assert.equal(spotifyMessage({}), "");
});

test("401 tells the user how to reconnect", () => {
	const msg = describeSpotifyError(401, null, CALL);
	assert.match(msg, /ribbon/i);
	assert.match(msg, /Clear Spotify session/i);
});

test("403 names the scope the call needs", () => {
	const msg = describeSpotifyError(403, null, CALL);
	assert.match(msg, /'playlist-read-private'/);
	assert.match(msg, /Premium/);
});

test("403 without a known scope still gives direction", () => {
	const msg = describeSpotifyError(403, null, { fn: "getMe" });
	assert.match(msg, /Spotify Scopes/);
	assert.doesNotMatch(msg, /undefined/);
});

test("429 surfaces Retry-After when Spotify sends it", () => {
	assert.match(describeSpotifyError(429, null, CALL, { "retry-after": "30" }), /Wait 30s/);
	assert.match(describeSpotifyError(429, null, CALL), /Wait a moment/);
});

test("404 mentions the removed-endpoint possibility", () => {
	assert.match(describeSpotifyError(404, null, CALL), /removed/i);
});

test("status 0 is reported as a connectivity problem", () => {
	assert.match(describeSpotifyError(0, null, CALL), /Could not reach Spotify/);
});

test("5xx is attributed to Spotify", () => {
	assert.match(describeSpotifyError(503, null, CALL), /on their side/);
});

test("unknown statuses still produce a usable message", () => {
	const msg = describeSpotifyError(418, null, CALL);
	assert.match(msg, /status 418/);
});

test("every message is attributed to the failing call", () => {
	for (const status of [0, 400, 401, 403, 404, 429, 500, 418]) {
		assert.match(
			describeSpotifyError(status, null, CALL),
			/\[getAllPlaylists\]/,
			`status ${status} should name the call`,
		);
	}
});

test("Spotify's own message is appended when present", () => {
	const msg = describeSpotifyError(400, { error: { message: "invalid id" } }, CALL);
	assert.match(msg, /Spotify said: invalid id/);
});

const AUTH = { fn: "requestAccessToken", auth: true };
const REFRESH = { fn: "requestRefreshToken", auth: true };

test("a bad client secret points at the credentials, not a track id", () => {
	const msg = describeSpotifyError(
		400,
		{ error: "invalid_client", error_description: "Invalid client secret" },
		AUTH,
	);
	assert.match(msg, /Client ID or Client Secret/);
	assert.match(msg, /Developer Dashboard/);
	assert.doesNotMatch(msg, /track/i);
});

test("a stale authorization code tells the user to approve again", () => {
	const msg = describeSpotifyError(400, { error: "invalid_grant" }, AUTH);
	assert.match(msg, /already used or has expired/);
	assert.doesNotMatch(msg, /track/i);
});

test("a revoked refresh token points at Clear Spotify session", () => {
	const msg = describeSpotifyError(400, { error: "invalid_grant" }, REFRESH);
	assert.match(msg, /Clear Spotify session/);
});

test("a bad redirect URI is named explicitly", () => {
	const msg = describeSpotifyError(
		400,
		{ error: "invalid_request", error_description: "Invalid redirect URI" },
		AUTH,
	);
	assert.match(msg, /obsidian:\/\/spotify-auth\//);
});

test("an unrecognised auth failure still points at the credentials", () => {
	const msg = describeSpotifyError(401, { error: "unknown_thing" }, AUTH);
	assert.match(msg, /Client ID, Client Secret and Redirect URI/);
});

test("non-auth calls keep the track-oriented 400 message", () => {
	const msg = describeSpotifyError(400, { error: { message: "invalid id" } }, CALL);
	assert.match(msg, /track\/episode ID or URL/);
});

test("SpotifyError carries the status for callers to branch on", () => {
	const err = new SpotifyError("nope", 403, CALL, { error: {} });
	assert.equal(err.status, 403);
	assert.equal(err.call.fn, "getAllPlaylists");
	assert.ok(err instanceof Error);
});
