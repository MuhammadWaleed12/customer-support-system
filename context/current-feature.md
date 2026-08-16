# Current Feature

<!-- Feature Name -->

Phase 2 — Data Layer (domain services, typed errors, error middleware, unit tests)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Per the Build Order in project-overview.md:

- Domain services for order, billing, conversation — services return plain objects (Decimal → number at the boundary), never raw Prisma models
- Typed errors in `lib/errors.ts`: `NotFoundError`, `ValidationError`, `ExternalServiceError`
- One error middleware mapping error class → HTTP status, registered via `app.onError`
- Unit tests against seeded data — no AI involved yet

## Notes

<!-- Any extra notes -->

- No REST routes for order/billing in this phase — project-overview.md's API Routes section only lists `/chat`, `/agents`, `/health`. Order/billing services exist to be shared by Phase 3 tools and are tested directly, not through HTTP.
- Conversation service builds out create/read/delete so Phase 4 chat routes can consume it directly.
- Tests run against the live seeded Supabase DB (read-heavy; any create/delete tests clean up after themselves) using vitest.
- Branch: `feature/phase-2-data-layer`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Phase 1 — Foundation: Turborepo/pnpm monorepo scaffolded, Hono backend with `/health` round-tripping through Hono RPC (chained `.route()`, `AppType`), React 19 + Vite frontend with Tailwind v4 and `hc<AppType>` client, full Prisma schema migrated to Supabase, seed script verified against live DB (3 users, 8 orders across all statuses, 4 shipments incl. 1 exception, 6 invoices across all statuses, 3 refunds incl. 2 mid-flight, 3 conversations with messages). Build and typecheck pass across both workspaces.
- Phase 2 — Data Layer: typed errors (`NotFoundError`, `ValidationError`, `ExternalServiceError`) and one `app.onError` middleware mapping them to HTTP status; `orderService`, `billingService`, `conversationService` returning plain objects (Decimal → number at the boundary); vitest added to backend, 21 unit tests passing against the live seeded Supabase data (services + error middleware). Build and typecheck pass across both workspaces.
