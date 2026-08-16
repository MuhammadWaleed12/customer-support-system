# Authentication

## Status

Completed

## Goals

Add real authentication, reversing project-spec.md's "no auth, a seeded user is selected client-side" simplification now that the project is moving past the graded assessment scope. Explicit requirements from the user:

- Only the pre-existing seeded users can log in — no public signup
- Once logged in, the user-switcher dropdown goes away entirely; the session determines who "you" are
- Custom email/password + DB-backed sessions (not a hosted provider, not Supabase Auth — the project's own docs are explicit that Supabase is Postgres-only)

## Why this matters beyond "adding a login form"

Before this change there was **no real access control**: any client could pass any user's UUID to `GET /api/chat/conversations?userId=...` (or as the `userId` field in `POST /api/chat/messages`) and read or write that user's data. The "no auth" design assumed a trusted client picking its own demo user from a list, not real users on a public deployment. This change:

- Derives `userId` from the session everywhere, never from client input
- Adds ownership verification to `conversationService.getById`/`remove` (previously any valid conversation id worked regardless of owner) — returns `NotFoundError`, not a 403, so it doesn't leak whether a conversation exists
- Removes `GET /api/users`, which let anyone enumerate every seeded user's name and email with zero auth

## Design

- **Sessions, not JWTs.** A `Session` row (opaque random token as the primary key, `userId`, `expiresAt`) looked up per request. Chosen over JWTs because logout needs to actually revoke access, and DB-backed lookups are consistent with how everything else in this codebase goes through a Prisma service — no JWT secret to manage.
- **Passwords hashed with Node's built-in `crypto.scrypt`**, not a new dependency (`bcryptjs`/`argon2`) — scrypt is in Node's standard library, avoids adding a package just for this, and avoids native-binding portability risk across the Railway/Vercel split.
- **Cross-origin cookies.** Frontend (Vercel) and backend (Railway) are different origins in production, so the session cookie needs `sameSite: "none"; secure: true` there — but that combination requires HTTPS and breaks local `http://localhost` dev, where `sameSite: "lax"` (non-secure) is needed instead. Set per `NODE_ENV`.
- **No signup endpoint.** Only `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. The 3 seeded users get demo passwords set directly in `seed.ts`.

## What shipped

- `Session` model (opaque token as PK, `userId`, `expiresAt`) and `User.passwordHash`, migrated via `add-auth` — existing seeded rows were wiped first to avoid an interactive migration prompt for a new required column
- `lib/password.ts`: `crypto.scrypt`-based hash/verify, no new dependency
- `services/auth.service.ts`: `login`, `logout`, `getSessionUser`
- `middleware/auth.middleware.ts`: `requireAuth`, sets `c.get('user')` via a `ContextVariableMap` module augmentation (Hono's documented pattern for typed context variables)
- `routes/auth.routes.ts` + `controllers/auth.controller.ts`: `POST /login`, `POST /logout`, `GET /me` — no signup endpoint
- All `/api/chat/*` routes now require `requireAuth`; `userId` comes from `c.get('user').id`, never from the request body/query
- `conversationService.getById`/`remove` take a `userId` and verify ownership via `findUnique({ where: { id, userId } })` (Prisma's extended `findUnique` filtering) — a mismatch and a missing conversation both resolve to the same `NotFoundError`
- Removed `GET /api/users` entirely (`user.routes.ts`, `user.controller.ts`, `user.service.ts`) — it let anyone enumerate every seeded user's name and email with zero auth, and the frontend user-switcher it backed is gone
- Frontend: `useAuth` hook, `LoginForm`, `App.tsx` gates the whole UI on session state, header shows the logged-in user's name + sign-out instead of a picker
- `lib/client.ts`'s `hc()` client now defaults `credentials: "include"`; the raw `fetch` in `useStreamMessage` (NDJSON body, can't go through the typed client) does too
- Cookie attributes (`sameSite`/`secure`) branch on `NODE_ENV` for the cross-origin production case — see README's Authentication section

## Bug found via browser testing

`useStreamMessage`'s stream-reading loop called `handlers.onDone?.(event)` without awaiting it. Since `onDone` triggers the conversation refetch, and `sending` flips back to `false` (re-enabling the input) in the `finally` block right after the read loop exits, there was a race: the UI could look "done" before the refetched conversation — including the just-streamed reply — had actually landed in state. Existed since Phase 5's original streaming work; only became visible once a browser test didn't have an incidental delay before its screenshot. Fixed by awaiting both `onRouting` and `onDone` inside the loop.

## Notes

- Branch: `feature/authentication`
