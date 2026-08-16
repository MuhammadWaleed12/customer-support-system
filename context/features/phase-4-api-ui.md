# Phase 4 — API & UI

## Status

Completed

## Goals

Per the Build Order in project-overview.md:

- Chat routes with streaming and persistence
- React chat UI, typing indicator, agent badges

## What shipped

**Backend**

- `services/chat.service.ts`: orchestrates one full turn — create/load conversation, persist user message, classify intent, delegate to the matching sub-agent (via `agents/run-agent.ts`), persist the assistant reply with `agentType`/`reasoning`/`toolCalls`, auto-derive a conversation title from the first message
- `agents/run-agent.ts`: dispatches the router's decision to the matching sub-agent and awaits full completion (see "Streaming decision" below), normalizing tool calls to `{ name, args }` for storage
- `agents/registry.ts`: static agent metadata (label, description, color, icon, tool descriptors) backing `GET /api/agents`
- `services/user.service.ts` + `GET /api/users`: minimal addition, not in project-overview.md's API Routes list — needed because "no auth, a seeded user is selected client-side" requires *some* way to enumerate seeded users, and their UUIDs regenerate on every reseed so hardcoding one in the frontend wasn't viable
- Full route set: `POST /api/chat/messages`, `GET/DELETE /api/chat/conversations(/:id)`, `GET /api/agents`, `GET /api/agents/:type/capabilities`, `GET /api/users` — all registered in the single chained `.route()` expression
- Controllers built with `hono/factory`'s `createHandlers()` (routes stay thin wiring, controllers parse input/call one service/shape response) — verified this preserves `AppType`/RPC inference before committing to the pattern, since coding-standards.md warns that getting route registration wrong silently degrades RPC to `any`
- Path-scoped `createFactory<Env, "/conversations/:id">()` instances where a route has a `:param`, since a bare `createFactory()` can't infer the path pattern and types `c.req.param()` as possibly `undefined`

**Frontend**

- Full chat UI: `Sidebar` (conversation list, "New conversation"), `MessageThread`/`MessageBubble` (with `AgentBadge` and a collapsible "Reasoning & tool calls" panel), `ChatInput`, `TypingIndicator`, `UserSwitcher`
- Agent colors come from the Tailwind `@theme` tokens (`bg-agent-*`/`text-agent-*`) defined in Phase 1, not inline styles reading the backend registry's hex values — single source of truth for color stays in CSS per coding-standards
- Icons mapped from `lucide-react` using the exact names from project-spec.md's Agent Colors & Icons table (GitBranch, LifeBuoy, Package, Receipt, HelpCircle)
- Assistant markdown (bold, lists) rendered via `react-markdown` with Tailwind-styled component overrides — added after browser verification showed raw `**bold**`/`- ` markdown syntax rendering as literal text
- Toast system (`useToast` + `ToastProvider`) for surfacing send/delete errors, per coding-standards' "surface via toast" rule
- All data access goes through typed hooks (`useUsers`, `useAgents`, `useConversations`, `useConversation`, `useSendMessage`, `useDeleteConversation`) wrapping the `hc<AppType>` client — no raw fetch or RPC calls inside components

## Streaming decision

Sub-agents use `streamText` internally (required for multi-step tool calling), but the chat route **awaits full completion** server-side and returns one JSON response rather than piping a live token stream to the browser. project-spec.md's own scope-priority section lists "Streaming responses" under "Ship if time allows," separately from the "Must ship" bar ("Basic chat UI with typing indicator" — not "streaming text UI"). Buffered responses hit that bar with much less complexity (no background-persistence-after-response pattern, no stream-splitting), so this was built first; live token streaming is a natural Phase 5 upgrade if time allows.

## Verification

- All 27 backend tests still pass (21 service/middleware + 6 live router)
- Every new route manually verified with curl against the live seeded DB: send message (new + follow-up conversation, context correctly retained), list/get/delete conversations, 404 on unknown conversation/agent type, 400 on missing required field, fallback routing
- Browser-verified end to end with a headless Chromium (Playwright) driver: sidebar, user switcher, message send → typing indicator → assistant reply with correct agent badge, reasoning panel expansion, new-conversation flow, zero console errors. Screenshots taken at each step.

## Notes

- Branch: `feature/phase-4-api-ui`
