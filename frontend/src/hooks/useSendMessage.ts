import { useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type SendMessageResult = InferResponseType<typeof client.api.chat.messages.$post>;

interface SendMessageInput {
  userId: string;
  conversationId?: string;
  content: string;
}

type SendMessageOutcome = { ok: true; data: SendMessageResult } | { ok: false; error: string };

export function useSendMessage() {
  const [sending, setSending] = useState(false);

  async function sendMessage(input: SendMessageInput): Promise<SendMessageOutcome> {
    setSending(true);
    try {
      const res = await client.api.chat.messages.$post({ json: input });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Failed to send message (${res.status})`;
        return { ok: false, error: message };
      }
      return { ok: true, data: await res.json() };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Please try again." };
    } finally {
      setSending(false);
    }
  }

  return { sendMessage, sending };
}
