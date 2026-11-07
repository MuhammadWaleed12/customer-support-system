import { Hono } from "hono";
import { login, logout, me } from "../controllers/auth.controller.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const loginRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });

export const authRoutes = new Hono()
  .post("/login", loginRateLimit, ...login)
  .post("/logout", ...logout)
  .get("/me", ...me);
