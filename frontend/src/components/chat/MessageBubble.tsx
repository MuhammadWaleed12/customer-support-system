import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AgentBadge } from "./AgentBadge";
import type { ConversationDetails } from "../../hooks/useConversation";

type Message = ConversationDetails["messages"][number];

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-neutral-50">{children}</strong>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-neutral-200 underline">
      {children}
    </a>
  ),
};

interface ToolCallRecord {
  name: string;
  args: unknown;
}

function isToolCallList(value: unknown): value is ToolCallRecord[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === "object" && "name" in item);
}

export function MessageBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === "user";
  const toolCalls = isToolCallList(message.toolCalls) ? message.toolCalls : [];
  const hasDetails = Boolean(message.reasoning) || toolCalls.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg border px-3 py-2 text-sm ${
          isUser
            ? "border-neutral-700 bg-neutral-800 text-neutral-100"
            : "border-neutral-800 bg-neutral-900 text-neutral-100"
        }`}
      >
        {!isUser && message.agentType && (
          <div className="mb-1.5">
            <AgentBadge agentType={message.agentType} />
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
          </div>
        )}
        {!isUser && hasDetails && (
          <div className="mt-2 border-t border-neutral-800 pt-1.5">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Reasoning &amp; tool calls
            </button>
            {expanded && (
              <div className="mt-1.5 space-y-1 text-xs text-neutral-400">
                {message.reasoning && <p>{message.reasoning}</p>}
                {toolCalls.length > 0 && (
                  <ul className="space-y-0.5 font-mono">
                    {toolCalls.map((call, index) => (
                      <li key={index}>
                        {call.name}({JSON.stringify(call.args)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
