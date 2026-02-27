/**
 * Tests for image dimension and date formatting features.
 *
 * Run with: node __tests__/image_date.test.js
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
// Minimal template processor (mirrors the relevant parts of track.ts)
// ---------------------------------------------------------------------------

function processTemplate(template, track, options = {}) {
  const defaultImageSize = options.defaultImageSize ?? "";
  const defaultReleaseDateFormat = options.defaultReleaseDateFormat ?? "";

  return template
    .replace(
      /{{ album_release(\|[^\s}]*)? }}|{{album_release}}/g,
      (_match, fmtParam) => {
        const fmt = fmtParam?.substring(1) || defaultReleaseDateFormat;
        return formatSpotifyDate(track.album.release_date, fmt);
      },
    )
    .replace(
      /{{ album_cover_large(\|[^\s}]*)? }}|{{album_cover_large}}/g,
      (_match, sizeParam) => {
        const size = sizeParam?.substring(1) || defaultImageSize;
        const sizeStr = size ? `|${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[0]?.url})`;
      },
    )
    .replace(
      /{{ album_cover_medium(\|[^\s}]*)? }}|{{album_cover_medium}}/g,
      (_match, sizeParam) => {
        const size = sizeParam?.substring(1) || defaultImageSize;
        const sizeStr = size ? `|${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[1]?.url})`;
      },
    )
    .replace(
      /{{ album_cover_small(\|[^\s}]*)? }}|{{album_cover_small}}/g,
      (_match, sizeParam) => {
        const size = sizeParam?.substring(1) || defaultImageSize;
        const sizeStr = size ? `|${size}` : "";
        return `![${track.album.name}${sizeStr}](${track.album.images[2]?.url})`;
      },
    );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TRACK = {
  album: {
    name: "Test Album",
    release_date: "2024-03-15",
    images: [
      { url: "https://example.com/large.jpg" },
      { url: "https://example.com/medium.jpg" },
      { url: "https://example.com/small.jpg" },
    ],
  },
};

const TRACK_YEAR_ONLY = {
  album: {
    ...TRACK.album,
    release_date: "2024",
  },
};

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ ${description}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// formatSpotifyDate tests
// ---------------------------------------------------------------------------

console.log("\nformatSpotifyDate");

assert(
  "empty format returns raw date (backward compatible)",
  formatSpotifyDate("2024-03-15", ""),
  "2024-03-15",
);
assert(
  "null/undefined format returns raw date",
  formatSpotifyDate("2024-03-15", undefined),
  "2024-03-15",
);
assert("YYYY extracts year", formatSpotifyDate("2024-03-15", "YYYY"), "2024");
assert(
  "YYYY-MM extracts year and month",
  formatSpotifyDate("2024-03-15", "YYYY-MM"),
  "2024-03",
);
assert(
  "MM/DD/YYYY US format",
  formatSpotifyDate("2024-03-15", "MM/DD/YYYY"),
  "03/15/2024",
);
assert(
  "YYYY-MM-DD preserves full date",
  formatSpotifyDate("2024-03-15", "YYYY-MM-DD"),
  "2024-03-15",
);
assert(
  "year-only Spotify date with YYYY format",
  formatSpotifyDate("2024", "YYYY"),
  "2024",
);
assert(
  "empty date returns empty string",
  formatSpotifyDate("", "YYYY"),
  "",
);

// ---------------------------------------------------------------------------
// Image token — no size (backward compatible)
// ---------------------------------------------------------------------------

console.log("\nImage tokens — no size (backward compatible)");

assert(
  "{{ album_cover_medium }} with no setting produces plain markdown image",
  processTemplate("{{ album_cover_medium }}", TRACK, {}),
  "![Test Album](https://example.com/medium.jpg)",
);
assert(
  "{{album_cover_medium}} (no spaces) with no setting",
  processTemplate("{{album_cover_medium}}", TRACK, {}),
  "![Test Album](https://example.com/medium.jpg)",
);

// ---------------------------------------------------------------------------
// Image token — global default setting
// ---------------------------------------------------------------------------

console.log("\nImage tokens — global default setting");

assert(
  "defaultImageSize 200x200 applied to album_cover_medium",
  processTemplate("{{ album_cover_medium }}", TRACK, { defaultImageSize: "200x200" }),
  "![Test Album|200x200](https://example.com/medium.jpg)",
);
assert(
  "defaultImageSize 300 (width only) applied to album_cover_large",
  processTemplate("{{ album_cover_large }}", TRACK, { defaultImageSize: "300" }),
  "![Test Album|300](https://example.com/large.jpg)",
);

// ---------------------------------------------------------------------------
// Image token — inline override
// ---------------------------------------------------------------------------

console.log("\nImage tokens — inline override");

assert(
  "{{ album_cover_medium|100x100 }} inline override",
  processTemplate("{{ album_cover_medium|100x100 }}", TRACK, {}),
  "![Test Album|100x100](https://example.com/medium.jpg)",
);
assert(
  "{{ album_cover_small|64 }} width-only inline override",
  processTemplate("{{ album_cover_small|64 }}", TRACK, {}),
  "![Test Album|64](https://example.com/small.jpg)",
);
assert(
  "inline override takes precedence over default setting",
  processTemplate("{{ album_cover_medium|50x50 }}", TRACK, { defaultImageSize: "200x200" }),
  "![Test Album|50x50](https://example.com/medium.jpg)",
);

// ---------------------------------------------------------------------------
// Date token — no format (backward compatible)
// ---------------------------------------------------------------------------

console.log("\nDate tokens — no format (backward compatible)");

assert(
  "{{ album_release }} with no setting returns raw Spotify date",
  processTemplate("{{ album_release }}", TRACK, {}),
  "2024-03-15",
);
assert(
  "{{album_release}} (no spaces) with no setting",
  processTemplate("{{album_release}}", TRACK, {}),
  "2024-03-15",
);

// ---------------------------------------------------------------------------
// Date token — global default setting
// ---------------------------------------------------------------------------

console.log("\nDate tokens — global default setting");

assert(
  "defaultReleaseDateFormat YYYY applied to album_release",
  processTemplate("{{ album_release }}", TRACK, { defaultReleaseDateFormat: "YYYY" }),
  "2024",
);
assert(
  "defaultReleaseDateFormat YYYY-MM applied to album_release",
  processTemplate("{{ album_release }}", TRACK, { defaultReleaseDateFormat: "YYYY-MM" }),
  "2024-03",
);

// ---------------------------------------------------------------------------
// Date token — inline override
// ---------------------------------------------------------------------------

console.log("\nDate tokens — inline override");

assert(
  "{{ album_release|YYYY }} inline override",
  processTemplate("{{ album_release|YYYY }}", TRACK, {}),
  "2024",
);
assert(
  "{{ album_release|MM/DD/YYYY }} inline US format",
  processTemplate("{{ album_release|MM/DD/YYYY }}", TRACK, {}),
  "03/15/2024",
);
assert(
  "inline format override takes precedence over default setting",
  processTemplate("{{ album_release|YYYY }}", TRACK, { defaultReleaseDateFormat: "YYYY-MM-DD" }),
  "2024",
);

// ---------------------------------------------------------------------------
// Mixed template
// ---------------------------------------------------------------------------

console.log("\nMixed template");

const mixedTemplate =
  "Cover: {{ album_cover_medium|100x100 }}\nYear: {{ album_release|YYYY }}\nRaw: {{ album_release }}";

assert(
  "mixed template with inline image size and date format",
  processTemplate(mixedTemplate, TRACK, { defaultReleaseDateFormat: "YYYY-MM" }),
  "Cover: ![Test Album|100x100](https://example.com/medium.jpg)\nYear: 2024\nRaw: 2024-03",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
