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
