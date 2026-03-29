/**
 * Tests for template token parsing — spaced vs no-space variants.
 *
 * Verifies that {{ token }} and {{token}} both produce identical output
 * and that every token is actually replaced (no leftover {{ }}).
 *
 * Run with: deno run __tests__/template_tokens.test.js
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
// Template processor (mirrors getTrackMessage in track.ts)
// ---------------------------------------------------------------------------

function processTemplate(template, track, artists, options = {}) {
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
    );
}

// ---------------------------------------------------------------------------
// Fixtures — matching actual Spotify API / types.ts structure
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

// Artist[] — full artist objects fetched separately (used for genres, followers, etc.)
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

// Run template with both variants, check value + no leftover tokens
function assertBothVariants(tokenName, spacedToken, noSpaceToken, expected, options = {}) {
  const spacedResult = processTemplate(spacedToken, TRACK, ARTISTS, options);
  const noSpaceResult = processTemplate(noSpaceToken, TRACK, ARTISTS, options);
  assert(`{{ ${tokenName} }} = expected value`, spacedResult, expected);
  assertNoRemainingTokens(`{{ ${tokenName} }} no leftover`, spacedResult);
  assert(`{{${tokenName}}} = expected value`, noSpaceResult, expected);
  assertNoRemainingTokens(`{{${tokenName}}} no leftover`, noSpaceResult);
}

// ===========================================================================
// Tests
// ===========================================================================

// ---------------------------------------------------------------------------
// Simple tokens — spaced vs no-space
// ---------------------------------------------------------------------------

console.log("\nSimple tokens — spaced vs no-space");

assertBothVariants("song_name", "{{ song_name }}", "{{song_name}}", "Starlight Boulevard");

assertBothVariants(
  "song_link",
  "{{ song_link }}",
  "{{song_link}}",
  "[Starlight Boulevard - Luna Wave, Neon Drift](https://open.spotify.com/track/789)",
);

assertBothVariants("artists", "{{ artists }}", "{{artists}}", "Luna Wave, Neon Drift");

assertBothVariants("album", "{{ album }}", "{{album}}", "Midnight Dreams");

assertBothVariants(
  "album_link",
  "{{ album_link }}",
  "{{album_link}}",
  "[Midnight Dreams](https://open.spotify.com/album/456)",
);

assertBothVariants("song_url", "{{ song_url }}", "{{song_url}}", "https://open.spotify.com/track/789");

assertBothVariants("album_url", "{{ album_url }}", "{{album_url}}", "https://open.spotify.com/album/456");

assertBothVariants("main_artist_url", "{{ main_artist_url }}", "{{main_artist_url}}", "https://open.spotify.com/artist/a1");

assertBothVariants("artist_name", "{{ artist_name }}", "{{artist_name}}", "Luna Wave, Neon Drift");

// ---------------------------------------------------------------------------
// Album cover URLs
// ---------------------------------------------------------------------------

console.log("\nAlbum cover URLs — spaced vs no-space");

assertBothVariants("album_cover_url_large", "{{ album_cover_url_large }}", "{{album_cover_url_large}}", "https://i.scdn.co/image/large");
assertBothVariants("album_cover_url_medium", "{{ album_cover_url_medium }}", "{{album_cover_url_medium}}", "https://i.scdn.co/image/medium");
assertBothVariants("album_cover_url_small", "{{ album_cover_url_small }}", "{{album_cover_url_small}}", "https://i.scdn.co/image/small");

// ---------------------------------------------------------------------------
// Album cover images — no params
// ---------------------------------------------------------------------------

console.log("\nAlbum cover images — no params");

assertBothVariants(
  "album_cover_large",
  "{{ album_cover_large }}",
  "{{album_cover_large}}",
  "![Midnight Dreams](https://i.scdn.co/image/large)",
);
assertBothVariants(
  "album_cover_medium",
  "{{ album_cover_medium }}",
  "{{album_cover_medium}}",
  "![Midnight Dreams](https://i.scdn.co/image/medium)",
);
assertBothVariants(
  "album_cover_small",
  "{{ album_cover_small }}",
  "{{album_cover_small}}",
  "![Midnight Dreams](https://i.scdn.co/image/small)",
);

// ---------------------------------------------------------------------------
// Album cover images — inline size param
// ---------------------------------------------------------------------------

console.log("\nAlbum cover images — inline size param");

assertBothVariants(
  "album_cover_large|200x200",
  "{{ album_cover_large|200x200 }}",
  "{{album_cover_large|200x200}}",
  "![Midnight Dreams|200x200](https://i.scdn.co/image/large)",
);
assertBothVariants(
  "album_cover_medium|100x100",
  "{{ album_cover_medium|100x100 }}",
  "{{album_cover_medium|100x100}}",
  "![Midnight Dreams|100x100](https://i.scdn.co/image/medium)",
);
assertBothVariants(
  "album_cover_small|64",
  "{{ album_cover_small|64 }}",
  "{{album_cover_small|64}}",
  "![Midnight Dreams|64](https://i.scdn.co/image/small)",
);

// ---------------------------------------------------------------------------
// Album cover images — default size setting
// ---------------------------------------------------------------------------

console.log("\nAlbum cover images — default size setting");

assertBothVariants(
  "album_cover_medium (default 150x150)",
  "{{ album_cover_medium }}",
  "{{album_cover_medium}}",
  "![Midnight Dreams|150x150](https://i.scdn.co/image/medium)",
  { defaultImageSize: "150x150" },
);

// ---------------------------------------------------------------------------
// Album cover images — inline param overrides default
// ---------------------------------------------------------------------------

console.log("\nAlbum cover images — inline overrides default");

assertBothVariants(
  "album_cover_medium|50x50 (default 200x200)",
  "{{ album_cover_medium|50x50 }}",
  "{{album_cover_medium|50x50}}",
  "![Midnight Dreams|50x50](https://i.scdn.co/image/medium)",
  { defaultImageSize: "200x200" },
);

// ---------------------------------------------------------------------------
// Album cover links
// ---------------------------------------------------------------------------

console.log("\nAlbum cover links — spaced vs no-space");

assertBothVariants(
  "album_cover_link_large",
  "{{ album_cover_link_large }}",
  "{{album_cover_link_large}}",
  "[Cover - Midnight Dreams](https://i.scdn.co/image/large)",
);
assertBothVariants(
  "album_cover_link_medium",
  "{{ album_cover_link_medium }}",
  "{{album_cover_link_medium}}",
  "[Cover - Midnight Dreams](https://i.scdn.co/image/medium)",
);
assertBothVariants(
  "album_cover_link_small",
  "{{ album_cover_link_small }}",
  "{{album_cover_link_small}}",
  "[Cover - Midnight Dreams](https://i.scdn.co/image/small)",
);

// ---------------------------------------------------------------------------
// Album release date
// ---------------------------------------------------------------------------

console.log("\nAlbum release date — no format");

assertBothVariants("album_release", "{{ album_release }}", "{{album_release}}", "2024-03-15");

console.log("\nAlbum release date — inline format param");

assertBothVariants("album_release|YYYY", "{{ album_release|YYYY }}", "{{album_release|YYYY}}", "2024");
assertBothVariants("album_release|YYYY-MM", "{{ album_release|YYYY-MM }}", "{{album_release|YYYY-MM}}", "2024-03");
assertBothVariants("album_release|MM/DD/YYYY", "{{ album_release|MM/DD/YYYY }}", "{{album_release|MM/DD/YYYY}}", "03/15/2024");

console.log("\nAlbum release date — default format setting");

assertBothVariants(
  "album_release (default YYYY)",
  "{{ album_release }}",
  "{{album_release}}",
  "2024",
  { defaultReleaseDateFormat: "YYYY" },
);

console.log("\nAlbum release date — inline overrides default");

assertBothVariants(
  "album_release|YYYY (default YYYY-MM-DD)",
  "{{ album_release|YYYY }}",
  "{{album_release|YYYY}}",
  "2024",
  { defaultReleaseDateFormat: "YYYY-MM-DD" },
);

// ---------------------------------------------------------------------------
// Artist image
// ---------------------------------------------------------------------------

console.log("\nArtist image — no params");

assertBothVariants(
  "artist_image",
  "{{ artist_image }}",
  "{{artist_image}}",
  "![Luna Wave](https://i.scdn.co/image/artist1), ![Neon Drift](https://i.scdn.co/image/artist2)",
);

console.log("\nArtist image — inline size param");

assertBothVariants(
  "artist_image|100",
  "{{ artist_image|100 }}",
  "{{artist_image|100}}",
  "![Luna Wave|100](https://i.scdn.co/image/artist1), ![Neon Drift|100](https://i.scdn.co/image/artist2)",
);

console.log("\nArtist image — default size setting");

assertBothVariants(
  "artist_image (default 80x80)",
  "{{ artist_image }}",
  "{{artist_image}}",
  "![Luna Wave|80x80](https://i.scdn.co/image/artist1), ![Neon Drift|80x80](https://i.scdn.co/image/artist2)",
  { defaultImageSize: "80x80" },
);

console.log("\nArtist image — inline overrides default");

assertBothVariants(
  "artist_image|50 (default 200x200)",
  "{{ artist_image|50 }}",
  "{{artist_image|50}}",
  "![Luna Wave|50](https://i.scdn.co/image/artist1), ![Neon Drift|50](https://i.scdn.co/image/artist2)",
  { defaultImageSize: "200x200" },
);

// ---------------------------------------------------------------------------
// Genres, followers, popularity
// ---------------------------------------------------------------------------

console.log("\nGenres — spaced vs no-space");

assertBothVariants(
  "genres",
  "{{ genres }}",
  "{{genres}}",
  "indie pop, dream pop, synth pop, electro",
);

assertBothVariants(
  "genres_array",
  "{{ genres_array }}",
  "{{genres_array}}",
  '"indie pop", "dream pop", "synth pop", "electro"',
);

assertBothVariants(
  "genres_hashtag",
  "{{ genres_hashtag }}",
  "{{genres_hashtag}}",
  "#indie_pop #dream_pop #synth_pop #electro",
);

console.log("\nFollowers and popularity — spaced vs no-space");

assertBothVariants(
  "followers",
  "{{ followers }}",
  "{{followers}}",
  "Luna Wave: 150000, Neon Drift: 50000",
);

assertBothVariants(
  "popularity",
  "{{ popularity }}",
  "{{popularity}}",
  "Luna Wave: 72, Neon Drift: 58",
);

// ---------------------------------------------------------------------------
// Table context — escaped pipe \|
// ---------------------------------------------------------------------------

console.log("\nTable context — escaped pipe \\|");

assert(
  "{{ album_cover_medium\\|100x100 }} escaped pipe (spaced)",
  processTemplate("{{ album_cover_medium\\|100x100 }}", TRACK, ARTISTS),
  "![Midnight Dreams\\|100x100](https://i.scdn.co/image/medium)",
);
assert(
  "{{album_cover_medium\\|100x100}} escaped pipe (no-space)",
  processTemplate("{{album_cover_medium\\|100x100}}", TRACK, ARTISTS),
  "![Midnight Dreams\\|100x100](https://i.scdn.co/image/medium)",
);
assert(
  "{{ album_release\\|YYYY }} escaped pipe date (spaced)",
  processTemplate("{{ album_release\\|YYYY }}", TRACK, ARTISTS),
  "2024",
);
assert(
  "{{album_release\\|YYYY}} escaped pipe date (no-space)",
  processTemplate("{{album_release\\|YYYY}}", TRACK, ARTISTS),
  "2024",
);
assert(
  "{{ artist_image\\|64 }} escaped pipe (spaced)",
  processTemplate("{{ artist_image\\|64 }}", TRACK, ARTISTS),
  "![Luna Wave\\|64](https://i.scdn.co/image/artist1), ![Neon Drift\\|64](https://i.scdn.co/image/artist2)",
);
assert(
  "{{artist_image\\|64}} escaped pipe (no-space)",
  processTemplate("{{artist_image\\|64}}", TRACK, ARTISTS),
  "![Luna Wave\\|64](https://i.scdn.co/image/artist1), ![Neon Drift\\|64](https://i.scdn.co/image/artist2)",
);

// ---------------------------------------------------------------------------
// artists_formatted — spaced vs no-space
// ---------------------------------------------------------------------------

console.log("\nartists_formatted — spaced vs no-space");

assertBothVariants(
  "artists_formatted",
  "{{ artists_formatted }}",
  "{{artists_formatted}}",
  "Luna Wave\nNeon Drift",
);

assert(
  "{{ artists_formatted:  - [[:]] }} with prefix/suffix (spaced)",
  processTemplate("{{ artists_formatted:  - [[:]] }}", TRACK, ARTISTS),
  "  - [[Luna Wave]]\n  - [[Neon Drift]]",
);
assert(
  "{{artists_formatted:  - [[:]]}} with prefix/suffix (no-space)",
  processTemplate("{{artists_formatted:  - [[:]]}}",  TRACK, ARTISTS),
  "  - [[Luna Wave]]\n  - [[Neon Drift]]",
);

// ---------------------------------------------------------------------------
// Full template — ALL tokens, spaced — no {{ remaining
// ---------------------------------------------------------------------------

console.log("\nFull template (spaced) — no remaining {{ }}");

const FULL_SPACED = [
  "Song: {{ song_name }}",
  "Link: {{ song_link }}",
  "Artists: {{ artists }}",
  "Formatted: {{ artists_formatted }}",
  "Album: {{ album }}",
  "Album Link: {{ album_link }}",
  "Release: {{ album_release }}",
  "Cover L: {{ album_cover_large }}",
  "Cover M: {{ album_cover_medium }}",
  "Cover S: {{ album_cover_small }}",
  "Cover Link L: {{ album_cover_link_large }}",
  "Cover Link M: {{ album_cover_link_medium }}",
  "Cover Link S: {{ album_cover_link_small }}",
  "Cover URL L: {{ album_cover_url_large }}",
  "Cover URL M: {{ album_cover_url_medium }}",
  "Cover URL S: {{ album_cover_url_small }}",
  "Song URL: {{ song_url }}",
  "Album URL: {{ album_url }}",
  "Main Artist URL: {{ main_artist_url }}",
  "Genres: {{ genres }}",
  "Genres Array: {{ genres_array }}",
  "Genres Hashtag: {{ genres_hashtag }}",
  "Followers: {{ followers }}",
  "Popularity: {{ popularity }}",
  "Artist Image: {{ artist_image }}",
  "Artist Name: {{ artist_name }}",
].join("\n");

const fullSpacedResult = processTemplate(FULL_SPACED, TRACK, ARTISTS);
assertNoRemainingTokens("full template (spaced) — all tokens replaced", fullSpacedResult);

// Spot-check a few values in the full output
assert(
  "full template contains song name",
  fullSpacedResult.includes("Song: Starlight Boulevard"),
  true,
);
assert(
  "full template contains artist names",
  fullSpacedResult.includes("Artists: Luna Wave, Neon Drift"),
  true,
);
assert(
  "full template contains genres",
  fullSpacedResult.includes("Genres: indie pop, dream pop, synth pop, electro"),
  true,
);
assert(
  "full template contains followers",
  fullSpacedResult.includes("Followers: Luna Wave: 150000, Neon Drift: 50000"),
  true,
);

// ---------------------------------------------------------------------------
// Full template — ALL tokens, no-space — no {{ remaining
// ---------------------------------------------------------------------------

console.log("\nFull template (no-space) — no remaining {{ }}");

const FULL_NOSPACE = [
  "Song: {{song_name}}",
  "Link: {{song_link}}",
  "Artists: {{artists}}",
  "Formatted: {{artists_formatted}}",
  "Album: {{album}}",
  "Album Link: {{album_link}}",
  "Release: {{album_release}}",
  "Cover L: {{album_cover_large}}",
  "Cover M: {{album_cover_medium}}",
  "Cover S: {{album_cover_small}}",
  "Cover Link L: {{album_cover_link_large}}",
  "Cover Link M: {{album_cover_link_medium}}",
  "Cover Link S: {{album_cover_link_small}}",
  "Cover URL L: {{album_cover_url_large}}",
  "Cover URL M: {{album_cover_url_medium}}",
  "Cover URL S: {{album_cover_url_small}}",
  "Song URL: {{song_url}}",
  "Album URL: {{album_url}}",
  "Main Artist URL: {{main_artist_url}}",
  "Genres: {{genres}}",
  "Genres Array: {{genres_array}}",
  "Genres Hashtag: {{genres_hashtag}}",
  "Followers: {{followers}}",
  "Popularity: {{popularity}}",
  "Artist Image: {{artist_image}}",
  "Artist Name: {{artist_name}}",
].join("\n");

const fullNoSpaceResult = processTemplate(FULL_NOSPACE, TRACK, ARTISTS);
assertNoRemainingTokens("full template (no-space) — all tokens replaced", fullNoSpaceResult);

assert(
  "spaced and no-space full templates produce identical output",
  fullSpacedResult,
  fullNoSpaceResult,
);

// ---------------------------------------------------------------------------
// Multiple tokens in one template
// ---------------------------------------------------------------------------

console.log("\nMultiple tokens in one template");

assert(
  "mixed spaced and no-space tokens in same template",
  processTemplate(
    "{{song_name}} by {{ artists }} on {{album}} ({{ album_release|YYYY }})",
    TRACK,
    ARTISTS,
  ),
  "Starlight Boulevard by Luna Wave, Neon Drift on Midnight Dreams (2024)",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  if (typeof Deno !== "undefined") Deno.exit(1);
  else process.exit(1);
}
