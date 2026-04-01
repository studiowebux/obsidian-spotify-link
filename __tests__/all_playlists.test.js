/**
 * Tests for the "all playlists" feature.
 *
 * Covers:
 *   1. getPlaylistMessage — all template tokens (spaced / no-space variants)
 *   2. processAllPlaylists — multi-playlist output
 *   3. Opt-out behaviour (enablePlaylists = false)
 *   4. Edge cases (empty playlists, missing images, empty description, etc.)
 *   5. Image size overrides (inline param, default setting, escaped pipe)
 *
 * Run with: deno run __tests__/all_playlists.test.js
 */

// ---------------------------------------------------------------------------
// Template processor (mirrors src/playlist.ts — getPlaylistMessage)
// ---------------------------------------------------------------------------

function getPlaylistMessage(playlist, template, options = {}) {
  const defaultImageSize = options.defaultImageSize ?? "";
  return template
    .replace(
      /{{ playlist_name }}|{{playlist_name}}/g,
      playlist.name,
    )
    .replace(
      /{{ playlist_link }}|{{playlist_link}}/g,
      `[${playlist.name}](${playlist.external_urls.spotify})`,
    )
    .replace(
      /{{ playlist_url }}|{{playlist_url}}/g,
      playlist.external_urls.spotify,
    )
    .replace(
      /{{ playlist_description }}|{{playlist_description}}/g,
      playlist.description,
    )
    .replace(
      /{{ playlist_track_count }}|{{playlist_track_count}}/g,
      String(playlist.tracks.total),
    )
    .replace(
      /{{ playlist_cover_large(\\?\|[^\s}]*)? }}|{{playlist_cover_large(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
        const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
        const sizeStr = size ? `${sep}${size}` : "";
        return `![${playlist.name}${sizeStr}](${playlist.images[0]?.url ?? ""})`;
      },
    )
    .replace(
      /{{ playlist_cover_small(\\?\|[^\s}]*)? }}|{{playlist_cover_small(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
        const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
        const sizeStr = size ? `${sep}${size}` : "";
        const img = playlist.images.length > 0
          ? playlist.images[playlist.images.length - 1]
          : null;
        return `![${playlist.name}${sizeStr}](${img?.url ?? ""})`;
      },
    )
    .replace(
      /{{ playlist_cover_url }}|{{playlist_cover_url}}/g,
      playlist.images[0]?.url ?? "",
    )
    .replace(
      /{{ playlist_owner }}|{{playlist_owner}}/g,
      playlist.owner.display_name,
    )
    .replace(
      /{{ playlist_public }}|{{playlist_public}}/g,
      String(playlist.public),
    )
    .replace(
      /{{ playlist_collaborative }}|{{playlist_collaborative}}/g,
      String(playlist.collaborative),
    );
}

// ---------------------------------------------------------------------------
// processAllPlaylists (mirrors src/output.ts)
// ---------------------------------------------------------------------------

function processAllPlaylists(playlists, template, options = {}) {
  if (!playlists || playlists.length === 0) {
    return "No playlists found.";
  }
  return playlists
    .map((playlist) => getPlaylistMessage(playlist, template, options))
    .join("\n");
}

// ---------------------------------------------------------------------------
// Opt-out logic (mirrors src/output.ts — processCurrentlyPlayingTrack)
// ---------------------------------------------------------------------------

function shouldFetchPlaylists(template, options = {}) {
  const playlistsEnabled = options.enablePlaylists !== false;
  return playlistsEnabled && /\{\{?\s*playlists\s*\}?\}/i.test(template);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLAYLIST_1 = {
  id: "pl1",
  name: "My Favorites",
  description: "All the songs I love",
  external_urls: { spotify: "https://open.spotify.com/playlist/pl1" },
  images: [
    { url: "https://mosaic.scdn.co/pl1-large", height: 640, width: 640 },
    { url: "https://mosaic.scdn.co/pl1-medium", height: 300, width: 300 },
    { url: "https://mosaic.scdn.co/pl1-small", height: 60, width: 60 },
  ],
  owner: { id: "user123", display_name: "TestUser" },
  public: true,
  collaborative: false,
  tracks: { total: 142 },
};

const PLAYLIST_2 = {
  id: "pl2",
  name: "Workout Mix",
  description: "High energy tracks for the gym",
  external_urls: { spotify: "https://open.spotify.com/playlist/pl2" },
  images: [
    { url: "https://mosaic.scdn.co/pl2-large", height: 640, width: 640 },
    { url: "https://mosaic.scdn.co/pl2-small", height: 60, width: 60 },
  ],
  owner: { id: "user123", display_name: "TestUser" },
  public: false,
  collaborative: true,
  tracks: { total: 57 },
};

const PLAYLIST_EMPTY_DESC = {
  id: "pl3",
  name: "No Description",
  description: "",
  external_urls: { spotify: "https://open.spotify.com/playlist/pl3" },
  images: [
    { url: "https://mosaic.scdn.co/pl3-large", height: 640, width: 640 },
  ],
  owner: { id: "user456", display_name: "OtherUser" },
  public: true,
  collaborative: false,
  tracks: { total: 0 },
};

const PLAYLIST_NO_IMAGES = {
  id: "pl4",
  name: "Brand New",
  description: "Just created",
  external_urls: { spotify: "https://open.spotify.com/playlist/pl4" },
  images: [],
  owner: { id: "user123", display_name: "TestUser" },
  public: false,
  collaborative: false,
  tracks: { total: 0 },
};

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
  if (actual === expected) {
    console.log(`  \u2713 ${description}`);
    passed++;
  } else {
    console.error(`  \u2717 ${description}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertNoRemainingTokens(description, result) {
  const remaining = result.match(/\{\{.*?\}\}/g);
  if (remaining) {
    console.error(`  \u2717 ${description} — unreplaced tokens: ${remaining.join(", ")}`);
    failed++;
  } else {
    console.log(`  \u2713 ${description}`);
    passed++;
  }
}

function assertBothVariants(tokenName, spacedToken, noSpaceToken, expected, playlist, options) {
  const spacedResult = getPlaylistMessage(playlist || PLAYLIST_1, spacedToken, options);
  const noSpaceResult = getPlaylistMessage(playlist || PLAYLIST_1, noSpaceToken, options);
  assert(`{{ ${tokenName} }} = expected value`, spacedResult, expected);
  assertNoRemainingTokens(`{{ ${tokenName} }} no leftover`, spacedResult);
  assert(`{{${tokenName}}} = expected value`, noSpaceResult, expected);
  assertNoRemainingTokens(`{{${tokenName}}} no leftover`, noSpaceResult);
}

// ===========================================================================
// 1. Individual token replacement — spaced vs no-space
// ===========================================================================

console.log("\n--- playlist_name ---");
assertBothVariants("playlist_name", "{{ playlist_name }}", "{{playlist_name}}", "My Favorites");

console.log("\n--- playlist_link ---");
assertBothVariants(
  "playlist_link",
  "{{ playlist_link }}",
  "{{playlist_link}}",
  "[My Favorites](https://open.spotify.com/playlist/pl1)",
);

console.log("\n--- playlist_url ---");
assertBothVariants(
  "playlist_url",
  "{{ playlist_url }}",
  "{{playlist_url}}",
  "https://open.spotify.com/playlist/pl1",
);

console.log("\n--- playlist_description ---");
assertBothVariants(
  "playlist_description",
  "{{ playlist_description }}",
  "{{playlist_description}}",
  "All the songs I love",
);

console.log("\n--- playlist_track_count ---");
assertBothVariants(
  "playlist_track_count",
  "{{ playlist_track_count }}",
  "{{playlist_track_count}}",
  "142",
);

console.log("\n--- playlist_cover_large ---");
assertBothVariants(
  "playlist_cover_large",
  "{{ playlist_cover_large }}",
  "{{playlist_cover_large}}",
  "![My Favorites](https://mosaic.scdn.co/pl1-large)",
);

console.log("\n--- playlist_cover_small ---");
assertBothVariants(
  "playlist_cover_small",
  "{{ playlist_cover_small }}",
  "{{playlist_cover_small}}",
  "![My Favorites](https://mosaic.scdn.co/pl1-small)",
);

console.log("\n--- playlist_cover_url ---");
assertBothVariants(
  "playlist_cover_url",
  "{{ playlist_cover_url }}",
  "{{playlist_cover_url}}",
  "https://mosaic.scdn.co/pl1-large",
);

console.log("\n--- playlist_owner ---");
assertBothVariants(
  "playlist_owner",
  "{{ playlist_owner }}",
  "{{playlist_owner}}",
  "TestUser",
);

console.log("\n--- playlist_public ---");
assertBothVariants(
  "playlist_public",
  "{{ playlist_public }}",
  "{{playlist_public}}",
  "true",
);

console.log("\n--- playlist_collaborative ---");
assertBothVariants(
  "playlist_collaborative",
  "{{ playlist_collaborative }}",
  "{{playlist_collaborative}}",
  "false",
);

// ===========================================================================
// 2. Playlist 2 — different values (private, collaborative)
// ===========================================================================

console.log("\n--- Playlist 2 — different values ---");

assertBothVariants(
  "playlist_name (pl2)",
  "{{ playlist_name }}",
  "{{playlist_name}}",
  "Workout Mix",
  PLAYLIST_2,
);

assertBothVariants(
  "playlist_public (pl2 = false)",
  "{{ playlist_public }}",
  "{{playlist_public}}",
  "false",
  PLAYLIST_2,
);

assertBothVariants(
  "playlist_collaborative (pl2 = true)",
  "{{ playlist_collaborative }}",
  "{{playlist_collaborative}}",
  "true",
  PLAYLIST_2,
);

assertBothVariants(
  "playlist_track_count (pl2 = 57)",
  "{{ playlist_track_count }}",
  "{{playlist_track_count}}",
  "57",
  PLAYLIST_2,
);

// playlist_cover_small for playlist with 2 images should be the last one
assertBothVariants(
  "playlist_cover_small (pl2 — last image)",
  "{{ playlist_cover_small }}",
  "{{playlist_cover_small}}",
  "![Workout Mix](https://mosaic.scdn.co/pl2-small)",
  PLAYLIST_2,
);

// ===========================================================================
// 3. Image size overrides
// ===========================================================================

console.log("\n--- Image size — inline override ---");

assertBothVariants(
  "playlist_cover_large|200x200",
  "{{ playlist_cover_large|200x200 }}",
  "{{playlist_cover_large|200x200}}",
  "![My Favorites|200x200](https://mosaic.scdn.co/pl1-large)",
);

assertBothVariants(
  "playlist_cover_small|64",
  "{{ playlist_cover_small|64 }}",
  "{{playlist_cover_small|64}}",
  "![My Favorites|64](https://mosaic.scdn.co/pl1-small)",
);

console.log("\n--- Image size — default setting ---");

assertBothVariants(
  "playlist_cover_large (default 150x150)",
  "{{ playlist_cover_large }}",
  "{{playlist_cover_large}}",
  "![My Favorites|150x150](https://mosaic.scdn.co/pl1-large)",
  PLAYLIST_1,
  { defaultImageSize: "150x150" },
);

console.log("\n--- Image size — inline overrides default ---");

assertBothVariants(
  "playlist_cover_large|50 (default 200x200)",
  "{{ playlist_cover_large|50 }}",
  "{{playlist_cover_large|50}}",
  "![My Favorites|50](https://mosaic.scdn.co/pl1-large)",
  PLAYLIST_1,
  { defaultImageSize: "200x200" },
);

console.log("\n--- Image size — escaped pipe (table context) ---");

assert(
  "{{ playlist_cover_large\\|100x100 }} escaped pipe",
  getPlaylistMessage(PLAYLIST_1, "{{ playlist_cover_large\\|100x100 }}"),
  "![My Favorites\\|100x100](https://mosaic.scdn.co/pl1-large)",
);
assert(
  "{{playlist_cover_large\\|100x100}} escaped pipe (no-space)",
  getPlaylistMessage(PLAYLIST_1, "{{playlist_cover_large\\|100x100}}"),
  "![My Favorites\\|100x100](https://mosaic.scdn.co/pl1-large)",
);
assert(
  "{{ playlist_cover_small\\|64 }} escaped pipe",
  getPlaylistMessage(PLAYLIST_1, "{{ playlist_cover_small\\|64 }}"),
  "![My Favorites\\|64](https://mosaic.scdn.co/pl1-small)",
);

// ===========================================================================
// 4. Edge cases
// ===========================================================================

console.log("\n--- Edge: empty description ---");

assertBothVariants(
  "playlist_description (empty)",
  "{{ playlist_description }}",
  "{{playlist_description}}",
  "",
  PLAYLIST_EMPTY_DESC,
);

console.log("\n--- Edge: zero tracks ---");

assertBothVariants(
  "playlist_track_count (0)",
  "{{ playlist_track_count }}",
  "{{playlist_track_count}}",
  "0",
  PLAYLIST_EMPTY_DESC,
);

console.log("\n--- Edge: no images ---");

assert(
  "playlist_cover_large with no images returns empty URL",
  getPlaylistMessage(PLAYLIST_NO_IMAGES, "{{ playlist_cover_large }}"),
  "![Brand New]()",
);

assert(
  "playlist_cover_small with no images returns empty URL",
  getPlaylistMessage(PLAYLIST_NO_IMAGES, "{{ playlist_cover_small }}"),
  "![Brand New]()",
);

assert(
  "playlist_cover_url with no images returns empty string",
  getPlaylistMessage(PLAYLIST_NO_IMAGES, "{{ playlist_cover_url }}"),
  "",
);

// ===========================================================================
// 5. Full template — all tokens, no remaining {{ }}
// ===========================================================================

console.log("\n--- Full template (spaced) — all tokens replaced ---");

const FULL_SPACED = [
  "Name: {{ playlist_name }}",
  "Link: {{ playlist_link }}",
  "URL: {{ playlist_url }}",
  "Description: {{ playlist_description }}",
  "Tracks: {{ playlist_track_count }}",
  "Cover Large: {{ playlist_cover_large }}",
  "Cover Small: {{ playlist_cover_small }}",
  "Cover URL: {{ playlist_cover_url }}",
  "Owner: {{ playlist_owner }}",
  "Public: {{ playlist_public }}",
  "Collaborative: {{ playlist_collaborative }}",
].join("\n");

const fullSpacedResult = getPlaylistMessage(PLAYLIST_1, FULL_SPACED);
assertNoRemainingTokens("full template (spaced) — all tokens replaced", fullSpacedResult);

assert(
  "full template contains playlist name",
  fullSpacedResult.includes("Name: My Favorites"),
  true,
);
assert(
  "full template contains spotify URL (not API URL)",
  fullSpacedResult.includes("https://open.spotify.com/playlist/pl1"),
  true,
);
assert(
  "full template does NOT contain api.spotify.com",
  fullSpacedResult.includes("api.spotify.com"),
  false,
);
assert(
  "full template contains track count",
  fullSpacedResult.includes("Tracks: 142"),
  true,
);
assert(
  "full template contains description",
  fullSpacedResult.includes("Description: All the songs I love"),
  true,
);
assert(
  "full template contains owner",
  fullSpacedResult.includes("Owner: TestUser"),
  true,
);

console.log("\n--- Full template (no-space) — all tokens replaced ---");

const FULL_NOSPACE = [
  "Name: {{playlist_name}}",
  "Link: {{playlist_link}}",
  "URL: {{playlist_url}}",
  "Description: {{playlist_description}}",
  "Tracks: {{playlist_track_count}}",
  "Cover Large: {{playlist_cover_large}}",
  "Cover Small: {{playlist_cover_small}}",
  "Cover URL: {{playlist_cover_url}}",
  "Owner: {{playlist_owner}}",
  "Public: {{playlist_public}}",
  "Collaborative: {{playlist_collaborative}}",
].join("\n");

const fullNoSpaceResult = getPlaylistMessage(PLAYLIST_1, FULL_NOSPACE);
assertNoRemainingTokens("full template (no-space) — all tokens replaced", fullNoSpaceResult);

assert(
  "spaced and no-space full templates produce identical output",
  fullSpacedResult,
  fullNoSpaceResult,
);

// ===========================================================================
// 6. processAllPlaylists — multi-playlist output
// ===========================================================================

console.log("\n--- processAllPlaylists — multiple playlists ---");

{
  const template = "{{ playlist_name }} ({{ playlist_track_count }} tracks)";
  const result = processAllPlaylists([PLAYLIST_1, PLAYLIST_2], template);
  assert(
    "two playlists joined by newline",
    result,
    "My Favorites (142 tracks)\nWorkout Mix (57 tracks)",
  );
}

{
  const template = "- {{ playlist_link }} — {{ playlist_description }}";
  const result = processAllPlaylists([PLAYLIST_1, PLAYLIST_2, PLAYLIST_EMPTY_DESC], template);
  const lines = result.split("\n");
  assert("three playlists produce three lines", lines.length, 3);
  assert(
    "first line correct",
    lines[0],
    "- [My Favorites](https://open.spotify.com/playlist/pl1) — All the songs I love",
  );
  assert(
    "second line correct",
    lines[1],
    "- [Workout Mix](https://open.spotify.com/playlist/pl2) — High energy tracks for the gym",
  );
  assert(
    "third line with empty description",
    lines[2],
    "- [No Description](https://open.spotify.com/playlist/pl3) — ",
  );
}

console.log("\n--- processAllPlaylists — empty list ---");

assert(
  "empty playlist array returns fallback message",
  processAllPlaylists([], "{{ playlist_name }}"),
  "No playlists found.",
);

assert(
  "null playlists returns fallback message",
  processAllPlaylists(null, "{{ playlist_name }}"),
  "No playlists found.",
);

console.log("\n--- processAllPlaylists — single playlist ---");

{
  const result = processAllPlaylists([PLAYLIST_1], "{{ playlist_name }}: {{ playlist_track_count }}");
  assert(
    "single playlist output",
    result,
    "My Favorites: 142",
  );
}

// ===========================================================================
// 7. processAllPlaylists — with options (image size)
// ===========================================================================

console.log("\n--- processAllPlaylists — with default image size ---");

{
  const template = "{{ playlist_cover_large }}";
  const result = processAllPlaylists([PLAYLIST_1], template, { defaultImageSize: "100x100" });
  assert(
    "default image size applied in processAllPlaylists",
    result,
    "![My Favorites|100x100](https://mosaic.scdn.co/pl1-large)",
  );
}

// ===========================================================================
// 8. Opt-out logic (enablePlaylists)
// ===========================================================================

console.log("\n--- Opt-out: enablePlaylists ---");

// When enablePlaylists is true (or unset), {{ playlists }} should trigger fetch
assert(
  "enablePlaylists=true + playlists token → should fetch",
  shouldFetchPlaylists("{{ playlists }}", { enablePlaylists: true }),
  true,
);

assert(
  "enablePlaylists unset + playlists token → should fetch (default)",
  shouldFetchPlaylists("{{ playlists }}", {}),
  true,
);

assert(
  "enablePlaylists=true + no playlists token → should not fetch",
  shouldFetchPlaylists("{{ song_name }}", { enablePlaylists: true }),
  false,
);

// When enablePlaylists is false, never fetch
assert(
  "enablePlaylists=false + playlists token → should NOT fetch",
  shouldFetchPlaylists("{{ playlists }}", { enablePlaylists: false }),
  false,
);

assert(
  "enablePlaylists=false + {{playlists}} (no-space) → should NOT fetch",
  shouldFetchPlaylists("{{playlists}}", { enablePlaylists: false }),
  false,
);

assert(
  "enablePlaylists=false + mixed template with playlists → should NOT fetch",
  shouldFetchPlaylists("{{ song_name }} {{ playlists }}", { enablePlaylists: false }),
  false,
);

// ===========================================================================
// 9. Multiple occurrences of same token
// ===========================================================================

console.log("\n--- Multiple occurrences of same token ---");

assert(
  "playlist_name appears twice",
  getPlaylistMessage(PLAYLIST_1, "{{ playlist_name }} / {{ playlist_name }}"),
  "My Favorites / My Favorites",
);

assert(
  "playlist_track_count appears twice",
  getPlaylistMessage(PLAYLIST_1, "{{ playlist_track_count }} songs ({{ playlist_track_count }})"),
  "142 songs (142)",
);

// ===========================================================================
// 10. Default template (from default.ts)
// ===========================================================================

console.log("\n--- Default template from settings ---");

{
  const DEFAULT_TEMPLATE = "**{{ playlist_name }}**\n{{ playlist_link }}\nTracks: {{ playlist_track_count }}\n{{ playlist_description }}\n\n---";
  const result = processAllPlaylists([PLAYLIST_1, PLAYLIST_2], DEFAULT_TEMPLATE);
  const lines = result.split("\n");

  assert(
    "default template first line is bold name",
    lines[0],
    "**My Favorites**",
  );
  assert(
    "default template second line is link",
    lines[1],
    "[My Favorites](https://open.spotify.com/playlist/pl1)",
  );
  assert(
    "default template third line is track count",
    lines[2],
    "Tracks: 142",
  );
  assert(
    "default template fourth line is description",
    lines[3],
    "All the songs I love",
  );
  assertNoRemainingTokens("default template — no leftover tokens", result);
}

// ===========================================================================
// 11. Mixed token template — no regex collisions
// ===========================================================================

console.log("\n--- No regex collisions between similar tokens ---");

{
  const template = "Name: {{ playlist_name }}\nURL: {{ playlist_url }}\nLink: {{ playlist_link }}\nCover URL: {{ playlist_cover_url }}";
  const result = getPlaylistMessage(PLAYLIST_1, template);

  assert(
    "playlist_name not clobbered by playlist_link",
    result.includes("Name: My Favorites\n"),
    true,
  );
  assert(
    "playlist_url not clobbered by playlist_link",
    result.includes("URL: https://open.spotify.com/playlist/pl1\n"),
    true,
  );
  assert(
    "playlist_cover_url present and correct",
    result.includes("Cover URL: https://mosaic.scdn.co/pl1-large"),
    true,
  );
  assertNoRemainingTokens("mixed template — no leftovers", result);
}

// ===========================================================================
// 12. Latency — template processing benchmark
// ===========================================================================

console.log("\n--- Latency benchmark ---");

const BENCH_TEMPLATE = [
  "{{ playlist_name }}",
  "{{ playlist_link }}",
  "{{ playlist_url }}",
  "{{ playlist_description }}",
  "{{ playlist_track_count }}",
  "{{ playlist_cover_large }}",
  "{{ playlist_cover_small }}",
  "{{ playlist_cover_url }}",
  "{{ playlist_owner }}",
  "{{ playlist_public }}",
  "{{ playlist_collaborative }}",
].join("\n");

const ITERATIONS = 10000;

// Warm up
for (let i = 0; i < 100; i++) {
  getPlaylistMessage(PLAYLIST_1, BENCH_TEMPLATE);
}

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  getPlaylistMessage(PLAYLIST_1, BENCH_TEMPLATE);
}
const duration = performance.now() - start;
const avg = (duration / ITERATIONS).toFixed(4);

console.log(`  ${ITERATIONS} iterations: ${duration.toFixed(1)}ms total, ${avg}ms/call`);
assert(
  `average per-call time < 1ms (got ${avg}ms)`,
  parseFloat(avg) < 1,
  true,
);

// Multi-playlist benchmark
const manyPlaylists = Array.from({ length: 50 }, (_, i) => ({
  ...PLAYLIST_1,
  id: `pl_${i}`,
  name: `Playlist ${i}`,
}));

const startMulti = performance.now();
for (let i = 0; i < 1000; i++) {
  processAllPlaylists(manyPlaylists, BENCH_TEMPLATE);
}
const durationMulti = performance.now() - startMulti;
const avgMulti = (durationMulti / 1000).toFixed(4);

console.log(`  1000 iterations x 50 playlists: ${durationMulti.toFixed(1)}ms total, ${avgMulti}ms/call`);
assert(
  `50-playlist processing < 10ms/call (got ${avgMulti}ms)`,
  parseFloat(avgMulti) < 10,
  true,
);

// ===========================================================================
// 13. Generated markdown output — visual inspection
// ===========================================================================

console.log("\n=== Generated Markdown Output ===\n");

const VISUAL_TEMPLATE = [
  "## {{ playlist_name }}",
  "",
  "{{ playlist_cover_large|200x200 }}",
  "",
  "- **Link:** {{ playlist_link }}",
  "- **Tracks:** {{ playlist_track_count }}",
  "- **Owner:** {{ playlist_owner }}",
  "- **Public:** {{ playlist_public }}",
  "- **Collaborative:** {{ playlist_collaborative }}",
  "",
  "> {{ playlist_description }}",
  "",
  "---",
].join("\n");

const visualResult = processAllPlaylists(
  [PLAYLIST_1, PLAYLIST_2, PLAYLIST_EMPTY_DESC, PLAYLIST_NO_IMAGES],
  VISUAL_TEMPLATE,
);
console.log(visualResult);
console.log("\n=== End Generated Markdown ===\n");

// ===========================================================================
// 14. processSinglePlaylist — single playlist output (used by individual files)
// ===========================================================================

console.log("\n--- processSinglePlaylist ---");

function processSinglePlaylist(playlist, template, options = {}) {
  return getPlaylistMessage(playlist, template, options);
}

{
  const template = "# {{ playlist_name }}\n{{ playlist_link }}\nTracks: {{ playlist_track_count }}";
  const result = processSinglePlaylist(PLAYLIST_1, template);
  assert(
    "processSinglePlaylist produces correct output",
    result,
    "# My Favorites\n[My Favorites](https://open.spotify.com/playlist/pl1)\nTracks: 142",
  );
  assertNoRemainingTokens("processSinglePlaylist — no leftovers", result);
}

{
  const result = processSinglePlaylist(PLAYLIST_2, "{{ playlist_name }}");
  assert("processSinglePlaylist for playlist 2", result, "Workout Mix");
}

{
  const result = processSinglePlaylist(PLAYLIST_NO_IMAGES, "{{ playlist_cover_url }}");
  assert("processSinglePlaylist handles missing images", result, "");
}

// ===========================================================================
// 15. Filename sanitization (mirrors main.ts logic)
// ===========================================================================

console.log("\n--- Filename sanitization ---");

function sanitizePlaylistName(name) {
  return name.replace(/[/\\:#[\]|^%.]/g, "-");
}

const sanitizeCases = [
  ["My Favorites", "My Favorites"],
  ["Rock/Pop Mix", "Rock-Pop Mix"],
  ["Playlist: Best Of", "Playlist- Best Of"],
  ["Artist #1 Hits", "Artist -1 Hits"],
  ["100% Energy", "100- Energy"],
  ["[Chill] Vibes", "-Chill- Vibes"],
  ["Back\\Slash", "Back-Slash"],
  ["Pipe|Test", "Pipe-Test"],
  ["Dot.Name", "Dot-Name"],
  ["Normal Name 123", "Normal Name 123"],
];

for (const [input, expected] of sanitizeCases) {
  assert(
    `sanitize "${input}" → "${expected}"`,
    sanitizePlaylistName(input),
    expected,
  );
}

// ===========================================================================
// 16. Auto-regenerate guard logic
// ===========================================================================

console.log("\n--- Auto-regenerate guard logic ---");

function shouldRegenerate(settings) {
  return settings.autoRegeneratePlaylists === true && settings.enablePlaylists !== false;
}

assert(
  "autoRegenerate=true, enablePlaylists=true → should regenerate",
  shouldRegenerate({ autoRegeneratePlaylists: true, enablePlaylists: true }),
  true,
);

assert(
  "autoRegenerate=false, enablePlaylists=true → should NOT regenerate",
  shouldRegenerate({ autoRegeneratePlaylists: false, enablePlaylists: true }),
  false,
);

assert(
  "autoRegenerate=true, enablePlaylists=false → should NOT regenerate",
  shouldRegenerate({ autoRegeneratePlaylists: true, enablePlaylists: false }),
  false,
);

assert(
  "autoRegenerate=false, enablePlaylists=false → should NOT regenerate",
  shouldRegenerate({ autoRegeneratePlaylists: false, enablePlaylists: false }),
  false,
);

// ===========================================================================
// 17. Cache reuse simulation
// ===========================================================================

console.log("\n--- Cache reuse logic ---");

{
  // Simulates the caching: if cachedPlaylistNames has entries, use them; otherwise fetch
  function resolvePlaylistNames(cachedNames, fetchFn) {
    return cachedNames && cachedNames.length > 0 ? cachedNames : fetchFn();
  }

  let fetchCalled = false;
  const mockFetch = () => { fetchCalled = true; return ["Fetched Playlist"]; };

  // With cache — should not fetch
  fetchCalled = false;
  const cached = resolvePlaylistNames(["Cached A", "Cached B"], mockFetch);
  assert("cache hit returns cached names", cached.join(", "), "Cached A, Cached B");
  assert("cache hit does not call fetch", fetchCalled, false);

  // Without cache — should fetch
  fetchCalled = false;
  const fetched = resolvePlaylistNames([], mockFetch);
  assert("cache miss calls fetch", fetchCalled, true);
  assert("cache miss returns fetched names", fetched.join(", "), "Fetched Playlist");

  // Undefined cache — should fetch
  fetchCalled = false;
  const undef = resolvePlaylistNames(undefined, mockFetch);
  assert("undefined cache calls fetch", fetchCalled, true);
  assert("undefined cache returns fetched names", undef.join(", "), "Fetched Playlist");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  if (typeof Deno !== "undefined") Deno.exit(1);
  else process.exit(1);
}
