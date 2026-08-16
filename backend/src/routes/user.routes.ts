import { Hono } from "hono";
import { listUsers } from "../controllers/user.controller.js";

export const userRoutes = new Hono().get("/", ...listUsers);
