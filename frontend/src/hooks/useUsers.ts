import { useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type UserSummary = InferResponseType<typeof client.api.users.$get>[number];

export function useUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    client.api.users
      .$get()
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { users, loading };
}
