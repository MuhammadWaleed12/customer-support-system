import { z } from "zod";
import { createServiceTool } from "../lib/create-service-tool.js";
import { conversationService } from "../../services/conversation.service.js";

/**
 * userId is bound server-side from the authenticated conversation, not
 * exposed as a model-supplied input: the model has no reliable way to know a
 * customer's UUID, and letting it supply one would let it search another
 * customer's history.
 */
export function createSearchConversationHistoryTool(userId: string) {
  return createServiceTool({
    description:
      "Search the customer's past conversations for messages matching a keyword or phrase. Use this when the customer references something discussed previously or asks what they said before.",
    inputSchema: z.object({
      query: z.string().describe("Keyword or phrase to search for in the customer's past messages"),
    }),
    execute: ({ query }) => conversationService.searchHistory(userId, query),
  });
}
