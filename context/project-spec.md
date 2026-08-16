## Support Desk AI Project Specifications
 
## Problem (Core Idea)
 
Customer support queries arrive undifferentiated — an order tracking question looks the same shape as a refund dispute or a password reset. The naive approach is one LLM holding every tool for every domain, but that degrades badly:
 
- Tool selection gets worse as the tool count grows
- The system prompt becomes a bloated compromise serving no domain well
- Billing logic leaks into order conversations
- Nothing is independently testable — one prompt means one blast radius
- You cannot explain why the model chose a tool, only that it did
Support Desk AI routes first and answers second. A router agent classifies intent, then hands off to a specialist sub-agent that only sees the tools for its own domain. Each sub-agent has a focused prompt, a small tool set, and shared access to conversation history so context survives across turns and across handoffs.
 
## Users
 
- **Customer with an order question**:
  Wants status, tracking, cancellation, or a modification. Usually references an order number or a recent purchase.
- **Customer with a billing question**:
  Wants an invoice, a refund status, or clarity on a charge. Often emotionally loaded — tone matters.
- **Customer with a general question**:
  FAQs, troubleshooting, "what did I ask you last week". Falls back to conversation history rather than transactional data.
- **Reviewer (assessment grader)**:
  Reads the repo cold and asks the author to defend it live. Needs legible layering, testable routing, and an obvious data flow.
## Features
 
Here is a list of features for Support Desk AI.
 
A. **Router Agent**
 
The parent agent. Receives every incoming message plus recent conversation context, and returns a structured classification — never prose, never a streamed response.
 
Classification contract:
 
```ts
{
  agent: 'support' | 'order' | 'billing' | 'fallback',
  confidence: number,   // 0-1
  reasoning: string     // one sentence, surfaced in the UI
}
```
 
The router is a separate `generateObject` call using a small fast model. It has no tools and does not stream. This is deliberate: routing becomes unit-testable without mocking a conversation, and the `reasoning` string is free UI material.
 
`fallback` handles greetings, off-topic messages, and anything below the confidence floor. Fallback responds directly with a short clarifying message — it does not invent an agent.
 
B. **Sub-Agents**
 
Three specialists, each with its own system prompt file and its own tool set. A sub-agent must not be able to call another domain's tools.
 
- **Support Agent** — general inquiries, FAQs, troubleshooting
- **Order Agent** — order status, tracking, modifications, cancellations
- **Billing Agent** — payment issues, refunds, invoices, subscriptions
Sub-agents stream. They receive conversation context as an argument and hold no state of their own.
 
C. **Tools**
 
Each tool is a name, a Zod input schema, and a single call into a domain service. Tools contain no business logic, no formatting, no error handling beyond letting typed errors propagate.
 
```
searchConversationHistory(userId, query)     -> support
fetchOrderDetails(orderNumber)               -> order
checkDeliveryStatus(orderNumber)             -> order
getInvoiceDetails(invoiceNumber)             -> billing
checkRefundStatus(invoiceNumber)             -> billing
```
 
Tools read real rows from Postgres. The database is seeded, not stubbed — no hardcoded fixtures inside tool bodies.
 
IMPORTANT: the services a tool calls are the same services the REST routes call. Never write a second data-access path for the agent layer.
 
D. **Conversation Context**
 
The chat service loads the last N messages (start with 10) before invoking the router, and passes them down. Both the router and the selected sub-agent see the same context window.
 
Every message is persisted — user messages on arrival, assistant replies after the stream closes — along with which agent produced it, the router's reasoning, and any tool calls made.
 
E. **Streaming and Realtime**
 
- Agent replies stream token-by-token to the client
- A typing indicator is driven by the stream lifecycle, not a timer
- Status text rotates during tool calls: "Thinking", "Checking your order", "Looking up invoice"
- The router's reasoning is emitted before the sub-agent stream begins, so the UI can show the routing decision immediately
F. **Error Handling**
 
- Domain services throw typed errors: `NotFoundError`, `ValidationError`, `ExternalServiceError`
- One error middleware maps error class to HTTP status
- Controllers contain no `try/catch`
- A tool that throws must surface as a graceful agent message, not a 500 — the agent should say "I couldn't find that order number" rather than the stream dying
## Data
 
This is a rough description of the data. Full Prisma schema lives in `project-overview.md`.
 
**USER**
 
- id, email, name, createdAt
- Relations: conversations, orders, invoices
- No auth for this build — a seeded user is selected client-side
**CONVERSATION**
 
- id, title (nullable, generated from first message), createdAt, updatedAt
- Relations: user, messages
- Indexed on (userId, updatedAt) for the conversation list query
**MESSAGE**
 
