/**
 * Tests for:
 *   - {{ track_popularity }} / {{track_popularity}}
 *   - Genre deduplication fix (flatMap + Set, not Set of arrays)
 *   - Both spaced and no-space token variants
 *
 * Run with: deno run __tests__/new_tokens.test.js
 */

// ---------------------------------------------------------------------------
// Minimal processTemplate — mirrors the relevant parts of getTrackMessage
// ---------------------------------------------------------------------------

function processTemplate(template, track, artists, album = undefined) {
  return template
    // track_popularity
    .replace(
      /{{ track_popularity }}|{{track_popularity}}/g,
      track.popularity.toString(),
    )
    // album_popularity — only populated when album object provided
    .replace(
      /{{ album_popularity }}|{{album_popularity}}/g,
      album ? album.popularity.toString() : "",
    )
    // genres (deduped)
    .replace(
      /{{ genres }}|{{genres}}/g,
      Array.from(new Set(artists.flatMap((a) => a.genres))).join(", "),
    )
    // genres_array (deduped)
    .replace(
      /{{ genres_array }}|{{genres_array}}/g,
      Array.from(new Set(artists.flatMap((a) => a.genres)))
        .map((g) => `"${g}"`)
        .join(", "),
    )
    // genres_hashtag (deduped)
    .replace(
      /{{ genres_hashtag }}|{{genres_hashtag}}/g,
      Array.from(new Set(artists.flatMap((a) => a.genres)))
        .map((g) => `#${g.replace(/ /g, "_")}`)
        .join(" "),
    );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TRACK = {
  name: "Test Song",
  popularity: 72,
  artists: [{ name: "Artist A" }, { name: "Artist B" }],
  album: { name: "Test Album" },
  external_urls: { spotify: "https://open.spotify.com/track/abc123" },
};

// Two artists sharing "indie pop" — the bug was this duplicate survived
const ARTISTS_WITH_DUPLICATES = [
  { name: "Artist A", genres: ["indie pop", "dream pop"] },
  { name: "Artist B", genres: ["indie pop", "electronic"] },
];

const ARTISTS_NO_OVERLAP = [
  { name: "Artist A", genres: ["jazz", "soul"] },
  { name: "Artist B", genres: ["classical"] },
];

const ARTIST_SINGLE = [
  { name: "Solo", genres: ["ambient"] },
];

// ---------------------------------------------------------------------------
// Test runner helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS  ${message}`);
    passed++;
  } else {
    console.error(`  FAIL  ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  PASS  ${message}`);
    passed++;
  } else {
    console.error(`  FAIL  ${message}`);
    console.error(`        expected: ${JSON.stringify(expected)}`);
    console.error(`        actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

const ALBUM = { id: "albumId", name: "Test Album", popularity: 85 };

// ---------------------------------------------------------------------------
// {{ track_popularity }}
// ---------------------------------------------------------------------------

console.log("\n=== track_popularity ===");

assertEqual(
  processTemplate("{{ track_popularity }}", TRACK, ARTIST_SINGLE),
  "72",
  "spaced variant outputs track.popularity",
);

assertEqual(
  processTemplate("{{track_popularity}}", TRACK, ARTIST_SINGLE),
  "72",
  "no-space variant outputs track.popularity",
);

assert(
  !processTemplate("{{ track_popularity }}", TRACK, ARTIST_SINGLE).includes("{{"),
  "no leftover {{ }} after replacement",
);

// popularity: 0 edge case
const TRACK_ZERO = { ...TRACK, popularity: 0 };
assertEqual(
  processTemplate("{{ track_popularity }}", TRACK_ZERO, ARTIST_SINGLE),
  "0",
  "popularity 0 renders as '0', not empty string",
);

// ---------------------------------------------------------------------------
// {{ album_popularity }}
// ---------------------------------------------------------------------------

console.log("\n=== album_popularity ===");

assertEqual(
  processTemplate("{{ album_popularity }}", TRACK, ARTIST_SINGLE, ALBUM),
  "85",
  "spaced variant outputs album.popularity",
);

assertEqual(
  processTemplate("{{album_popularity}}", TRACK, ARTIST_SINGLE, ALBUM),
  "85",
  "no-space variant outputs album.popularity",
);

assertEqual(
  processTemplate("{{ album_popularity }}", TRACK, ARTIST_SINGLE, undefined),
  "",
  "renders empty string when album not loaded (token absent from template)",
);

const ALBUM_ZERO = { id: "albumId", name: "Test Album", popularity: 0 };
assertEqual(
  processTemplate("{{ album_popularity }}", TRACK, ARTIST_SINGLE, ALBUM_ZERO),
  "0",
  "album popularity 0 renders as '0'",
);

// ---------------------------------------------------------------------------
// {{ genres }} deduplication
// ---------------------------------------------------------------------------

console.log("\n=== genres deduplication ===");

const genresResult = processTemplate("{{ genres }}", TRACK, ARTISTS_WITH_DUPLICATES);
assertEqual(
  genresResult,
  "indie pop, dream pop, electronic",
  "duplicate 'indie pop' appears only once",
);

assert(
  genresResult.split(",").map((s) => s.trim()).filter((g) => g === "indie pop").length === 1,
  "exactly one occurrence of 'indie pop'",
);

assertEqual(
  processTemplate("{{genres}}", TRACK, ARTISTS_WITH_DUPLICATES),
  "indie pop, dream pop, electronic",
  "no-space variant also deduplicates",
);

assertEqual(
  processTemplate("{{ genres }}", TRACK, ARTISTS_NO_OVERLAP),
  "jazz, soul, classical",
  "no-overlap artists: all genres preserved",
);

assertEqual(
  processTemplate("{{ genres }}", TRACK, ARTIST_SINGLE),
  "ambient",
  "single artist renders correctly",
);

// ---------------------------------------------------------------------------
// {{ genres_array }} deduplication
// ---------------------------------------------------------------------------

console.log("\n=== genres_array deduplication ===");

const genresArrayResult = processTemplate("{{ genres_array }}", TRACK, ARTISTS_WITH_DUPLICATES);
assertEqual(
  genresArrayResult,
  `"indie pop", "dream pop", "electronic"`,
  "genres_array deduplicates and wraps in quotes",
);

assertEqual(
  processTemplate("{{genres_array}}", TRACK, ARTISTS_WITH_DUPLICATES),
  `"indie pop", "dream pop", "electronic"`,
  "no-space variant matches",
);

// ---------------------------------------------------------------------------
// {{ genres_hashtag }} deduplication
// ---------------------------------------------------------------------------

console.log("\n=== genres_hashtag deduplication ===");

const hashtagResult = processTemplate("{{ genres_hashtag }}", TRACK, ARTISTS_WITH_DUPLICATES);
assertEqual(
  hashtagResult,
  "#indie_pop #dream_pop #electronic",
  "genres_hashtag deduplicates, spaces → underscores",
);

assertEqual(
  processTemplate("{{genres_hashtag}}", TRACK, ARTISTS_WITH_DUPLICATES),
  "#indie_pop #dream_pop #electronic",
  "no-space variant matches",
);

// ---------------------------------------------------------------------------
// Combined template (realistic usage)
// ---------------------------------------------------------------------------

console.log("\n=== combined template ===");

const combined = processTemplate(
  "popularity: {{track_popularity}}\ngenres: {{genres}}\ntags: {{genres_hashtag}}",
  TRACK,
  ARTISTS_WITH_DUPLICATES,
);

assert(combined.includes("popularity: 72"), "track_popularity in combined template");
assert(combined.includes("genres: indie pop, dream pop, electronic"), "genres in combined template");
assert(combined.includes("tags: #indie_pop #dream_pop #electronic"), "genres_hashtag in combined template");
assert(!combined.includes("{{"), "no leftover tokens in combined template");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("Some tests FAILED.");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
