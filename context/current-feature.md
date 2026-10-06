# Current Feature

<!-- Feature Name -->

Deterministic unit tests in CI

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Provide a credential-free unit-test lane for pull requests
- Keep integration tests against real Supabase and Anthropic services available separately
- Run unit tests alongside typechecking and production builds in CI

## Notes

<!-- Any extra notes -->

- The unit lane covers password hashing, typed error mapping, and rate limiting.
- The complete `pnpm test` suite remains unchanged because it intentionally exercises live services.
- Branch: `chore/ci-unit-tests`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Phase 1 — Foundation. See `context/features/phase-1-foundation.md`.
- Phase 2 — Data Layer. See `context/features/phase-2-data-layer.md`.
- Phase 3 — Agents. See `context/features/phase-3-agents.md`.
- Phase 4 — API & UI. See `context/features/phase-4-api-ui.md`.
- Phase 5 — Bonuses. See `context/features/phase-5-bonuses.md`.
- Deployment prep (Railway + Vercel).
- Authentication. See `context/features/authentication.md`.
- Deterministic unit-test lane added to CI.
