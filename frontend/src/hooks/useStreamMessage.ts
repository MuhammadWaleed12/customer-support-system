import { useState } from "react";
import { API_URL } from "../lib/client";
import { consumeNdjsonStream, NdjsonParseError } from "../lib/ndjson";
import type { ConversationDetails } from "./useConversation";

type MessageDetails = ConversationDetails["messages"][number];

// Mirrors backend/src/services/chat.service.ts's ChatStreamEvent. Not
// imported directly — the backend's workspace `exports` map only exposes
// `./app` (per coding-standards.md's Hono RPC contract), so this small,
// stable shape is duplicated here rather than widening that export surface
// for one type.
type ChatStreamEvent =
  | {
      type: "routing";
      conversationId: string;
      title: string | null;
      agent: string;
      confidence: number;
      reasoning: string;
    }
  | { type: "text-delta"; delta: string }
  | { type: "done"; conversationId: string; message: MessageDetails }
  | { type: "error"; message: string };

export interface StreamingMessage {
  agentType: string;
  reasoning: string;
  text: string;
}

interface SendMessageInput {
  conversationId?: string;
  content: string;
}

interface StreamHandlers {
  onRouting?: (event: Extract<ChatStreamEvent, { type: "routing" }>) => void | Promise<void>;
  onDone?: (event: Extract<ChatStreamEvent, { type: "done" }>) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function useStreamMessage() {
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState<StreamingMessage | null>(null);

  async function sendMessage(input: SendMessageInput, handlers: StreamHandlers) {
    setSending(true);
    setStreaming(null);

    try {
      const res = await fetch(`${API_URL}/api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (res.status === 401) {
        handlers.onError?.("Your session has expired. Please sign in again.");
        return;
      }

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Failed to send message (${res.status})`;
        handlers.onError?.(message);
        return;
      }

      await consumeNdjsonStream<ChatStreamEvent>(res.body, async (event) => {
        if (event.type === "routing") {
          setStreaming({ agentType: event.agent, reasoning: event.reasoning, text: "" });
          await handlers.onRouting?.(event);
        } else if (event.type === "text-delta") {
          setStreaming((current) => (current ? { ...current, text: current.text + event.delta } : current));
        } else if (event.type === "done") {
          await handlers.onDone?.(event);
        } else if (event.type === "error") {
          handlers.onError?.(event.message);
        }
      });
    } catch (error) {
      handlers.onError?.(
        error instanceof NdjsonParseError
          ? "The server returned an invalid streaming response. Please try again."
          : "Couldn't reach the server. Please try again.",
      );
    } finally {
      setSending(false);
      setStreaming(null);
    }
  }

  return { sendMessage, sending, streaming };
}
