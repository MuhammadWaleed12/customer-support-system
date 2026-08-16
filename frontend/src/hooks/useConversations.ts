import { useCallback, useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type ConversationSummary = InferResponseType<
  typeof client.api.chat.conversations.$get
>[number];

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const res = await client.api.chat.conversations.$get({ query: { userId } });
    if (res.ok) setConversations(await res.json());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { conversations, loading, refetch };
}
