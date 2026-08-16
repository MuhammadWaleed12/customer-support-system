import type { Env } from "hono";
import { createFactory } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { chatService } from "../services/chat.service.js";
import { conversationService } from "../services/conversation.service.js";

const factory = createFactory();
const conversationIdFactory = createFactory<Env, "/conversations/:id">();

const sendMessageSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1),
});

export const sendMessage = factory.createHandlers(
  zValidator("json", sendMessageSchema),
  (c) => {
    const stream = chatService.streamMessage(c.req.valid("json"));
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  },
);

const listConversationsSchema = z.object({
  userId: z.string().uuid(),
});

export const listConversations = factory.createHandlers(
  zValidator("query", listConversationsSchema),
  async (c) => {
    const { userId } = c.req.valid("query");
    const conversations = await conversationService.listByUser(userId);
    return c.json(conversations);
  },
);

export const getConversation = conversationIdFactory.createHandlers(async (c) => {
  const conversation = await conversationService.getById(c.req.param("id"));
  return c.json(conversation);
});

export const deleteConversation = conversationIdFactory.createHandlers(async (c) => {
  await conversationService.remove(c.req.param("id"));
  return c.body(null, 204);
});
