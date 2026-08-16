import { useEffect, useState } from "react";
import { client } from "../lib/client";

interface HealthState {
  status: "loading" | "ok" | "error";
  timestamp?: string;
  error?: string;
}

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    client.health
      .$get()
      .then(async (res) => {
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setHealth({ status: "ok", timestamp: data.timestamp });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHealth({
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return health;
}
