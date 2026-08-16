# Current Feature

<!-- Feature Name -->

Phase 5 — Bonuses (rate limiting, live token streaming)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

Per the Build Order and Bonus Points table in project-overview.md, scoped down after review:

- Rate limiting on the chat send endpoint (the one that costs real LLM API calls)
- Real token streaming for chat responses, replacing Phase 4's buffered JSON response — completes the reasoning/typing-indicator bonus with a live routing badge and token-by-token text

**Explicitly skipped, with reasons:**

- Deployment — project-spec.md's "Explicitly out of scope" list overrides project-overview.md's bonus table on this point
- Context compaction, useworkflow.dev — both labeled "Stretch" (lowest priority), skipped given time already spent

## Notes

<!-- Any extra notes -->

- Full details in `context/features/phase-5-bonuses.md`.
- Branch: `feature/phase-5-bonuses`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Phase 1 — Foundation. See `context/features/phase-1-foundation.md`.
- Phase 2 — Data Layer. See `context/features/phase-2-data-layer.md`.
- Phase 3 — Agents. See `context/features/phase-3-agents.md`.
- Phase 4 — API & UI. See `context/features/phase-4-api-ui.md`.
- Phase 5 — Bonuses. See `context/features/phase-5-bonuses.md`.
