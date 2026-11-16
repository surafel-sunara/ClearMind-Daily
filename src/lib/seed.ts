export const DAY_MS = 86_400_000;
export const ARCHIVE_DAYS = 7;

export function utcDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dateOffset(date: string, days: number): string {
  return utcDate(new Date(Date.parse(date + "T00:00:00Z") + days * DAY_MS));
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.valueOf()) && utcDate(parsed) === value;
}

export function archiveDates(today: string): string[] {
  return Array.from({ length: ARCHIVE_DAYS }, (_, index) => dateOffset(today, -1 - index));
}

export function dateLabel(date: string, format: "long" | "short" | "weekday" = "long"): string {
  const options: Intl.DateTimeFormatOptions = format === "short"
    ? { month: "short", day: "numeric" }
    : { month: "long", day: "numeric", ...(format === "weekday" ? { weekday: "long" } : { year: "numeric" }) };
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
}

export function getDailySeed(gameName: string, dateStr = utcDate()): number {
  let hash = 2166136261;
  const key = gameName + ":" + dateStr;
  for (let i = 0; i < key.length; i++) {
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

export type Random = () => number;

export function mulberry32(seed: number): Random {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let result = Math.imul(seed ^ (seed >>> 15), seed | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}
