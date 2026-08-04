const test = require("node:test");
const assert = require("node:assert/strict");

const { getTrackMessage } = require("../src/track.ts");
const { getEpisodeMessage } = require("../src/episode.ts");
const { padZero } = require("../src/utils.ts");

const TRACK = {
	name: "Midnight",
	artists: [{ name: "Artist A", href: "https://api.spotify.com/artists/a" }],
	external_urls: { spotify: "https://open.spotify.com/track/1" },
	album: {
		name: "Dreams",
		release_date: "2024-03-15",
		images: [],
		external_urls: { spotify: "https://open.spotify.com/album/1" },
	},
};

const EPISODE_DATA = {
	progress_ms: 1000,
	item: {
		type: "episode",
		name: "Ep 1",
		description: "d",
		duration_ms: 2000,
		release_date: "2024-03-15",
		audio_preview_url: null,
		images: [],
		external_urls: { spotify: "https://open.spotify.com/episode/1" },
		show: {
			name: "Show",
			publisher: "P",
			description: "d",
			external_urls: { spotify: "" },
			total_episodes: 1,
		},
	},
};

const render = (template) => getTrackMessage(TRACK, [], template, []);

const now = new Date();
const localDate = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
const utcDate = `${now.getUTCFullYear()}-${padZero(now.getUTCMonth() + 1)}-${padZero(now.getUTCDate())}`;

test("{{ timestamp(YYYY-MM-DD) }} renders the local date", () => {
	assert.equal(render("{{ timestamp(YYYY-MM-DD) }}"), localDate);
});

test("{{ timestampz(YYYY-MM-DD) }} renders the UTC date", () => {
	assert.equal(render("{{ timestampz(YYYY-MM-DD) }}"), utcDate);
});

test("{{ timestamp(HH:mm) }} renders zero-padded time only", () => {
	assert.match(render("{{ timestamp(HH:mm) }}"), /^\d{2}:\d{2}$/);
	assert.match(render("{{ timestampz(HH:mm) }}"), /^\d{2}:\d{2}$/);
});

test("{{ timestamp(YYYY-MM-DD HH:mm) }} renders date and time", () => {
	assert.match(render("{{ timestamp(YYYY-MM-DD HH:mm) }}"), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
	assert.equal(render("{{ timestamp(YYYY-MM-DD HH:mm) }}").startsWith(localDate), true);
});

test("{{ timestampz }} renders an ISO-8601 instant", () => {
	const result = render("{{ timestampz }}");
	assert.match(result, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	assert.equal(Number.isNaN(Date.parse(result)), false);
});

test("{{ timestamp }} renders a human-readable local date and time", () => {
	const result = render("{{ timestamp }}");
	assert.equal(result.includes(" - "), true);
	assert.equal(result.includes(String(now.getFullYear())), true);
});

// Regression: the no-space alternative required a trailing space, so
// {{timestamp}} was left unreplaced in the note.
test("no-space variants are replaced too", () => {
	for (const [spaced, tight] of [
		["{{ timestamp(YYYY-MM-DD) }}", "{{timestamp(YYYY-MM-DD)}}"],
		["{{ timestampz(YYYY-MM-DD) }}", "{{timestampz(YYYY-MM-DD)}}"],
		["{{ timestamp(HH:mm) }}", "{{timestamp(HH:mm)}}"],
	]) {
		assert.equal(render(tight), render(spaced), `${tight} should match ${spaced}`);
	}

	for (const tight of ["{{timestamp}}", "{{timestampz}}"]) {
		assert.equal(render(tight).includes("{{"), false, `${tight} left unreplaced`);
	}
});

test("timestamps resolve everywhere in a multi-line template", () => {
	const template = [
		"a {{ timestamp }}",
		"b {{ timestampz }}",
		"c {{ timestamp(HH:mm) }}",
		"d {{timestamp(YYYY-MM-DD)}}",
		"e {{ timestampz(YYYY-MM-DD HH:mm) }}",
	].join("\n");
	assert.equal(render(template).match(/\{\{.*?\}\}/g), null);
});

test("episodes format timestamps the same way", () => {
	assert.equal(
		getEpisodeMessage(EPISODE_DATA, "{{ timestamp(YYYY-MM-DD) }}"),
		localDate,
	);
	assert.equal(
		getEpisodeMessage(EPISODE_DATA, "{{timestamp(YYYY-MM-DD)}}"),
		localDate,
	);
});
