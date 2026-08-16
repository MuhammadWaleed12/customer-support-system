import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ConversationDetails } from "../../hooks/useConversation";
import type { StreamingMessage } from "../../hooks/useStreamMessage";

interface MessageThreadProps {
  messages: ConversationDetails["messages"];
  streaming: StreamingMessage | null;
  sending: boolean;
}

export function MessageThread({ messages, streaming, sending }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streaming?.text]);

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
      {sending && !streaming && <TypingIndicator label="Routing" />}
      {streaming && <StreamingMessageBubble {...streaming} />}
      <div ref={bottomRef} />
    </div>
  );
}
