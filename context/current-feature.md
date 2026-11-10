# Current Feature

<!-- Feature Name -->

Uniform login verification timing

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Run scrypt verification for both existing and unknown email addresses
- Keep the same user-safe error for unknown-email and wrong-password attempts
- Protect the helper behavior with deterministic unit tests

## Notes

<!-- Any extra notes -->

- Unknown users are checked against a fixed, valid dummy scrypt hash.
- The dummy result can never authenticate because the helper also requires a stored user hash.
- Branch: `fix/uniform-login-verification`

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
- Safe chat-stream error boundary with regression coverage.
- Uniform scrypt verification for unknown-email and wrong-password login attempts.
