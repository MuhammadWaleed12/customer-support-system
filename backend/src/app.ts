import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  }),
);

app.onError(errorMiddleware);

const routes = app.route("/health", healthRoutes);

export type AppType = typeof routes;
export default app;
