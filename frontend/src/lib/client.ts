import { hc } from "hono/client";
import type { AppType } from "backend/app";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// credentials: "include" so the httpOnly session cookie is sent — required
// since the frontend and backend are different origins (different ports in
// dev, different domains once deployed to Vercel/Railway).
export const client = hc<AppType>(API_URL, { init: { credentials: "include" } });
