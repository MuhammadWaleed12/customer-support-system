import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { requireAuth } from "./auth.middleware.js";
import { errorMiddleware } from "./error.middleware.js";
import { authService } from "../services/auth.service.js";
import { prisma } from "../db/client.js";

function buildTestApp() {
  const app = new Hono();
  app.onError(errorMiddleware);
  app.get("/protected", requireAuth, (c) => c.json({ userId: c.get("user").id }));
  return app;
}

let aliceEmail: string;

beforeAll(async () => {
  const alice = await prisma.user.findUniqueOrThrow({ where: { email: "alice@example.com" } });
  aliceEmail = alice.email;
});

describe("requireAuth", () => {
  it("returns 401 when no session cookie is present", async () => {
    const res = await buildTestApp().request("/protected");
    expect(res.status).toBe(401);
  });

  it("returns 401 for a bogus session cookie", async () => {
    const res = await buildTestApp().request("/protected", {
      headers: { Cookie: "session=not-a-real-token" },
    });
    expect(res.status).toBe(401);
  });

  it("allows the request through and exposes the user for a valid session", async () => {
    const { token, user } = await authService.login(aliceEmail, "password123");

    const res = await buildTestApp().request("/protected", {
      headers: { Cookie: `session=${token}` },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: user.id });
  });
});
