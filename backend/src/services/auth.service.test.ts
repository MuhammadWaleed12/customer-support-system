import { beforeAll, describe, expect, it } from "vitest";
import { authService } from "./auth.service.js";
import { ValidationError } from "../lib/errors.js";
import { prisma } from "../db/client.js";

const DEMO_PASSWORD = "password123";
let aliceEmail: string;

beforeAll(async () => {
  const alice = await prisma.user.findUniqueOrThrow({ where: { email: "alice@example.com" } });
  aliceEmail = alice.email;
});

describe("authService.login", () => {
  it("returns a session token and user for correct credentials", async () => {
    const result = await authService.login(aliceEmail, DEMO_PASSWORD);
    expect(result.token).toHaveLength(64);
    expect(result.user.email).toBe(aliceEmail);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("throws ValidationError for the wrong password", async () => {
    await expect(authService.login(aliceEmail, "wrong-password")).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for an unknown email", async () => {
    await expect(authService.login("nobody@example.com", DEMO_PASSWORD)).rejects.toThrow(
      ValidationError,
    );
  });
});

describe("authService.getSessionUser / logout", () => {
  it("resolves the user for a valid session token, and null after logout", async () => {
    const { token, user } = await authService.login(aliceEmail, DEMO_PASSWORD);

    const sessionUser = await authService.getSessionUser(token);
    expect(sessionUser?.id).toBe(user.id);

    await authService.logout(token);

    expect(await authService.getSessionUser(token)).toBeNull();
  });

  it("returns null for a token that never existed", async () => {
    expect(await authService.getSessionUser("not-a-real-token")).toBeNull();
  });
});
