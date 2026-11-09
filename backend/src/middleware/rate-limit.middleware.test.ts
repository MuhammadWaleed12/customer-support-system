import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit.middleware.js";
import { errorMiddleware } from "./error.middleware.js";

function buildTestApp(max: number) {
  const app = new Hono();
  app.onError(errorMiddleware);
  app.get("/limited", rateLimit({ windowMs: 60_000, max }), (c) => c.json({ ok: true }));
  return app;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit", async () => {
    const app = buildTestApp(3);
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/limited");
      expect(res.status).toBe(200);
    }
  });

  it("rejects requests past the limit with 429 and a Retry-After header", async () => {
    const app = buildTestApp(2);
    await app.request("/limited");
    await app.request("/limited");
    const res = await app.request("/limited");

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(await res.json()).toEqual({ error: "Too many requests. Please slow down." });
  });

  it("tracks separate clients independently via x-forwarded-for", async () => {
    const app = buildTestApp(1);
    const resA1 = await app.request("/limited", { headers: { "x-forwarded-for": "1.1.1.1" } });
    const resB1 = await app.request("/limited", { headers: { "x-forwarded-for": "2.2.2.2" } });
    const resA2 = await app.request("/limited", { headers: { "x-forwarded-for": "1.1.1.1" } });

    expect(resA1.status).toBe(200);
    expect(resB1.status).toBe(200);
    expect(resA2.status).toBe(429);
  });

  it("normalizes proxy chains to the original client address", async () => {
    const app = buildTestApp(1);
    const first = await app.request("/limited", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    const second = await app.request("/limited", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.2" },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });

  it("bounds tracked clients and admits new clients after expired buckets are pruned", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T00:00:00Z"));

    const app = new Hono();
    app.onError(errorMiddleware);
    app.get(
      "/limited",
      rateLimit({ windowMs: 1_000, max: 2, maxTrackedClients: 2 }),
      (c) => c.json({ ok: true }),
    );

    const request = (ip: string) =>
      app.request("/limited", { headers: { "x-forwarded-for": ip } });

    expect((await request("192.0.2.1")).status).toBe(200);
    expect((await request("192.0.2.2")).status).toBe(200);
    expect((await request("192.0.2.3")).status).toBe(429);

    vi.advanceTimersByTime(1_001);
    expect((await request("192.0.2.3")).status).toBe(200);
  });

  it("rejects invalid limiter configuration", () => {
    expect(() => rateLimit({ windowMs: 0, max: 1 })).toThrow("must be positive");
    expect(() => rateLimit({ windowMs: 1, max: 0 })).toThrow("must be positive");
    expect(() => rateLimit({ windowMs: 1, max: 1, maxTrackedClients: 0 })).toThrow(
      "must be positive",
    );
  });
});
