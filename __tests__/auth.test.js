const test = require("node:test");
const assert = require("node:assert/strict");

const { buildLoginUrl, parseAuthRedirect } = require("../src/auth.ts");

const REDIRECT_URI = "obsidian://spotify-auth/";
const SCOPES = "user-read-currently-playing user-read-recently-played playlist-read-private";

test("buildLoginUrl encodes the space-separated scope list", () => {
	const url = buildLoginUrl("client123", "state-abc", SCOPES, REDIRECT_URI);
	const params = new URL(url).searchParams;

	assert.equal(url.includes(" "), false);
	assert.equal(params.get("scope"), SCOPES);
	assert.equal(params.get("client_id"), "client123");
	assert.equal(params.get("state"), "state-abc");
	assert.equal(params.get("redirect_uri"), REDIRECT_URI);
	assert.equal(params.get("response_type"), "code");
});

test("buildLoginUrl encodes the obsidian:// redirect URI", () => {
	const url = buildLoginUrl("id", "state", "scope", REDIRECT_URI);
	assert.ok(url.includes("redirect_uri=obsidian%3A%2F%2Fspotify-auth%2F"));
});

test("buildLoginUrl points at the Spotify authorize endpoint", () => {
	const url = buildLoginUrl("id", "state", "scope", REDIRECT_URI);
	assert.ok(url.startsWith("https://accounts.spotify.com/authorize?"));
});

test("parseAuthRedirect reads a full obsidian:// redirect", () => {
	assert.deepEqual(
		parseAuthRedirect("obsidian://spotify-auth/?code=AQD123&state=abc"),
		{ code: "AQD123", state: "abc" },
	);
});

test("parseAuthRedirect accepts a bare query string", () => {
	assert.deepEqual(parseAuthRedirect("?code=AQD123&state=abc"), {
		code: "AQD123",
		state: "abc",
	});
	assert.deepEqual(parseAuthRedirect("code=AQD123&state=abc"), {
		code: "AQD123",
		state: "abc",
	});
});

test("parseAuthRedirect trims surrounding whitespace from a paste", () => {
	assert.deepEqual(
		parseAuthRedirect("  obsidian://spotify-auth/?code=AQD123&state=abc\n"),
		{ code: "AQD123", state: "abc" },
	);
});

test("parseAuthRedirect decodes percent-encoded values", () => {
	assert.deepEqual(
		parseAuthRedirect("obsidian://spotify-auth/?code=AQ%2FD%2B123&state=my%20state"),
		{ code: "AQ/D+123", state: "my state" },
	);
});

test("parseAuthRedirect drops a trailing fragment", () => {
	assert.deepEqual(
		parseAuthRedirect("obsidian://spotify-auth/?code=AQD123&state=abc#_=_"),
		{ code: "AQD123", state: "abc" },
	);
});

test("parseAuthRedirect surfaces a denied consent", () => {
	assert.deepEqual(
		parseAuthRedirect("obsidian://spotify-auth/?error=access_denied&state=abc"),
		{ state: "abc", error: "access_denied" },
	);
});

test("parseAuthRedirect returns nothing usable for junk input", () => {
	assert.deepEqual(parseAuthRedirect(""), {});
	assert.deepEqual(parseAuthRedirect("   "), {});
	assert.deepEqual(parseAuthRedirect("not a url"), {});
	assert.deepEqual(parseAuthRedirect("https://open.spotify.com/track/123"), {});
	assert.deepEqual(parseAuthRedirect(undefined), {});
});

test("parseAuthRedirect ignores a redirect missing the code", () => {
	assert.deepEqual(parseAuthRedirect("obsidian://spotify-auth/?state=abc"), {
		state: "abc",
	});
});
