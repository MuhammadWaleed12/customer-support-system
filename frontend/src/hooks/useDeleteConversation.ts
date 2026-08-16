import { useState } from "react";
import { client } from "../lib/client";

export function useDeleteConversation() {
  const [deleting, setDeleting] = useState(false);

  async function deleteConversation(id: string): Promise<boolean> {
    setDeleting(true);
    try {
      const res = await client.api.chat.conversations[":id"].$delete({ param: { id } });
      return res.ok;
    } finally {
      setDeleting(false);
    }
  }

  return { deleteConversation, deleting };
}
