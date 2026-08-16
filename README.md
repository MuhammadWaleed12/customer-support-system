# Support Desk AI

Multi-agent customer support system with intelligent routing. A router agent classifies each incoming message, then delegates to a specialist sub-agent — order, billing, or support — that only sees the tools for its own domain.

## Why a router, not one big prompt

A single LLM given every tool for every domain degrades badly: tool selection gets worse as the tool count grows, the system prompt becomes a bloated compromise, billing logic leaks into order conversations, and nothing is independently testable. Routing first keeps each agent's prompt focused, its tool set small, and its behavior testable in isolation — the router's classification is a separate, non-streaming call with no tools, so routing can be unit-tested without mocking a whole conversation.

```mermaid
graph TD;
  Client[React + Vite] <--> API[Hono API]
  API --> Chat[Chat Service]
  Chat --> Router[Router Agent]
  Router --> Support[Support Agent]
  Router --> Order[Order Agent]
  Router --> Billing[Billing Agent]
  Support --> Tools[Tool Layer]
  Order --> Tools
  Billing --> Tools
  Tools --> Services[Domain Services]
  API --> Services
  Services --> DB[(Supabase Postgres)]
```

REST routes and agent tools share one data-access path — the domain services — so there is never a second, divergent way to read the same data.

## Tech stack

| Category | Choice |
| -------- | ------ |
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Hono.dev (Node runtime) |
| Frontend | React 19 + Vite |
| Language | TypeScript (strict) |
| Database | Supabase (managed PostgreSQL) |
| ORM | Prisma |
| AI | Vercel AI SDK (`ai` v7) + `@ai-sdk/anthropic` |
| Type safety | Hono RPC (`hc<AppType>`) |
| Validation | Zod |
| Styling | Tailwind CSS v4 |
| Testing | Vitest |

## Getting started

```bash
pnpm install
```

Create `backend/.env` from `backend/.env.example` and fill in:

```bash
DATABASE_URL="postgresql://...@...:6543/postgres?pgbouncer=true"  # Supabase pooled connection
DIRECT_URL="postgresql://...@...:5432/postgres"                    # Supabase direct connection (migrations)
ANTHROPIC_API_KEY=""
ROUTER_MODEL="claude-haiku-4-5-20251001"   # small/fast model for classification
AGENT_MODEL="claude-sonnet-5"              # stronger model for sub-agents
PORT=3001
```

Then set up the database and start both apps:

```bash
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # 3 users, 8 orders (every status), shipments, invoices, refunds, sample conversations
pnpm dev          # backend on :3001, frontend on :5173
```

Open http://localhost:5173. No auth — pick a seeded user from the switcher in the header.

## Other commands

```bash
pnpm build        # typecheck + build both workspaces
pnpm typecheck     # tsc --noEmit, both workspaces
pnpm test          # backend vitest suite (hits the live seeded DB and the real Anthropic API)
```

## Repository structure

```
backend/
  src/
    routes/         # thin Hono route wiring, chained into one AppType
    controllers/     # parse input, call one service, shape the response
    services/        # business logic, typed errors, Decimal/Date → plain values at the boundary
    agents/
      router.agent.ts        # generateText + Output.object, no tools, no streaming
      order|billing|support|fallback.agent.ts   # streamText + domain tools
      tools/          # Zod-typed wrappers over services, one file per domain
      lib/            # createServiceTool (graceful tool-error handling), message mapping
      prompts/        # one system prompt per agent, own file
    middleware/       # error.middleware (typed errors → HTTP status), rate-limit.middleware
    db/               # PrismaClient singleton
  prisma/
    schema.prisma
    seed.ts
frontend/
  src/
    components/chat/   # Sidebar, MessageThread, MessageBubble, StreamingMessageBubble, ...
    hooks/              # useConversations, useConversation, useStreamMessage, ... (wrap the RPC client)
    lib/client.ts       # hc<AppType>
context/
  features/             # one doc per Build Order phase — goals, what shipped, decisions made
```

## API

```
/api
├── /chat
│   ├── POST   /messages               # send a message; streams NDJSON (routing → text-delta* → done)
│   ├── GET    /conversations          # list a user's conversations
│   ├── GET    /conversations/:id      # get one conversation with its messages
│   └── DELETE /conversations/:id
├── /agents
│   ├── GET /agents                    # registry: label, color, icon, tools per agent
│   └── GET /agents/:type/capabilities
├── /users                             # seeded users, for the client-side switcher (no auth)
└── /health
```

`POST /chat/messages` streams newline-delimited JSON rather than returning one JSON blob: a `routing` event fires immediately after classification (before the sub-agent has produced any text), so the UI can show the agent badge and a "thinking" state right away; `text-delta` events follow as the reply streams; a final `done` event carries the message once it's persisted. The assistant message is written to the database exactly once, after the stream completes.

## Error handling

Domain services throw typed errors (`NotFoundError`, `ValidationError`, `ExternalServiceError`, `RateLimitError`) that carry their own HTTP status. One `app.onError` middleware maps them to a response; controllers never contain `try/catch`. The one exception is tool execution: a tool that throws is caught inside the agent layer (`createServiceTool`) and returned to the model as a result describing the failure, so the agent can say "I couldn't find that order number" in prose instead of the stream dying mid-sentence.

## Testing

The backend test suite runs against the real seeded Supabase database and the real Anthropic API — no mocks. Router classification is tested directly (`classifyIntent`) rather than through a full conversation, which is the point of keeping routing a separate, structured, non-streaming call. Domain services are tested against known seeded rows (order numbers, invoice numbers); the middleware tests build a throwaway Hono app inline.

## Notes on scope

Full history and the reasoning behind each decision lives in `context/features/` (one file per Build Order phase). A few worth calling out:

- **Streaming**: chat responses buffer must-ship first (Phase 4), then upgraded to real token streaming (Phase 5) once the baseline was solid — matches project-spec.md's own priority list, which puts "streaming responses" below the must-ship bar.
- **Deployment**: explicitly out of scope per project-spec.md, despite appearing in project-overview.md's bonus table.
- **Rate limiting**: a simple in-memory fixed-window limiter on `POST /chat/messages` (20 req/min), the one endpoint that costs real LLM calls. Single-process only by design — a multi-instance deployment would need a shared store.
