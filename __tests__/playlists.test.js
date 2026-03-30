/**
 * Tests for the {{ playlists }} template token.
 *
 * Covers:
 *   1. Token replacement (spaced / no-space variants)
 *   2. Template detection regex (only fetch when token is present)
 *   3. getPlaylistsForTrack logic (owned-only filter, early exit, pagination)
 *   4. Latency comparison — template processing with vs without playlists
 *
 * Run with: deno run __tests__/playlists.test.js
 */

// ---------------------------------------------------------------------------
// Helpers (mirrors src/utils.ts)
// ---------------------------------------------------------------------------

function formatSpotifyDate(date, format) {
  if (!date || !format) return date;
  const parts = date.split("-");
  const year = parts[0] ?? "";
  const month = parts[1] ?? "";
  const day = parts[2] ?? "";
  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day);
}

// ---------------------------------------------------------------------------
// Template processor (mirrors getTrackMessage in track.ts — with playlists)
// ---------------------------------------------------------------------------

function processTemplate(template, track, artists, playlistNames = [], options = {}) {
  const defaultImageSize = options.defaultImageSize ?? "";
  const defaultReleaseDateFormat = options.defaultReleaseDateFormat ?? "";

  return template
    .replace(/{{ song_name }}|{{song_name}}/g, track.name)
    .replace(
      /{{ song_link }}|{{song_link}}/g,
      `[${track.name} - ${track.artists.map((a) => a.name).join(", ")}](${track.external_urls.spotify})`,
    )
    .replace(
      /{{ artists }}|{{artists}}/g,
      track.artists.map((a) => a.name).join(", "),
    )
    .replace(
      /{{ artists_formatted(:.*?)?(:.*?)? }}|{{artists_formatted(:.*?)?(:.*?)?}}/g,
      (_match, ...opts) => {
        const matches = opts
          .slice(0, opts.length - 2)
          .filter((m) => m !== undefined);
        const prefix = matches[0]?.substring(1) || "";
        const suffix = matches[1]?.substring(1) || "";
        const isTag = prefix === "#";
        if (isTag) {
          return track.artists
            .map((a) => `${prefix}${a.name?.replace(/ /g, "_")}${suffix}`)
            .join("\n");
        }
        return track.artists.map((a) => `${prefix}${a.name}${suffix}`).join("\n");
      },
    )
    .replace(
      /{{ album_release(\\?\|[^\s}]*)? }}|{{album_release(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const fmtParam = p1 ?? p2;
        const fmt = fmtParam?.replace(/^\\?\|/, "") || defaultReleaseDateFormat;
        return formatSpotifyDate(track.album.release_date, fmt);
      },
    )
    .replace(
      /{{ album_cover_large(\\?\|[^\s}]*)? }}|{{album_cover_large(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, "") || defaultImageSize;
        const sep = sizeParam?.startsWith("\\|") ? "\\|" : "|";
        const sizeStr = size ? `${sep}${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[0]?.url})`;
      },
    )
    .replace(
      /{{ album_cover_medium(\\?\|[^\s}]*)? }}|{{album_cover_medium(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, "") || defaultImageSize;
        const sep = sizeParam?.startsWith("\\|") ? "\\|" : "|";
        const sizeStr = size ? `${sep}${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[1]?.url})`;
      },
    )
    .replace(
      /{{ album_cover_small(\\?\|[^\s}]*)? }}|{{album_cover_small(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, "") || defaultImageSize;
        const sep = sizeParam?.startsWith("\\|") ? "\\|" : "|";
        const sizeStr = size ? `${sep}${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[2]?.url})`;
      },
    )
    .replace(
      /{{ album_cover_link_large }}|{{album_cover_link_large}}/g,
      `[Cover - ${track.album.name}](${track.album.images[0]?.url})`,
    )
    .replace(
      /{{ album_cover_link_medium }}|{{album_cover_link_medium}}/g,
      `[Cover - ${track.album.name}](${track.album.images[1]?.url})`,
    )
    .replace(
      /{{ album_cover_link_small }}|{{album_cover_link_small}}/g,
      `[Cover - ${track.album.name}](${track.album.images[2]?.url})`,
    )
    .replace(
      /{{ album_link }}|{{album_link}}/g,
      `[${track.album.name}](${track.album.external_urls.spotify})`,
    )
    .replace(/{{ album }}|{{album}}/g, track.album.name)
    .replace(
      /{{ genres }}|{{genres}}/g,
      Array.from(new Set(artists?.map((artist) => artist.genres)))
        .flat(Infinity)
        .join(", "),
    )
    .replace(
      /{{ genres_array }}|{{genres_array}}/g,
      Array.from(
        new Set(
          artists?.map((artist) =>
            artist.genres?.map((g) => `"${g}"`)
          ),
        ),
      )
        .flat(Infinity)
        .join(", "),
    )
    .replace(
      /{{ genres_hashtag }}|{{genres_hashtag}}/g,
      Array.from(
        new Set(
          artists?.map((artist) =>
            artist.genres?.map((g) => `#${g.replace(/ /g, "_")}`)
          ),
        ),
      )
        .flat(Infinity)
        .join(" "),
    )
    .replace(
      /{{ followers }}|{{followers}}/g,
      artists.length > 1
        ? artists
            ?.map((artist) => `${artist.name}: ${artist.followers.total}`)
            .join(", ")
        : artists[0].followers.total.toString(),
    )
    .replace(
      /{{ popularity }}|{{popularity}}/g,
      artists.length > 1
        ? artists
            ?.map((artist) => `${artist.name}: ${artist.popularity}`)
            .join(", ")
        : artists[0].popularity.toString(),
    )
    .replace(
      /{{ artist_image_link }}|{{artist_image_link}}/g,
      artists
        ?.map((artist) => `[${artist.name}](${artist.images[0]?.url})`)
        .join(", "),
    )
    .replace(
      /{{ artist_image_url }}|{{artist_image_url}}/g,
      artists
        ?.map((artist) => `${artist.images[0]?.url}`)
        .join(", "),
    )
    .replace(
      /{{ artist_image(\\?\|[^\s}]*)? }}|{{artist_image(\\?\|[^\s}]*)?}}/g,
      (_match, p1, p2) => {
        const sizeParam = p1 ?? p2;
        const size = sizeParam?.replace(/^\\?\|/, "") || defaultImageSize;
        const sep = sizeParam?.startsWith("\\|") ? "\\|" : "|";
        const sizeStr = size ? `${sep}${size}` : "";
        return artists
          ?.map((artist) => `![${artist.name}${sizeStr}](${artist.images[0]?.url})`)
          .join(", ");
      },
    )
    .replace(
      /{{ artist_name }}|{{artist_name}}/g,
      artists?.map((a) => a.name).join(", ") ?? "",
    )
    .replace(
      /{{ album_cover_url_large }}|{{album_cover_url_large}}/g,
      `${track.album.images[0]?.url}`,
    )
    .replace(
      /{{ album_cover_url_medium }}|{{album_cover_url_medium}}/g,
      `${track.album.images[1]?.url}`,
    )
    .replace(
      /{{ album_cover_url_small }}|{{album_cover_url_small}}/g,
      `${track.album.images[2]?.url}`,
    )
    .replace(/{{ song_url }}|{{song_url}}/g, track.external_urls.spotify)
    .replace(/{{ album_url }}|{{album_url}}/g, track.album.external_urls.spotify)
    .replace(
      /{{ main_artist_url }}|{{main_artist_url}}/g,
      track.artists[0]?.external_urls?.spotify,
    )
    .replace(
      /{{ playlists }}|{{playlists}}/g,
      playlistNames.join(", "),
    );
}

