import { useCallback, useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type ConversationDetails = InferResponseType<
  (typeof client.api.chat.conversations)[":id"]["$get"]
>;

export function useConversation(conversationId: string | undefined) {
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    setLoading(true);
    const res = await client.api.chat.conversations[":id"].$get({ param: { id: conversationId } });
    if (res.ok) setConversation(await res.json());
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { conversation, loading, refetch };
}
