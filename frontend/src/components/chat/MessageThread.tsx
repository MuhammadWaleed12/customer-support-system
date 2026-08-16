import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ConversationDetails } from "../../hooks/useConversation";

interface MessageThreadProps {
  messages: ConversationDetails["messages"];
  sending: boolean;
}

export function MessageThread({ messages, sending }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  if (messages.length === 0 && !sending) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-neutral-500">
        Ask about an order, a refund, or anything else — a specialist will pick it up.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {sending && <TypingIndicator label="Thinking" />}
      <div ref={bottomRef} />
    </div>
  );
}
