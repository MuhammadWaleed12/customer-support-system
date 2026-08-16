import { AgentBadge } from "./AgentBadge";
import { MarkdownContent } from "./MarkdownContent";
import { TypingIndicator } from "./TypingIndicator";
import type { StreamingMessage } from "../../hooks/useStreamMessage";

export function StreamingMessageBubble({ agentType, text }: StreamingMessage) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100">
        <div className="mb-1.5">
          <AgentBadge agentType={agentType} />
        </div>
        {text ? <MarkdownContent content={text} /> : <TypingIndicator agentType={agentType} label="Thinking" />}
      </div>
    </div>
  );
}
