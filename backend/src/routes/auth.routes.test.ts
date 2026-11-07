import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { errorMiddleware } from "../middleware/error.middleware.js";
import { authRoutes } from "./auth.routes.js";

describe("login rate limiting", () => {
  it("blocks repeated login attempts before authentication work", async () => {
    const app = new Hono();
    app.onError(errorMiddleware);
    app.route("/auth", authRoutes);

    const request = () =>
      app.request("/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({}),
      });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await request()).status).toBe(400);
    }

    const blocked = await request();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
