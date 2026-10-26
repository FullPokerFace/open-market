// Per-visitor request limits. Kept in memory, so they reset on restart and aren't shared between
// server instances: enough to stop a stuck button or a casual flood, not a determined attacker.
import "server-only";

export const HOUR_MS = 60 * 60 * 1000;

export function visitor(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

// A limiter allowing `limit` calls per visitor in each `windowMs`; call it with a visitor id,
// true means this call is over the limit (and isn't counted)
export function rateLimit(limit, windowMs = HOUR_MS) {
  const recent = new Map();
  return (id) => {
    const now = Date.now();
    const times = (recent.get(id) ?? []).filter((t) => now - t < windowMs);
    if (times.length >= limit) return true;
    recent.set(id, [...times, now]);
    return false;
  };
}

// Requests that change data must come from this site's own pages
export const sameOrigin = (request) => request.headers.get("origin") === new URL(request.url).origin;
