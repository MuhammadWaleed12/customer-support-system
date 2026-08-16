import { hc } from "hono/client";
import type { AppType } from "backend/app";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const client = hc<AppType>(API_URL);
