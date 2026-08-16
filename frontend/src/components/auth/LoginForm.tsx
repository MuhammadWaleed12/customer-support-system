import { useState, type FormEvent } from "react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  loading: boolean;
}

export function LoginForm({ onLogin, loading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const outcome = await onLogin(email, password);
    if (!outcome.ok) setError(outcome.error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6"
      >
        <h1 className="text-lg font-medium text-neutral-100">Support Desk AI</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to continue.</p>

        <div className="mt-5 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-neutral-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-neutral-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-neutral-100 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
