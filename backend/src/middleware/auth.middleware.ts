import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { authService, type SessionUser } from "../services/auth.service.js";

declare module "hono" {
  interface ContextVariableMap {
    user: SessionUser;
  }
}

export const SESSION_COOKIE_NAME = "session";

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const user = token ? await authService.getSessionUser(token) : null;

  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  c.set("user", user);
  await next();
};
