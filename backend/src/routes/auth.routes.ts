import { Hono } from "hono";
import { login, logout, me } from "../controllers/auth.controller.js";

export const authRoutes = new Hono()
  .post("/login", ...login)
  .post("/logout", ...logout)
  .get("/me", ...me);
