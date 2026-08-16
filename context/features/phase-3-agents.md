# Phase 3 — Agents

## Status

Completed

## Goals

Per the Build Order in project-overview.md:

- Tool definitions wrapping the Phase 2 services (`fetchOrderDetails`, `checkDeliveryStatus`, `getInvoiceDetails`, `checkRefundStatus`, `searchConversationHistory`)
- Three sub-agents (support, order, billing) with focused prompts and their own tool sets
- Router agent (structured classification, no tools, no streaming) with fallback
- Router classification tests

## What shipped

- Upgraded `ai` 4.1.0 → 7.0.66 and `@ai-sdk/anthropic` 1.1.6 → 4.0.39 before writing agent code — coding-standards.md's own `tool()` example already used `inputSchema`, a v5+ convention, so the originally-installed v4 SDK was already behind the project's own spec
- 5 domain tools across `order.tools.ts`, `billing.tools.ts`, `support.tools.ts` — pure data-access wrappers (description + Zod schema + one service call, no error handling)
- `agents/lib/create-service-tool.ts`: the one place in the agent layer that catches `NotFoundError`/`ValidationError`/`ExternalServiceError` and returns `{ error: string }` as a tool result the model turns into prose, instead of throwing
- Router agent: single non-streaming `generateText` call with `Output.object({ schema })` (the current, non-deprecated replacement for `generateObject`), no tools, returns `{ agent, confidence, reasoning }` with a `fallback` branch
- Four agent runners: `order.agent.ts`, `billing.agent.ts`, `support.agent.ts` (each `streamText` + domain tools, `stopWhen: stepCountIs(5)`), `fallback.agent.ts` (`streamText`, no tools)
- `searchConversationHistory`'s `userId` is bound server-side via a tool factory (`createSearchConversationHistoryTool(userId)`), not model-supplied — the model has no reliable way to know a customer's UUID, and exposing it would let it search another customer's history
- 27 tests passing: 21 service/middleware unit tests + 6 live router classification tests against the real Anthropic API
- Build and typecheck pass clean across both workspaces

## Bugs found and fixed via manual smoke testing

Build Order only requires router tests, but the sub-agent code path (streaming + tools) was otherwise unexercised, so a manual end-to-end smoke test was run before committing. It caught two real bugs:

1. **Extended thinking breaks multi-step tool replay.** Claude Sonnet 5's adaptive extended thinking produces an empty-text reasoning block by default; when `streamText` replays prior steps for a multi-step tool-calling continuation, that empty-text block fails the SDK's own `ModelMessage` schema validation and crashes the stream. Fixed by setting `providerOptions.anthropic.thinking = { type: 'disabled' }` on every agent call — this agent doesn't need extended reasoning.
2. **Raw `Date` objects aren't valid tool-result JSON.** The Phase 2 services returned live `Date` objects (`placedAt`, `estimatedDelivery`, `issuedAt`, `paidAt`, `requestedAt`, `completedAt`, `createdAt`, `updatedAt`). A tool result must be `JSONValue`, and a `Date` instance isn't one, so the same replay step failed validation. Fixed by converting every date field to an ISO string at the service boundary — the same category of fix as the existing Decimal-conversion rule in coding-standards.md, just for dates instead of decimals.

## Notes

- Branch: `feature/phase-3-agents`, merged to `main` and pushed.