// ---------------------------------------------------------------------------
// Mock: getPlaylistsForTrack logic (mirrors api.ts without HTTP)
// ---------------------------------------------------------------------------

/**
 * Simulates getPlaylistsForTrack with mock data.
 * Returns { matchingNames, stats } where stats tracks API efficiency.
 */
function mockGetPlaylistsForTrack(trackId, userId, allPlaylists, playlistItems) {
  const stats = {
    playlistPagesFetched: 0,
    itemPagesFetched: 0,
    playlistsSkippedNotOwned: 0,
    earlyExits: 0,
  };

  const matchingNames = [];

  // Step 1: Filter owned playlists (simulates paginated /me/playlists)
  const ownedPlaylists = [];
  const PAGE_SIZE_PLAYLISTS = 50;
  for (let i = 0; i < allPlaylists.length; i += PAGE_SIZE_PLAYLISTS) {
    stats.playlistPagesFetched++;
    const page = allPlaylists.slice(i, i + PAGE_SIZE_PLAYLISTS);
    for (const pl of page) {
      if (pl.owner.id === userId) {
        ownedPlaylists.push(pl);
      } else {
        stats.playlistsSkippedNotOwned++;
      }
    }
  }

  // Step 2: Search each owned playlist for the track (early exit per playlist)
  const PAGE_SIZE_ITEMS = 100;
  for (const playlist of ownedPlaylists) {
    const items = playlistItems[playlist.id] || [];
    let found = false;

    for (let i = 0; i < items.length; i += PAGE_SIZE_ITEMS) {
      stats.itemPagesFetched++;
      const page = items.slice(i, i + PAGE_SIZE_ITEMS);
      for (const item of page) {
        if (item.track?.id === trackId) {
          matchingNames.push(playlist.name);
          found = true;
          stats.earlyExits++;
          break;
        }
      }
      if (found) break;
    }
  }

  return { matchingNames, stats };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TRACK = {
  album: {
    album_type: "album",
    total_tracks: 12,
    available_markets: ["US", "CA"],
    external_urls: { spotify: "https://open.spotify.com/album/456" },
    href: "https://api.spotify.com/v1/albums/456",
    id: "456",
    images: [
      { url: "https://i.scdn.co/image/large", height: 640, width: 640 },
      { url: "https://i.scdn.co/image/medium", height: 300, width: 300 },
      { url: "https://i.scdn.co/image/small", height: 64, width: 64 },
    ],
    name: "Midnight Dreams",
    release_date: "2024-03-15",
    release_date_precision: "day",
    restrictions: { reason: "" },
    type: "album",
    uri: "spotify:album:456",
    artists: [
      {
        external_urls: { spotify: "https://open.spotify.com/artist/a1" },
        href: "https://api.spotify.com/v1/artists/a1",
        id: "a1",
        name: "Luna Wave",
        type: "artist",
        uri: "spotify:artist:a1",
      },
    ],
  },
  artists: [
    {
      external_urls: { spotify: "https://open.spotify.com/artist/a1" },
      followers: { href: null, total: 150000 },
      genres: ["indie pop", "dream pop"],
      href: "https://api.spotify.com/v1/artists/a1",
      id: "a1",
      images: [{ url: "https://i.scdn.co/image/artist1", height: 640, width: 640 }],
      name: "Luna Wave",
      popularity: 72,
      type: "artist",
      uri: "spotify:artist:a1",
    },
    {
      external_urls: { spotify: "https://open.spotify.com/artist/a2" },
      followers: { href: null, total: 50000 },
      genres: ["synth pop", "electro"],
      href: "https://api.spotify.com/v1/artists/a2",
      id: "a2",
      images: [{ url: "https://i.scdn.co/image/artist2", height: 640, width: 640 }],
      name: "Neon Drift",
      popularity: 58,
      type: "artist",
      uri: "spotify:artist:a2",
    },
  ],
  available_markets: ["US"],
  disc_number: "1",
  duration_ms: "245000",
  explicit: false,
  external_ids: { isrc: "USRC12345678", ean: "", upc: "" },
  external_urls: { spotify: "https://open.spotify.com/track/789" },
  href: "https://api.spotify.com/v1/tracks/789",
  id: "789",
  is_playable: true,
  linked_from: {},
  restrictions: { reason: "" },
  name: "Starlight Boulevard",
  popularity: 65,
  preview_url: "https://p.scdn.co/mp3-preview/789",
  track_number: 3,
  type: "track",
  uri: "spotify:track:789",
  is_local: false,
};

const ARTISTS = [
  {
    external_urls: { spotify: "https://open.spotify.com/artist/a1" },
    followers: { href: null, total: 150000 },
    genres: ["indie pop", "dream pop"],
    href: "https://api.spotify.com/v1/artists/a1",
    id: "a1",
    images: [{ url: "https://i.scdn.co/image/artist1", height: 640, width: 640 }],
    name: "Luna Wave",
    popularity: 72,
    type: "artist",
    uri: "spotify:artist:a1",
  },
  {
    external_urls: { spotify: "https://open.spotify.com/artist/a2" },
    followers: { href: null, total: 50000 },
    genres: ["synth pop", "electro"],
    href: "https://api.spotify.com/v1/artists/a2",
    id: "a2",
    images: [{ url: "https://i.scdn.co/image/artist2", height: 640, width: 640 }],
    name: "Neon Drift",
    popularity: 58,
    type: "artist",
    uri: "spotify:artist:a2",
  },
];

// Mock playlists data
const USER_ID = "user123";

const ALL_PLAYLISTS = [
  { id: "pl1", name: "My Favorites", owner: { id: USER_ID } },
  { id: "pl2", name: "Workout Mix", owner: { id: USER_ID } },
  { id: "pl3", name: "Chill Vibes", owner: { id: USER_ID } },
  { id: "pl4", name: "Friend's Playlist", owner: { id: "other_user" } },
  { id: "pl5", name: "Empty Playlist", owner: { id: USER_ID } },
  { id: "pl6", name: "Collab Playlist", owner: { id: "other_user2" } },
];

// Track 789 is in pl1 and pl3 only
const PLAYLIST_ITEMS = {
  pl1: [
    { track: { id: "111" } },
    { track: { id: "789" } },  // our track — found on page 1
    { track: { id: "222" } },
  ],
  pl2: [
    { track: { id: "333" } },
    { track: { id: "444" } },
    { track: { id: "555" } },
  ],
  pl3: [
    { track: { id: "666" } },
    { track: { id: "777" } },
    { track: { id: "789" } },  // our track
  ],
  pl4: [  // not owned — should be skipped entirely
    { track: { id: "789" } },
  ],
  pl5: [],  // empty
  pl6: [  // not owned
    { track: { id: "789" } },
  ],
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

function assertBothVariants(tokenName, spacedToken, noSpaceToken, expected, playlistNames = []) {
  const spacedResult = processTemplate(spacedToken, TRACK, ARTISTS, playlistNames);
  const noSpaceResult = processTemplate(noSpaceToken, TRACK, ARTISTS, playlistNames);
  assert(`{{ ${tokenName} }} = expected value`, spacedResult, expected);
  assertNoRemainingTokens(`{{ ${tokenName} }} no leftover`, spacedResult);
  assert(`{{${tokenName}}} = expected value`, noSpaceResult, expected);
  assertNoRemainingTokens(`{{${tokenName}}} no leftover`, noSpaceResult);
}

// ===========================================================================
// 1. Token replacement tests
// ===========================================================================

console.log("\n--- Playlists token — replacement ---");

assertBothVariants(
  "playlists (multiple)",
  "{{ playlists }}",
  "{{playlists}}",
  "My Favorites, Chill Vibes",
  ["My Favorites", "Chill Vibes"],
);

assertBothVariants(
  "playlists (single)",
  "{{ playlists }}",
  "{{playlists}}",
  "Workout Mix",
  ["Workout Mix"],
);

assertBothVariants(
  "playlists (empty)",
  "{{ playlists }}",
  "{{playlists}}",
  "",
  [],
);

console.log("\n--- Playlists token — in mixed template ---");

assert(
  "playlists mixed with other tokens (spaced)",
  processTemplate(
    "{{ song_name }} by {{ artists }} — playlists: {{ playlists }}",
    TRACK,
    ARTISTS,
    ["My Favorites", "Chill Vibes"],
  ),
  "Starlight Boulevard by Luna Wave, Neon Drift — playlists: My Favorites, Chill Vibes",
);

assert(
  "playlists mixed with other tokens (no-space)",
  processTemplate(
    "{{song_name}} by {{artists}} — playlists: {{playlists}}",
    TRACK,
    ARTISTS,
    ["My Favorites", "Chill Vibes"],
  ),
  "Starlight Boulevard by Luna Wave, Neon Drift — playlists: My Favorites, Chill Vibes",
);

console.log("\n--- Playlists token — no leftover in full template ---");

const FULL_WITH_PLAYLISTS = [
  "Song: {{ song_name }}",
  "Artists: {{ artists }}",
  "Album: {{ album }}",
  "Playlists: {{ playlists }}",
  "Genres: {{ genres }}",
].join("\n");

const fullResult = processTemplate(
  FULL_WITH_PLAYLISTS,
  TRACK,
  ARTISTS,
  ["My Favorites", "Workout Mix"],
);
assertNoRemainingTokens("full template with playlists — all tokens replaced", fullResult);
assert(
  "full template contains correct playlists line",
  fullResult.includes("Playlists: My Favorites, Workout Mix"),
  true,
);

// Multiple occurrences of {{ playlists }} in same template
assert(
  "multiple playlists tokens in same template",
  processTemplate(
    "In: {{ playlists }} | Also in: {{ playlists }}",
    TRACK,
    ARTISTS,
    ["A", "B"],
  ),
  "In: A, B | Also in: A, B",
);

// ===========================================================================
// 2. Template detection regex tests
// ===========================================================================

console.log("\n--- Template detection regex ---");

const NEEDS_PLAYLISTS_RE = /\{\{?\s*playlists\s*\}?\}/i;

const detectionCases = [
  // [template, shouldMatch, description]
  ["{{ playlists }}", true, "spaced"],
  ["{{playlists}}", true, "no-space"],
  ["{{ playlists}}", true, "left-space only"],
  ["{{playlists }}", true, "right-space only"],
  ["{{  playlists  }}", true, "extra spaces"],
  ["{{ song_name }}", false, "no playlists token"],
  ["{{ artists }}", false, "different token"],
  ["some text without tokens", false, "plain text"],
  ["{{ song_name }} and {{ playlists }}", true, "mixed template with playlists"],
  ["prefix {{playlists}} suffix", true, "embedded no-space"],
];

for (const [template, shouldMatch, desc] of detectionCases) {
  const matches = NEEDS_PLAYLISTS_RE.test(template);
  assert(`detection: "${desc}" → ${shouldMatch}`, matches, shouldMatch);
}

// ===========================================================================
// 3. getPlaylistsForTrack logic tests (mocked)
// ===========================================================================

console.log("\n--- getPlaylistsForTrack logic — owned-only filter ---");

{
  const { matchingNames, stats } = mockGetPlaylistsForTrack("789", USER_ID, ALL_PLAYLISTS, PLAYLIST_ITEMS);
  assert("finds track in correct playlists", matchingNames.join(", "), "My Favorites, Chill Vibes");
  assert("skips non-owned playlists", stats.playlistsSkippedNotOwned, 2);
}

console.log("\n--- getPlaylistsForTrack logic — early exit ---");

{
  // pl1 has 789 at index 1 — should exit after first page
  const { stats } = mockGetPlaylistsForTrack("789", USER_ID, ALL_PLAYLISTS, PLAYLIST_ITEMS);
  assert("early exits triggered for found playlists", stats.earlyExits, 2);
}

console.log("\n--- getPlaylistsForTrack logic — track not in any playlist ---");

{
  const { matchingNames, stats } = mockGetPlaylistsForTrack("999", USER_ID, ALL_PLAYLISTS, PLAYLIST_ITEMS);
  assert("returns empty when track not found", matchingNames.length, 0);
  assert("no early exits when not found", stats.earlyExits, 0);
}

console.log("\n--- getPlaylistsForTrack logic — pagination ---");

{
  // Create a large playlist (250 tracks) with the target at position 150
  const largeTracks = [];
  for (let i = 0; i < 250; i++) {
    largeTracks.push({ track: { id: i === 150 ? "789" : `other_${i}` } });
  }
  const largePlaylists = [{ id: "big", name: "Big Playlist", owner: { id: USER_ID } }];
  const largeItems = { big: largeTracks };

  const { matchingNames, stats } = mockGetPlaylistsForTrack("789", USER_ID, largePlaylists, largeItems);
  assert("finds track in large playlist", matchingNames.join(", "), "Big Playlist");
  // 250 items with page size 100: track at 150 → needs page 1 (0-99) + page 2 (100-199, found at 150)
  assert("fetches 2 item pages before finding track at position 150", stats.itemPagesFetched, 2);
  assert("early exit after finding", stats.earlyExits, 1);
}

console.log("\n--- getPlaylistsForTrack logic — null track items ---");

{
  // Spotify can return null tracks (e.g. deleted/unavailable tracks)
  const playlistsWithNulls = [{ id: "pn", name: "Has Nulls", owner: { id: USER_ID } }];
  const itemsWithNulls = {
    pn: [
      { track: null },
      { track: null },
      { track: { id: "789" } },
    ],
  };
  const { matchingNames } = mockGetPlaylistsForTrack("789", USER_ID, playlistsWithNulls, itemsWithNulls);
  assert("handles null track items gracefully", matchingNames.join(", "), "Has Nulls");
}

console.log("\n--- getPlaylistsForTrack logic — no playlists at all ---");

{
  const { matchingNames } = mockGetPlaylistsForTrack("789", USER_ID, [], {});
  assert("returns empty for user with no playlists", matchingNames.length, 0);
}

console.log("\n--- getPlaylistsForTrack logic — all playlists owned by others ---");

{
  const otherPlaylists = [
    { id: "x1", name: "Not Mine", owner: { id: "someone_else" } },
    { id: "x2", name: "Also Not Mine", owner: { id: "another_person" } },
  ];
  const otherItems = {
    x1: [{ track: { id: "789" } }],
    x2: [{ track: { id: "789" } }],
  };
  const { matchingNames, stats } = mockGetPlaylistsForTrack("789", USER_ID, otherPlaylists, otherItems);
  assert("returns empty when no owned playlists", matchingNames.length, 0);
  assert("no item pages fetched for non-owned playlists", stats.itemPagesFetched, 0);
  assert("all playlists skipped as not owned", stats.playlistsSkippedNotOwned, 2);
}

// ===========================================================================
// 4. Latency comparison — template processing with vs without playlists
// ===========================================================================

console.log("\n--- Latency comparison — template processing ---");

const TEMPLATE_WITHOUT_PLAYLISTS = [
  "Song: {{ song_name }}",
  "Link: {{ song_link }}",
  "Artists: {{ artists }}",
  "Album: {{ album }}",
  "Album Link: {{ album_link }}",
  "Release: {{ album_release }}",
  "Cover: {{ album_cover_medium }}",
  "Song URL: {{ song_url }}",
  "Genres: {{ genres }}",
  "Followers: {{ followers }}",
  "Popularity: {{ popularity }}",
].join("\n");

const TEMPLATE_WITH_PLAYLISTS = TEMPLATE_WITHOUT_PLAYLISTS + "\nPlaylists: {{ playlists }}";

const ITERATIONS = 10000;
const playlistNamesForBench = ["My Favorites", "Chill Vibes", "Workout Mix"];

// Warm up
for (let i = 0; i < 100; i++) {
  processTemplate(TEMPLATE_WITHOUT_PLAYLISTS, TRACK, ARTISTS, []);
  processTemplate(TEMPLATE_WITH_PLAYLISTS, TRACK, ARTISTS, playlistNamesForBench);
}

// Measure WITHOUT playlists
const startWithout = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  processTemplate(TEMPLATE_WITHOUT_PLAYLISTS, TRACK, ARTISTS, []);
}
const durationWithout = performance.now() - startWithout;

// Measure WITH playlists
const startWith = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  processTemplate(TEMPLATE_WITH_PLAYLISTS, TRACK, ARTISTS, playlistNamesForBench);
}
const durationWith = performance.now() - startWith;