- id, role (user | assistant), content, createdAt
- agentType (router | support | order | billing | fallback, nullable for user messages)
- reasoning (nullable, router's one-liner)
- toolCalls (JSON, nullable — name and args of each tool invoked)
- Indexed on (conversationId, createdAt)
**ORDER**
 
- id, orderNumber (unique, human-readable e.g. ORD-1042), status, total, placedAt
- status: pending | processing | shipped | delivered | cancelled
- Relations: user, items, shipments, invoices
**ORDERITEM**
 
- id, productName, quantity, unitPrice
- Relations: order
**SHIPMENT**
 
- id, carrier, trackingNumber, status, estimatedDelivery
- status: label_created | in_transit | out_for_delivery | delivered | exception
- Relations: order
**INVOICE**
 
- id, invoiceNumber (unique e.g. INV-2041), amount, status, issuedAt, paidAt
- status: draft | open | paid | void
- Relations: user, order (nullable), refunds
**REFUND**
 
- id, amount, status, reason, requestedAt, completedAt
- status: requested | approved | processing | completed | rejected
- Relations: invoice
**Seed data must include:**
 
- 2–3 users
- 6–8 orders covering every status value
- Shipments for shipped and delivered orders, including one `exception`
- Invoices in mixed states, at least two refunds mid-flight
- 2–3 prior conversations with messages, so `searchConversationHistory` has real rows to find
## Tech Stack
 
- Monorepo with Turborepo + pnpm workspaces
- Two workspaces at root: `backend/` and `frontend/`
- TypeScript throughout
**Backend**
 
- Hono.dev on the Node runtime
- Controller-Service pattern: routes are thin, services hold logic
- Hono RPC for end-to-end type safety — frontend imports `AppType` from `backend/app`
- Zod for validation, shared between route schemas and tool schemas
IMPORTANT: routes must be registered as a single chained `.route()` expression and `AppType` derived from that chain. Separate `app.route(...)` statements with `export type AppType = typeof app` produces an empty type and silently degrades RPC to `any`.
 
**Database & ORM**
 
- Supabase (managed PostgreSQL)
- Prisma ORM, latest version (fetch current docs before writing schema)
- Supabase is a Postgres host and nothing more — no Supabase Auth, no RLS, no Supabase JS client
- `DATABASE_URL` (pooled, 6543) for runtime, `DIRECT_URL` (direct, 5432) for migrations, both declared in the datasource block
IMPORTANT: NEVER use `prisma db push`. Create migrations that run in dev and then in prod.
 
IMPORTANT: Prisma `Decimal` fields are not JS numbers. Convert at the service boundary before anything reaches an agent, a tool result, or an RPC response — a raw Decimal serialises into an object the model will misread and the client cannot use.
 
`prisma generate` runs as a `postinstall` in `backend` so a fresh clone typechecks.
 
**AI Integration**
 
- Vercel AI SDK
- Small fast model for router classification, stronger model for sub-agents
- Model identifiers come from env vars — never hardcoded
**Frontend**
 
- React 19 + Vite
- Tailwind CSS
- No component library required; hand-rolled is fine at this scope
## Scope and Priorities
 
Time budget is 2–3 hours. Prefer a smaller coherent system over a broad unfinished one.
 
**Must ship:**
 
- Monorepo with Hono RPC working end to end (the only bonus with a guaranteed point value)
- All three sub-agents with working tools reading seeded data
- Router with fallback
- All API routes from the spec
- Error middleware
- Basic chat UI with typing indicator
**Ship if time allows:**
 
- Streaming responses
- Reasoning display / thinking loader
- Rate limiting
- Router unit tests
**Explicitly out of scope:**
 
- Authentication
- Context compaction
- Deployment
- Multi-tenant concerns
Build order is Phase 1–5 in `project-overview.md`. Do not start agent work before `/health` round-trips through RPC with types flowing.
 
## UI/UX
 
**General**
 
- Modern, minimal, developer-focused
- Dark mode by default
- Clean typography, generous whitespace
- Subtle borders, no heavy shadows
- Reference: Linear, Vercel dashboard, Claude
- Monospace for order numbers, invoice numbers, tracking codes
**Layout**
 
- Sidebar + main content, collapsible sidebar
- Sidebar: conversation list, newest first, with a "New conversation" action at top
- Main: message thread, input pinned to the bottom
- Each assistant message carries a small agent badge showing which specialist answered
- Collapsible panel per assistant message revealing router reasoning and tool calls made
**Agent Colors & Icons**
 
- Router Color: #6b7280 (gray)
- Router Icon: GitBranch
- Support Color: #3b82f6 (blue)
- Support Icon: LifeBuoy
- Order Color: #f97316 (orange)
- Order Icon: Package
- Billing Color: #10b981 (emerald)
- Billing Icon: Receipt
- Fallback Color: #8b5cf6 (purple)
- Fallback Icon: HelpCircle
**Agent States**
 
- Idle: no indicator
- Routing: gray pulse, "Thinking"
- Delegated: agent badge appears in its color, "Support agent is typing"
- Tool call in flight: status text swaps to the tool's label, "Checking your order"
- Error: red inline notice within the message, thread stays usable
**Responsive**
 
- Desktop-first but mobile usable
- Sidebar becomes a drawer on mobile
**Micro-interactions**
 
- Smooth transitions on badge appearance
- Tokens fade in as they stream, no layout jump
- Toast notifications for conversation delete
- Loading skeletons for the conversation list
 