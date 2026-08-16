import type { Env } from "hono";
import { createFactory } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { chatService } from "../services/chat.service.js";
import { conversationService } from "../services/conversation.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const factory = createFactory();
const conversationIdFactory = createFactory<Env, "/conversations/:id">();

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1),
});

export const sendMessage = factory.createHandlers(
  requireAuth,
  zValidator("json", sendMessageSchema),
  (c) => {
    const stream = chatService.streamMessage({ userId: c.get("user").id, ...c.req.valid("json") });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  },
);

export const listConversations = factory.createHandlers(requireAuth, async (c) => {
  const conversations = await conversationService.listByUser(c.get("user").id);
  return c.json(conversations);
});

export const getConversation = conversationIdFactory.createHandlers(requireAuth, async (c) => {
  const conversation = await conversationService.getById(c.req.param("id"), c.get("user").id);
  return c.json(conversation);
});

export const deleteConversation = conversationIdFactory.createHandlers(requireAuth, async (c) => {
  await conversationService.remove(c.req.param("id"), c.get("user").id);
  return c.body(null, 204);
});
