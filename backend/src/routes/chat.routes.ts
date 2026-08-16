import { Hono } from "hono";
import {
  sendMessage,
  listConversations,
  getConversation,
  deleteConversation,
} from "../controllers/chat.controller.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";

const sendMessageRateLimit = rateLimit({ windowMs: 60_000, max: 20 });

export const chatRoutes = new Hono()
  .post("/messages", sendMessageRateLimit, ...sendMessage)
  .get("/conversations", ...listConversations)
  .get("/conversations/:id", ...getConversation)
  .delete("/conversations/:id", ...deleteConversation);
