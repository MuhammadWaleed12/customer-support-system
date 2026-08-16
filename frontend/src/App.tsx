import { useHealthCheck } from "./hooks/useHealthCheck";

function App() {
  const health = useHealthCheck();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-5 text-center">
        <h1 className="text-lg font-medium text-neutral-100">Support Desk AI</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Backend status:{" "}
          {health.status === "loading" && <span className="text-neutral-500">checking…</span>}
          {health.status === "ok" && <span className="text-agent-billing">ok</span>}
          {health.status === "error" && (
            <span className="text-red-400">error — {health.error}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default App;
