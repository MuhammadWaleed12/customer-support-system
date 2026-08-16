# Current Feature

<!-- Feature Name -->

Phase 3 — Agents (tools, sub-agents, router, fallback, router classification tests)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Per the Build Order in project-overview.md:

- Tool definitions wrapping the Phase 2 services (`fetchOrderDetails`, `checkDeliveryStatus`, `getInvoiceDetails`, `checkRefundStatus`, `searchConversationHistory`)
- Three sub-agents (support, order, billing) with focused prompts and their own tool sets
- Router agent (structured classification, no tools, no streaming) with fallback
- Router classification tests

## Notes

<!-- Any extra notes -->

- Upgraded `ai` 4.1.0 → 7.0.66 and `@ai-sdk/anthropic` 1.1.6 → 4.0.39 before writing any agent code — coding-standards.md's own tool example already used `inputSchema`, a v5+ convention, so the originally-installed v4 SDK was already behind the project's own spec. Confirmed current API via installed `.d.ts` files rather than guessing.
- `generateObject` is deprecated in v7 in favor of `generateText({ output: Output.object({ schema }) })`; used the current non-deprecated form since the architectural pattern (separate, non-streaming, structured call) is unchanged — just the API name.
- Tool error handling: domain tool files stay pure (description + Zod schema + service call, no try/catch), matching coding-standards.md. The catch lives in one shared `agents/lib/create-service-tool.ts` helper (the "agent layer"), converting `NotFoundError`/`ValidationError`/`ExternalServiceError` into a `{ error: string }` tool result the model turns into prose, instead of relying on undocumented default SDK behavior for thrown tool errors.
- `searchConversationHistory`'s `userId` is bound server-side via a tool factory (`createSearchConversationHistoryTool(userId)`), not exposed as a model-supplied input — the model has no reliable way to know a customer's UUID, and exposing it would let the model search another customer's history.
- Found and fixed two real bugs via a manual smoke test (Build Order only requires router tests, but this code path was unexercised): (1) Claude Sonnet 5's extended thinking produces an empty-text reasoning block that fails schema validation on multi-step tool-call replay — fixed by setting `providerOptions.anthropic.thinking = { type: 'disabled' }` on all agent calls; (2) domain services returned raw `Date` objects, which aren't valid `JSONValue` for a tool result — fixed by converting to ISO strings at the service boundary (same category of bug as the existing Decimal-conversion rule, just for dates).
- Branch: `feature/phase-3-agents`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Phase 1 — Foundation: Turborepo/pnpm monorepo scaffolded, Hono backend with `/health` round-tripping through Hono RPC (chained `.route()`, `AppType`), React 19 + Vite frontend with Tailwind v4 and `hc<AppType>` client, full Prisma schema migrated to Supabase, seed script verified against live DB (3 users, 8 orders across all statuses, 4 shipments incl. 1 exception, 6 invoices across all statuses, 3 refunds incl. 2 mid-flight, 3 conversations with messages). Build and typecheck pass across both workspaces.
- Phase 2 — Data Layer: typed errors (`NotFoundError`, `ValidationError`, `ExternalServiceError`) and one `app.onError` middleware mapping them to HTTP status; `orderService`, `billingService`, `conversationService` returning plain objects (Decimal → number at the boundary); vitest added to backend, 21 unit tests passing against the live seeded Supabase data (services + error middleware). Build and typecheck pass across both workspaces.
- Phase 3 — Agents: upgraded AI SDK to current (`ai` 7, `@ai-sdk/anthropic` 4); 5 domain tools across `order`/`billing`/`support` tool files, all pure data-access wrappers; `createServiceTool` agent-layer helper catches typed service errors and returns a graceful tool result; router agent does one non-streaming structured classification call (`generateText` + `Output.object`) with fallback; order/billing/support/fallback sub-agents use `streamText` with `stopWhen: stepCountIs(5)`. Fixed two bugs surfaced by a manual smoke test: disabled Claude's extended thinking (was breaking multi-step tool-call replay) and converted service `Date` fields to ISO strings (weren't valid tool-result JSON). 27 unit tests passing (21 service/middleware + 6 live router classification tests against the real Anthropic API). Build and typecheck pass across both workspaces.
