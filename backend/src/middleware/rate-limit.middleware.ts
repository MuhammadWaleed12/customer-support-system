import type { MiddlewareHandler } from "hono";
import { RateLimitError } from "../lib/errors.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  maxTrackedClients?: number;
}

const DEFAULT_MAX_TRACKED_CLIENTS = 10_000;

function clientKey(forwardedFor: string | undefined): string {
  // Proxies append hops to X-Forwarded-For. The first non-empty value is the
  // original client address; treating the whole header as a key lets one
  // client bypass limits by varying whitespace or the appended chain.
  return forwardedFor?.split(",").map((part) => part.trim()).find(Boolean) ?? "anonymous";
}

/**
 * In-memory fixed-window limiter keyed by client IP, falling back to a
 * single shared bucket when no IP header is present (e.g. local dev with
 * no reverse proxy). Good enough for a single-process demo app; a real
 * multi-instance deployment would need a shared store instead of a Map.
 */
export function rateLimit({
  windowMs,
  max,
  maxTrackedClients = DEFAULT_MAX_TRACKED_CLIENTS,
}: RateLimitOptions): MiddlewareHandler {
  if (windowMs <= 0 || max <= 0 || maxTrackedClients <= 0) {
    throw new Error("Rate-limit options must be positive");
  }

  const hits = new Map<string, { count: number; resetAt: number }>();

  return async (c, next) => {
    const key = clientKey(c.req.header("x-forwarded-for"));
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      if (entry) hits.delete(key);

      if (hits.size >= maxTrackedClients) {
        for (const [trackedKey, tracked] of hits) {
          if (tracked.resetAt <= now) hits.delete(trackedKey);
        }
      }

      // Fail closed instead of evicting a live bucket: eviction would let an
      // attacker rotate addresses to reset another client's request count.
      if (hits.size >= maxTrackedClients) {
        const nextResetAt = Math.min(...Array.from(hits.values(), ({ resetAt }) => resetAt));
        throw new RateLimitError(
          "Too many requests. Please slow down.",
          Math.ceil((nextResetAt - now) / 1000),
        );
      }

      hits.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > max) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
        throw new RateLimitError("Too many requests. Please slow down.", retryAfterSeconds);
      }
    }

    await next();
  };
}
