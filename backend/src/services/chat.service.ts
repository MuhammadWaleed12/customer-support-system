import { conversationService, type MessageDetails } from "./conversation.service.js";
import { classifyIntent, type RouterDecision } from "../agents/router.agent.js";
import { runAgent } from "../agents/run-agent.js";

const CONTEXT_WINDOW = 10;

export interface SendMessageInput {
  userId: string;
  conversationId?: string;
  content: string;
}

export interface SendMessageResult {
  conversationId: string;
  title: string | null;
  routing: RouterDecision;
  message: MessageDetails;
}

function deriveTitle(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export const chatService = {
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const conversation: { id: string; title: string | null; messages: MessageDetails[] } = input.conversationId
      ? await conversationService.getById(input.conversationId)
      : { ...(await conversationService.create(input.userId, deriveTitle(input.content))), messages: [] };

    const context = conversation.messages.slice(-CONTEXT_WINDOW);

    await conversationService.addMessage(conversation.id, {
      role: "user",
      content: input.content,
    });

    const routing = await classifyIntent(input.content, context);
    const { text, toolCalls } = await runAgent(routing.agent, input.userId, input.content, context);

    const message = await conversationService.addMessage(conversation.id, {
      role: "assistant",
      content: text,
      agentType: routing.agent,
      reasoning: routing.reasoning,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });

    return { conversationId: conversation.id, title: conversation.title, routing, message };
  },
};