const overhead = durationWith - durationWithout;
const overheadPercent = ((overhead / durationWithout) * 100).toFixed(1);
const avgWithout = (durationWithout / ITERATIONS).toFixed(4);
const avgWith = (durationWith / ITERATIONS).toFixed(4);

console.log(`  ${ITERATIONS} iterations each:`);
console.log(`    Without {{ playlists }}: ${durationWithout.toFixed(1)}ms total, ${avgWithout}ms/call`);
console.log(`    With {{ playlists }}:    ${durationWith.toFixed(1)}ms total, ${avgWith}ms/call`);
console.log(`    Overhead:               ${overhead.toFixed(1)}ms total (${overheadPercent}%)`);

// The token replacement itself should add negligible overhead (< 20%)
// The real cost is the API calls, which are not measured here (they're async/network)
assert(
  "playlists token replacement overhead < 20% of base template processing",
  parseFloat(overheadPercent) < 20,
  true,
);

// Also measure the regex detection (this decides whether API calls happen at all)
const DETECTION_ITERATIONS = 100000;

const startDetectNo = performance.now();
for (let i = 0; i < DETECTION_ITERATIONS; i++) {
  NEEDS_PLAYLISTS_RE.test(TEMPLATE_WITHOUT_PLAYLISTS);
}
const durationDetectNo = performance.now() - startDetectNo;

const startDetectYes = performance.now();
for (let i = 0; i < DETECTION_ITERATIONS; i++) {
  NEEDS_PLAYLISTS_RE.test(TEMPLATE_WITH_PLAYLISTS);
}
const durationDetectYes = performance.now() - startDetectYes;

console.log(`\n  Detection regex (${DETECTION_ITERATIONS} iterations):`);
console.log(`    Template without token: ${durationDetectNo.toFixed(1)}ms (${(durationDetectNo / DETECTION_ITERATIONS * 1000).toFixed(2)}µs/call)`);
console.log(`    Template with token:    ${durationDetectYes.toFixed(1)}ms (${(durationDetectYes / DETECTION_ITERATIONS * 1000).toFixed(2)}µs/call)`);
assert(
  "detection regex completes 100k iterations under 50ms",
  durationDetectNo < 50 && durationDetectYes < 50,
  true,
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  if (typeof Deno !== "undefined") Deno.exit(1);
  else process.exit(1);
}
