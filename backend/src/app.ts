import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.routes.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  }),
);

const routes = app.route("/health", healthRoutes);

export type AppType = typeof routes;
export default app;
