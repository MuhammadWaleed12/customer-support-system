import { useCallback, useEffect, useState } from "react";
import type { InferResponseType } from "hono/client";
import { client } from "../lib/client";

export type SessionUser = InferResponseType<typeof client.api.auth.me.$get>["user"];

type LoginOutcome = { ok: true } | { ok: false; error: string };

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  const checkSession = useCallback(async () => {
    setCheckingSession(true);
    const res = await client.api.auth.me.$get();
    setUser(res.ok ? (await res.json()).user : null);
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function login(email: string, password: string): Promise<LoginOutcome> {
    setLoggingIn(true);
    try {
      const res = await client.api.auth.login.$post({ json: { email, password } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : "Login failed";
        return { ok: false, error: message };
      }
      const { user: loggedInUser } = await res.json();
      setUser(loggedInUser);
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Please try again." };
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await client.api.auth.logout.$post();
    setUser(null);
  }

  return { user, checkingSession, loggingIn, login, logout };
}
