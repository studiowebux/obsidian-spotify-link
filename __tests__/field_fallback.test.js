const test = require("node:test");
const assert = require("node:assert/strict");

const { getTrackMessage, getRecentlyPlayedTrackMessage } = require("../src/track.ts");
const { DEFAULT_SETTINGS } = require("../src/default.ts");
const { DEPRECATED } = require("../src/utils.ts");

const TRACK = {
	name: "Midnight",
	popularity: 73,
	album: {
		name: "Dreams",
		release_date: "2024-03-15",
		images: [{ url: "large" }, { url: "medium" }, { url: "small" }],
		external_urls: { spotify: "https://open.spotify.com/album/1" },
	},
	artists: [{ name: "Artist A", href: "https://api.spotify.com/artists/a" }],
	external_urls: { spotify: "https://open.spotify.com/track/1" },
};

const ARTIST_FULL = {
	name: "Artist A",
	genres: ["indie pop"],
	followers: { total: 1234 },
	popularity: 61,
	images: [{ url: "artist.jpg" }],
};

// What Spotify returns now: followers and popularity are gone from the object.
const ARTIST_STRIPPED = {
	name: "Artist A",
	genres: ["indie pop"],
	images: [{ url: "artist.jpg" }],
};

const render = (template, artists = [ARTIST_FULL], track = TRACK) =>
	getTrackMessage(track, artists, template, []);

const renderWithAlbum = (template, album) =>
	getTrackMessage(TRACK, [ARTIST_FULL], template, [], undefined, album);

test("popularity renders the value when Spotify still returns it", () => {
	assert.equal(render("{{ popularity }}"), "61");
	assert.equal(render("{{ track_popularity }}"), "73");
	assert.equal(render("{{ followers }}"), "1234");
});

test("popularity and followers fall back to the marker when absent", () => {
	assert.equal(render("{{ popularity }}", [ARTIST_STRIPPED]), DEPRECATED);
	assert.equal(render("{{ followers }}", [ARTIST_STRIPPED]), DEPRECATED);
	assert.equal(
		render("{{ track_popularity }}", [ARTIST_STRIPPED], { ...TRACK, popularity: undefined }),
		DEPRECATED,
	);
});

test("a popularity of 0 is a real value, not a missing one", () => {
	assert.equal(render("{{ popularity }}", [{ ...ARTIST_STRIPPED, popularity: 0 }]), "0");
	assert.equal(
		render("{{ track_popularity }}", [ARTIST_FULL], { ...TRACK, popularity: 0 }),
		"0",
	);
});

test("multi-artist output marks only the artists missing data", () => {
	const artists = [ARTIST_FULL, { ...ARTIST_STRIPPED, name: "Artist B" }];
	assert.equal(render("{{ followers }}", artists), `Artist A: 1234, Artist B: ${DEPRECATED}`);
	assert.equal(render("{{ popularity }}", artists), `Artist A: 61, Artist B: ${DEPRECATED}`);
});

test("album fields fall back to the marker when Spotify returns nothing", () => {
	for (const field of [
		"{{ album_popularity }}",
		"{{ album_genres }}",
		"{{ album_genres_array }}",
		"{{ album_genres_hashtag }}",
	]) {
		assert.equal(render(field), DEPRECATED, `${field} should be marked`);
		assert.equal(render(field.replace(/ /g, "")), DEPRECATED, `${field} no-space variant`);
	}

	const empty = { id: "1", name: "Dreams", genres: [] };
	assert.equal(renderWithAlbum("{{ album_genres }}", empty), DEPRECATED);
	assert.equal(renderWithAlbum("{{ album_popularity }}", empty), DEPRECATED);
});

test("album fields render the real value when Spotify does return one", () => {
	const album = { id: "1", name: "Dreams", popularity: 42, genres: ["indie pop", "dream pop"] };

	assert.equal(renderWithAlbum("{{ album_popularity }}", album), "42");
	assert.equal(renderWithAlbum("{{ album_genres }}", album), "indie pop, dream pop");
	assert.equal(
		renderWithAlbum("{{ album_genres_array }}", album),
		'"indie pop", "dream pop"',
	);
	assert.equal(
		renderWithAlbum("{{ album_genres_hashtag }}", album),
		"#indie_pop #dream_pop",
	);
	assert.equal(renderWithAlbum("{{ album_popularity }}", { ...album, popularity: 0 }), "0");
});

test("artist genres are untouched — best effort, empty when unclassified", () => {
	assert.equal(render("{{ genres }}"), "indie pop");
	assert.equal(render("{{ genres }}", [{ ...ARTIST_STRIPPED, genres: [] }]), "");
	assert.equal(render("{{ genres }}", [{ ...ARTIST_STRIPPED, genres: undefined }]), "");
});

test("templates never leak an unreplaced placeholder", () => {
	const template = [
		"{{ song_name }} {{ album }} {{ genres }}",
		"{{ popularity }} {{ followers }} {{ track_popularity }}",
		"{{ album_popularity }} {{ album_genres }} {{ album_genres_hashtag }}",
	].join("\n");

	for (const artists of [[ARTIST_FULL], [ARTIST_STRIPPED]]) {
		const result = render(template, artists);
		assert.equal(result.match(/\{\{.*?\}\}/g), null, `leftover: ${result}`);
	}
});

test("recently played output applies the same rules", () => {
	const played = {
		track: TRACK,
		played_at: "2024-03-15T10:00:00Z",
		context: { type: "playlist", href: "", external_urls: { spotify: "" }, url: "" },
	};

	assert.equal(
		getRecentlyPlayedTrackMessage(played, [ARTIST_STRIPPED], "{{ popularity }}"),
		DEPRECATED,
	);
	assert.equal(
		getRecentlyPlayedTrackMessage(played, [ARTIST_FULL], "{{ followers }}"),
		"1234",
	);
	assert.equal(
		getRecentlyPlayedTrackMessage(played, [ARTIST_FULL], "{{ album_genres }}"),
		DEPRECATED,
	);
});

test("the shipped recently-played template is not empty", () => {
	// An empty template rendered every track to "" and produced a blank note.
	assert.notEqual(DEFAULT_SETTINGS.templates[2].trim(), "");

	const played = {
		track: TRACK,
		played_at: "2024-03-15T10:00:00Z",
		context: { type: "playlist", href: "", external_urls: { spotify: "" }, url: "" },
	};
	const result = getRecentlyPlayedTrackMessage(
		played,
		[ARTIST_FULL],
		DEFAULT_SETTINGS.templates[2],
	);

	assert.notEqual(result.trim(), "");
	assert.equal(result.includes("Midnight"), true);
	assert.equal(result.match(/\{\{.*?\}\}/g), null);
});

test("every shipped template renders something", () => {
	for (const [i, template] of DEFAULT_SETTINGS.templates.entries()) {
		assert.notEqual(template.trim(), "", `templates[${i}] is empty`);
	}
});
