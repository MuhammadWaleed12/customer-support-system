import { Hono } from "hono";
import { listAgents, getCapabilities } from "../controllers/agent.controller.js";

export const agentRoutes = new Hono()
  .get("/", ...listAgents)
  .get("/:type/capabilities", ...getCapabilities);
