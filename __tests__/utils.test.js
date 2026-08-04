const test = require("node:test");
const assert = require("node:assert/strict");

const { enabledItems, formatSpotifyDate, isPath } = require("../src/utils.ts");

const names = (items) => enabledItems(items).map((i) => i.name);

test("enabledItems keeps every enabled item", () => {
	const menu = [
		{ name: "a", enabled: true },
		{ name: "b", enabled: true },
	];
	assert.deepEqual(names(menu), ["a", "b"]);
});

test("enabledItems does not stop at the first disabled item", () => {
	const menu = [
		{ name: "a", enabled: false },
		{ name: "b", enabled: true },
		{ name: "c", enabled: true },
	];
	assert.deepEqual(names(menu), ["b", "c"]);
});

test("enabledItems handles a trailing disabled item (the shipped default)", () => {
	const menu = [
		{ name: "a", enabled: true },
		{ name: "b", enabled: true },
		{ name: "track-by-id", enabled: false },
	];
	assert.deepEqual(names(menu), ["a", "b"]);
});

test("enabledItems returns empty for all-disabled, undefined and empty input", () => {
	assert.deepEqual(enabledItems([{ name: "a", enabled: false }]), []);
	assert.deepEqual(enabledItems(undefined), []);
	assert.deepEqual(enabledItems([]), []);
});

test("formatSpotifyDate returns the raw date when no format is set", () => {
	assert.equal(formatSpotifyDate("2024-03-15", ""), "2024-03-15");
	assert.equal(formatSpotifyDate("", "YYYY"), "");
});

test("formatSpotifyDate handles Spotify's three precisions", () => {
	assert.equal(formatSpotifyDate("2024-03-15", "YYYY"), "2024");
	assert.equal(formatSpotifyDate("2024-03-15", "MM/DD/YYYY"), "03/15/2024");
	assert.equal(formatSpotifyDate("2024-03", "YYYY-MM"), "2024-03");
	assert.equal(formatSpotifyDate("2024", "YYYY"), "2024");
});

test("isPath flags path-looking template values", () => {
	assert.equal(isPath("Templates/Spotify/track.md"), true);
	assert.equal(isPath("**Song:** {{ song_name }}"), false);
});
