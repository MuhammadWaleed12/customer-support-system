import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit.middleware.js";
import { errorMiddleware } from "./error.middleware.js";

function buildTestApp(max: number) {
  const app = new Hono();
  app.onError(errorMiddleware);
  app.get("/limited", rateLimit({ windowMs: 60_000, max }), (c) => c.json({ ok: true }));
  return app;
}

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
});
