import { conversationService, type MessageDetails } from "./conversation.service.js";
import { classifyIntent, type RouterAgentType } from "../agents/router.agent.js";
import { dispatchAgent } from "../agents/run-agent.js";

const CONTEXT_WINDOW = 10;

export interface SendMessageInput {
  userId: string;
  conversationId?: string;
  content: string;
}

export type ChatStreamEvent =
  | {
      type: "routing";
      conversationId: string;
      title: string | null;
      agent: RouterAgentType;
      confidence: number;
      reasoning: string;
    }
  | { type: "text-delta"; delta: string }
  | { type: "done"; conversationId: string; message: MessageDetails }
  | { type: "error"; message: string };

function deriveTitle(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

function encodeEvent(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export const chatService = {
  /**
   * Streams one full chat turn as newline-delimited JSON events: the
   * router's decision first (so the UI can show the agent badge before any
   * text arrives), then text deltas as the sub-agent streams, then a final
   * "done" event once the reply is persisted. The assistant message is
   * only written to the database after the stream completes — there is no
   * partial/uncommitted message during streaming.
   */
  streamMessage(input: SendMessageInput): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const conversation: { id: string; title: string | null; messages: MessageDetails[] } = input.conversationId
            ? await conversationService.getById(input.conversationId, input.userId)
            : { ...(await conversationService.create(input.userId, deriveTitle(input.content))), messages: [] };

          const context = conversation.messages.slice(-CONTEXT_WINDOW);

          await conversationService.addMessage(conversation.id, {
            role: "user",
            content: input.content,
          });

          const routing = await classifyIntent(input.content, context);

          controller.enqueue(
            encodeEvent({
              type: "routing",
              conversationId: conversation.id,
              title: conversation.title,
              agent: routing.agent,
              confidence: routing.confidence,
              reasoning: routing.reasoning,
            }),
          );

          const agentStream = dispatchAgent(routing.agent, input.userId, input.content, context);

          let fullText = "";
          for await (const delta of agentStream.textStream) {
            fullText += delta;
            controller.enqueue(encodeEvent({ type: "text-delta", delta }));
          }

          const rawToolCalls = await agentStream.toolCalls;
          const toolCalls = rawToolCalls.map((call) => ({ name: call.toolName, args: call.input }));

          const message = await conversationService.addMessage(conversation.id, {
            role: "assistant",
            content: fullText,
            agentType: routing.agent,
            reasoning: routing.reasoning,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          controller.enqueue(encodeEvent({ type: "done", conversationId: conversation.id, message }));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Something went wrong.";
          controller.enqueue(encodeEvent({ type: "error", message }));
        } finally {
          controller.close();
        }
      },
    });
  },
};
