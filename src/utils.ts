export function prepareData(data: { [key: string]: string }) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

export function millisToMinutesAndSeconds(millis: number) {
  const minutes: number = Math.floor(millis / 60000);
  const seconds: number = parseInt(((millis % 60000) / 1000).toFixed(0));
  if (minutes === 0) {
    return (seconds < 10 ? "0" : "") + seconds + "s";
  }
  return minutes + "m:" + (seconds < 10 ? "0" : "") + seconds + "s";
}

export function millisToSeconds(millis: number) {
  return (millis / 1000).toFixed(0);
}

// Best effort / guessing to try to catch and indicate invalid / not found path
export function isPath(str: string) {
  const pathRegex = /^[a-zA-Z0-9_\\/.]+$/;
  return Boolean(str.match(pathRegex));
}

export function padZero(date: string | number) {
  return ("0" + date).slice(-2);
}

/**
 * Format a Spotify release_date string using a simple token-based format.
 *
 * Spotify dates come in three precisions: "YYYY", "YYYY-MM", "YYYY-MM-DD".
 * Supported tokens in the format string: YYYY, MM, DD.
 *
 * Returns the raw date unchanged when format is empty (backward compatible).
 *
 * Examples:
 *   formatSpotifyDate("2024-03-15", "YYYY")         → "2024"
 *   formatSpotifyDate("2024-03-15", "YYYY-MM")       → "2024-03"
 *   formatSpotifyDate("2024-03-15", "MM/DD/YYYY")    → "03/15/2024"
 *   formatSpotifyDate("2024-03-15", "")              → "2024-03-15"
 */
export function formatSpotifyDate(date: string, format: string): string {
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
