const test = require("node:test");
const assert = require("node:assert/strict");

const { getTrackMessage } = require("../src/track.ts");

const TRACK = {
	name: "Midnight",
	artists: [{ name: "Artist One" }, { name: "Bad/Name" }],
	external_urls: { spotify: "https://open.spotify.com/track/1" },
	album: {
		name: "Dreams",
		release_date: "2024-03-15",
		images: [],
		external_urls: { spotify: "https://open.spotify.com/album/1" },
	},
};

const SOLO = { ...TRACK, artists: [{ name: "Artist One" }] };

const render = (template, track = TRACK) => getTrackMessage(track, [], template, []);

test("{{ artists }} is a comma-separated list", () => {
	assert.equal(render("{{ artists }}"), "Artist One, Bad/Name");
	assert.equal(render("{{artists}}"), "Artist One, Bad/Name");
	assert.equal(render("{{ artists }}", SOLO), "Artist One");
});

test("{{ artists_formatted }} puts one artist per line", () => {
	assert.equal(render("{{ artists_formatted }}"), "Artist One\nBad/Name");
	assert.equal(render("{{artists_formatted}}"), "Artist One\nBad/Name");
});

test("{{ artists_formatted:PREFIX:SUFFIX }} wraps each artist", () => {
	assert.equal(
		render("{{ artists_formatted:- [[:]] }}"),
		"- [[Artist One]]\n- [[Bad/Name]]",
	);
});

test("a # prefix sanitizes names into valid tags", () => {
	assert.equal(render("{{ artists_formatted:#: }}"), "#Artist_One\n#Bad_Name");
});

test("YAML list usage produces one indented entry per artist", () => {
	const result = render('artists:\n{{ artists_formatted:  - "[[:]]" }}');
	assert.equal(
		result,
		'artists:\n  - "[[Artist One]]"\n  - "[[Bad/Name]]"',
	);
	assert.equal(result.match(/\{\{.*?\}\}/g), null);
});
