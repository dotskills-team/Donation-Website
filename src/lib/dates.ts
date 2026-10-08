import type { RangeKey } from "@/types";

// Bangladesh has a fixed UTC+6 offset (no DST), so day boundaries are exact.
const OFFSET = 6 * 3600_000;
const DAY = 86_400_000;

export function startOfDhakaDay(d: Date = new Date()) {
  const s = new Date(d.getTime() + OFFSET);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - OFFSET);
}

function parseYmd(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - OFFSET);
}

export function resolveRange(range: RangeKey | undefined, from?: string, to?: string) {
  const today = startOfDhakaDay();
  switch (range) {
    case "today":
      return { start: today, end: new Date(today.getTime() + DAY) };
    case "7d":
      return { start: new Date(today.getTime() - 6 * DAY), end: new Date(today.getTime() + DAY) };
    case "month": {
      const s = new Date(today.getTime() + OFFSET);
      const start = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1) - OFFSET);
      const end = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 1) - OFFSET);
      return { start, end };
    }
    case "custom": {
      const start = from ? parseYmd(from) : null;
      const e = to ? parseYmd(to) : null;
      return { start: start ?? undefined, end: e ? new Date(e.getTime() + DAY) : undefined };
    }
    default:
      return { start: undefined, end: undefined };
  }
}
