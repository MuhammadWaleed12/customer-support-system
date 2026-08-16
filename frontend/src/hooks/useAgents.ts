import { useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type AgentMetadata = InferResponseType<typeof client.api.agents.$get>[number];

export function useAgents() {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);

  useEffect(() => {
    let cancelled = false;

    client.api.agents
      .$get()
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAgents(data);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byType = new Map(agents.map((agent) => [agent.type, agent]));

  return { agents, byType };
}
