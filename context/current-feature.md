# Current Feature

<!-- Feature Name -->

Authentication (custom email/password + sessions, seeded users only)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Only the pre-existing seeded users can log in — no public signup
- User-switcher dropdown removed; the session determines the current user
- `userId` derived from the session everywhere, never trusted from client input
- Ownership verification on conversation read/delete (currently missing)

## Notes

<!-- Any extra notes -->

- Full details in `context/features/authentication.md`.
- This reverses project-spec.md's explicit "no auth" scope decision — the user's own call, made after the graded build was complete.
- Branch: `feature/authentication`

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
