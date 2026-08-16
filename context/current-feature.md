# Current Feature

<!-- Feature Name -->

Phase 1 — Foundation (monorepo scaffold, Hono RPC, Prisma schema, seed script)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Per the Build Order in project-overview.md:

- Turborepo scaffold with `backend` + `frontend` pnpm workspaces
- `/health` route round-tripping through Hono RPC with types flowing (chained `.route()`, `AppType` export)
- Prisma schema (full data model from project-overview.md) wired to Supabase via `DATABASE_URL`/`DIRECT_URL`
- Seed script covering all seed requirements (users, orders spanning every status, shipments, invoices, refunds, prior conversations)
- Backend `exports` map + frontend `workspace:*` dependency wired per coding-standards.md
- AI SDK provider set to Anthropic; model ids read from env vars (no hardcoded strings)

## Notes

<!-- Any extra notes -->

- `project-spec.md` (present in context/, not yet linked from CLAUDE.md) is treated as authoritative for anything project-overview.md leaves ambiguous — it resolves the Drizzle/Prisma inconsistency in project-overview.md's Phase 1 bullet (Prisma is correct) and adds UI/UX + scope-priority detail.
- User will supply real `DATABASE_URL`/`DIRECT_URL` before `prisma migrate dev` / seed / browser test can run.
- Branch: `feature/phase-1-foundation`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Phase 1 — Foundation: Turborepo/pnpm monorepo scaffolded, Hono backend with `/health` round-tripping through Hono RPC (chained `.route()`, `AppType`), React 19 + Vite frontend with Tailwind v4 and `hc<AppType>` client, full Prisma schema migrated to Supabase, seed script verified against live DB (3 users, 8 orders across all statuses, 4 shipments incl. 1 exception, 6 invoices across all statuses, 3 refunds incl. 2 mid-flight, 3 conversations with messages). Build and typecheck pass across both workspaces.
