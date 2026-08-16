import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { SESSION_COOKIE_NAME, requireAuth } from "../middleware/auth.middleware.js";

const factory = createFactory();

const isProduction = process.env.NODE_ENV === "production";

function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/",
    expires: expiresAt,
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = factory.createHandlers(zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const { token, user, expiresAt } = await authService.login(email, password);
  setSessionCookie(c, token, expiresAt);
  return c.json({ user });
});

export const logout = factory.createHandlers(async (c) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) await authService.logout(token);
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.body(null, 204);
});

export const me = factory.createHandlers(requireAuth, async (c) => {
  return c.json({ user: c.get("user") });
});
