import type { ModelMessage } from "ai";
import type { MessageDetails } from "../../services/conversation.service.js";

export function toModelMessages(context: MessageDetails[], newMessage: string): ModelMessage[] {
  return [
    ...context.map((message): ModelMessage => ({ role: message.role, content: message.content })),
    { role: "user", content: newMessage },
  ];
}
