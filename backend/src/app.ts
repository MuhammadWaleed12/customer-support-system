import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.onError(errorMiddleware);

const routes = app
  .route("/api/chat", chatRoutes)
  .route("/api/agents", agentRoutes)
  .route("/api/auth", authRoutes)
  .route("/health", healthRoutes);

export type AppType = typeof routes;
export default app;
