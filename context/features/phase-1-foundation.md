# Phase 1 — Foundation

## Status

Completed

## Goals

Per the Build Order in project-overview.md:

- Turborepo scaffold with `backend` + `frontend` pnpm workspaces
- `/health` route round-tripping through Hono RPC with types flowing (chained `.route()`, `AppType` export)
- Prisma schema (full data model from project-overview.md) wired to Supabase via `DATABASE_URL`/`DIRECT_URL`
- Seed script covering all seed requirements
- Backend `exports` map + frontend `workspace:*` dependency wired per coding-standards.md
- AI SDK provider set to Anthropic; model ids read from env vars (no hardcoded strings)

## What shipped

- Turborepo + pnpm workspaces (`backend`, `frontend`) with root `package.json`/`pnpm-workspace.yaml`/`turbo.json`
- Hono backend: chained `.route()` → `AppType`, `/health` endpoint, CORS for the Vite dev origin
- React 19 + Vite frontend: Tailwind v4 (`@theme` config, no config file), `hc<AppType>` RPC client, `useHealthCheck` hook (no fetching inside components)
- Full Prisma schema from project-overview.md, migrated to Supabase (`DATABASE_URL`/`DIRECT_URL`)
- Seed script verified against the live DB: 3 users, 8 orders across all 5 statuses, 4 shipments (incl. 1 `exception`), 6 invoices across all 4 statuses, 3 refunds (2 mid-flight), 3 conversations with messages
- `backend/.env.example` with `ANTHROPIC_API_KEY`, `ROUTER_MODEL`, `AGENT_MODEL`
- Build and typecheck pass clean across both workspaces

## Notes

- `project-spec.md` (present in context/, not linked from CLAUDE.md) was treated as authoritative for anything project-overview.md left ambiguous — it resolves the Drizzle/Prisma inconsistency in project-overview.md's Phase 1 bullet (Prisma is correct) and adds UI/UX + scope-priority detail.
- Branch: `feature/phase-1-foundation`, merged to `main` and pushed.
