# Phase 5 — Bonuses

## Status

Completed

## Goals

Per the Build Order and Bonus Points table in project-overview.md:

- Rate limiting
- Reasoning panel / thinking loader (mostly shipped in Phase 4 already — the remaining gap is *live* status during tool calls, which needs streaming)
- Deploy

## Scope decisions

- **Deployment: skipped.** project-overview.md's bonus table lists it as a stretch goal, but project-spec.md's "Explicitly out of scope" list names it directly. Since project-spec.md was established as authoritative for resolving ambiguity back in Phase 1, that wins.
- **Context compaction, useworkflow.dev: skipped.** Both explicitly labeled "Stretch" (lowest priority) in project-spec.md's scope-priority list.
- **Real token streaming: in scope.** project-spec.md lists "Streaming responses" under "Ship if time allows" — separate from and lower-priority than the "Must ship" bar, which is why Phase 4 shipped a buffered response first. Once must-ship was done, this became the natural next step, and it's what actually completes the reasoning-panel bonus (live routing badge + rotating status, not just the after-the-fact collapsible panel Phase 4 already had).

## What shipped

**Rate limiting**

- `lib/errors.ts` gained a fourth typed error, `RateLimitError` (429, carries `retryAfterSeconds`) — none of the existing three (404/400/502) fit a rate-limit response, and 429 is the standard/expected status for backoff-aware clients
- `middleware/rate-limit.middleware.ts`: in-memory fixed-window limiter keyed by `x-forwarded-for` (falls back to a shared bucket for local dev with no proxy). Explicitly scoped to a single process — a real multi-instance deployment would need a shared store, but that's out of scope here
- Applied only to `POST /api/chat/messages` (20 req/min) — the one endpoint that costs real LLM API calls, not the cheap reads
- 3 new unit tests + verified live against the running server

**Streaming**

- Replaced Phase 4's buffered `chatService.sendMessage` (one JSON response) with `chatService.streamMessage`, returning a `ReadableStream` of newline-delimited JSON events: `routing` (fires immediately after classification, before any agent text — carries `conversationId`/`title`/`agent`/`confidence`/`reasoning`) → `text-delta` (one per token/chunk as the sub-agent streams) → `done` (the fully persisted assistant message) → `error` (typed-error-safe: any throw mid-stream is caught and sent as a graceful event rather than dropping the connection)
- The assistant message is only written to the database once, after the full stream completes — there's no partial/uncommitted row during streaming
- `agents/run-agent.ts`'s `runAgent()` (awaited) was replaced with `dispatchAgent()` (returns the live `StreamTextResult` unawaited) — the old buffered path had no remaining caller once the chat route switched to streaming, so it was removed rather than kept as dead code
- Frontend: `useStreamMessage` reads the response body via `fetch` + `ReadableStream` reader (not the typed RPC client — `hc<AppType>`'s `.json()` can't parse an NDJSON body, so raw `fetch` is the deliberate, justified exception to "no raw fetch" here), buffering partial lines and parsing each complete JSON line as it arrives
- New `StreamingMessageBubble` shows the agent badge the instant the `routing` event arrives (before any text), with a `TypingIndicator` fallback until the first `text-delta`, then live-updates as text streams in — this is what the collapsible reasoning panel from Phase 4 couldn't do on its own
- Extracted `MarkdownContent` (previously inlined in `MessageBubble`) so both the final persisted bubble and the live streaming bubble render markdown identically

## Verification

- 30 backend tests pass (27 from Phases 2–3 + 3 new rate-limit tests)
- Streaming endpoint manually verified with `curl -N`: routing event arrives first, text-deltas stream incrementally, done event carries the correctly-persisted message with tool calls
- Rate limiter verified live against the running server (20 requests pass, 21st returns 429 with `Retry-After`)
- Browser-verified with a headless Chromium driver: agent badge + "Thinking" appear immediately on send (before any text), text streams in visibly, final state matches the persisted conversation, zero console errors

## Notes

- Branch: `feature/phase-5-bonuses`
- Also fixed mid-phase: the project directory lives under an iCloud-synced Desktop, which was silently creating byte-identical " 2" conflict-copy files during rapid successive writes (e.g. `registry 2.ts`). Cleaned up; worth excluding this folder from iCloud sync (or moving it outside Desktop) to stop it recurring.
