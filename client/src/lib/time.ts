const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}