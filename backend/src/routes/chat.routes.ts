import { Hono } from "hono";
import {
  sendMessage,
  listConversations,
  getConversation,
  deleteConversation,
} from "../controllers/chat.controller.js";

export const chatRoutes = new Hono()
  .post("/messages", ...sendMessage)
  .get("/conversations", ...listConversations)
  .get("/conversations/:id", ...getConversation)
  .delete("/conversations/:id", ...deleteConversation);
