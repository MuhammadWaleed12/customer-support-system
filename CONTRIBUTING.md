# Contributing

Thanks for helping improve Customer Support System. Contributions that make the
assistant safer, more reliable, easier to operate, or easier to understand are
especially welcome.

## Good contribution areas

Useful changes include:

- agent routing and specialist-agent reliability
- customer-scoped order, shipment, invoice, and refund workflows
- API validation, error handling, and observability
- regression tests for tools and domain services
- frontend accessibility and support-agent workflows
- database migrations, seed-data quality, and developer tooling
- documentation that explains verified behavior or architecture

Please keep each change focused. Search existing issues and pull requests before
starting work, and open an issue first when the behavior or design needs
discussion.

## Development setup

Requirements:

- Node.js 20 or newer
- pnpm 9.15.0
- a Supabase/PostgreSQL project
- an Anthropic API key for live AI tests

Install dependencies:

```bash
corepack enable
pnpm install
```

Configure the backend:

```bash
cp backend/.env.example backend/.env
pnpm db:migrate
pnpm db:seed
```

Never commit `.env` files, database credentials, API keys, access tokens, or
customer data.

Start the development servers:

```bash
pnpm dev
```

## Validation

Run the deterministic checks before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

The continuous-integration workflow runs the type check, unit tests, and build
on Node.js 20 with the lockfile frozen.

The full integration suite is separate:

```bash
pnpm test
```

It uses a live, seeded Supabase database and the real Anthropic API. Run it only
with suitable test credentials and report whether you ran it. A pull request
must not claim the full suite passed when only the deterministic checks were
executed.

## Architecture and security invariants

The router agent classifies a request and delegates it to an order, billing, or
support specialist. REST routes and AI tools share the same domain service
layer. Changes should preserve these boundaries:

- Bind the authenticated user ID in server-side tool factories. It must never
  be supplied or overridden by the language model.
- Scope order, shipment, invoice, and refund queries to the authenticated
  customer.
- Validate untrusted input at API and tool boundaries.
- Return safe public errors; do not expose stack traces, database details, or
  internal exception messages.
- Keep business rules in domain services so REST and agent workflows behave
  consistently.
- Add a regression test for bug fixes and security-sensitive changes.

If you discover a security vulnerability, do not include exploit details or
secrets in a public issue. Contact the repository owner privately through their
GitHub profile.

## Pull requests

A useful pull request should:

1. Explain the problem and the chosen solution.
2. Link the relevant issue when one exists.
3. Stay narrowly scoped and avoid unrelated formatting or refactoring.
4. Add or update tests for changed behavior.
5. List the exact checks run and any checks that could not be run.
6. Note migrations, environment-variable changes, or compatibility impact.
7. Update documentation when user-facing behavior changes.

Use a concise, imperative title such as `fix: scope refund lookup to customer`
or `test: cover shipment authorization`. Keep commits reviewable and do not
commit generated build output.

AI-assisted contributions are welcome when the contributor has reviewed,
understood, and tested the result. Disclose material AI assistance in the pull
request and remain responsible for the code, tests, licensing, and accuracy.
