import { HttpError } from "@/lib/errors";

// In-memory limiter: fine for a single instance. Swap for Redis/Upstash when scaling out.
const g = globalThis as unknown as { __rl?: Map<string, { count: number; reset: number }> };
const hits = (g.__rl ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const e = hits.get(key);
  if (!e || e.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  e.count += 1;
  if (e.count > limit) {
    throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
  }
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
