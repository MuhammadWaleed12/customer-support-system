# Phase 2 — Data Layer

## Status

Completed

## Goals

Per the Build Order in project-overview.md:

- Domain services for order, billing, conversation — services return plain objects (Decimal → number at the boundary), never raw Prisma models
- Typed errors in `lib/errors.ts`: `NotFoundError`, `ValidationError`, `ExternalServiceError`
- One error middleware mapping error class → HTTP status, registered via `app.onError`
- Unit tests against seeded data — no AI involved yet

## What shipped

- `lib/errors.ts`: `NotFoundError` (404), `ValidationError` (400), `ExternalServiceError` (502)
- `middleware/error.middleware.ts` registered via `app.onError`, mapping each error class to its HTTP status
- `orderService` (`getByOrderNumber`, `getDeliveryStatus`), `billingService` (`getInvoiceByNumber`, `getRefundStatus`), `conversationService` (`listByUser`, `getById`, `getRecentMessages`, `create`, `addMessage`, `remove`, `searchHistory`) — all returning plain objects, `Decimal` converted with `.toNumber()` at the boundary
- vitest added to backend; 21 unit tests passing against the live seeded Supabase data (services + error middleware)
- Build and typecheck pass clean across both workspaces

## Notes

- No REST routes for order/billing in this phase — project-overview.md's API Routes section only lists `/chat`, `/agents`, `/health`. Order/billing services exist to be shared by Phase 3 tools and were tested directly, not through HTTP.
- Conversation service was built out fully (create/read/delete) so Phase 4 chat routes could consume it directly without revisiting the service layer.
- Branch: `feature/phase-2-data-layer`, merged to `main` and pushed.
