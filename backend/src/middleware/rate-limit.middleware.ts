import type { MiddlewareHandler } from "hono";
import { RateLimitError } from "../lib/errors.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * In-memory fixed-window limiter keyed by client IP, falling back to a
 * single shared bucket when no IP header is present (e.g. local dev with
 * no reverse proxy). Good enough for a single-process demo app; a real
 * multi-instance deployment would need a shared store instead of a Map.
 */
export function rateLimit({ windowMs, max }: RateLimitOptions): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return async (c, next) => {
    const key = c.req.header("x-forwarded-for") ?? "anonymous";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
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
