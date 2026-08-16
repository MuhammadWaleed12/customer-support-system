import { useCallback, useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type ConversationDetails = InferResponseType<
  (typeof client.api.chat.conversations)[":id"]["$get"]
>;

export function useConversation(conversationId: string | undefined) {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable identity (no closure over conversationId) so callers mid-stream
  // can fetch a freshly-known id without racing a stale closure from the
  // render that started the request.
  const fetchById = useCallback(async (id: string) => {
    setLoading(true);
    const res = await client.api.chat.conversations[":id"].$get({ param: { id } });
    if (res.ok) setConversation(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    fetchById(conversationId);
  }, [conversationId, fetchById]);

  return { conversation, loading, fetchById };
}
