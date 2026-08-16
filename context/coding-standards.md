# Coding Standards
 
## TypeScript
 
- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- `moduleResolution: "bundler"` in both workspaces, or the `exports` map between them will not resolve
## Monorepo
 
- Two workspaces at root: `backend/` and `frontend/`
- No shared `packages/` directory - Hono RPC infers types directly from route definitions, so a shared types package has nothing left to hold
- `backend/package.json` exposes `"exports": { "./app": "./src/app.ts" }`
- `frontend` depends on it via `"backend": "workspace:*"`
- Cross-workspace imports must use `import type` so no server code enters the browser bundle
- Never import across workspaces with relative paths that climb out of the folder
## Hono
 
- Controller-Service pattern: routes are thin, services hold logic
- Route handlers parse input, call one service method, shape the response - nothing else
- No business logic, no Prisma calls, and no `try/catch` in a route handler
- Validate every input with `zValidator` from `@hono/zod-validator`
- Group routes by domain in `src/routes/`, one file per domain
**CRITICAL**: Routes must be registered as a single chained `.route()` expression and `AppType` derived from that chain:
 
```ts
const routes = app
  .route('/api/chat', chatRoutes)
  .route('/api/agents', agentRoutes)
  .route('/health', healthRoutes)
 
export type AppType = typeof routes
```
 
Separate `app.route(...)` statements with `export type AppType = typeof app` produces an empty type. RPC silently degrades to `any` and the entire type-safety bonus is lost with no error to warn you.
 
## React
 
- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks
- No data fetching inside components - use a hook that wraps the RPC client
## Tailwind CSS v4
 
**CRITICAL**: We are using Tailwind CSS v4, which uses CSS-based configuration.
 
- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration must be done in CSS using the `@theme` directive in `src/index.css`
- Use CSS custom properties for colors, spacing, etc.
- No JavaScript-based config allowed
Example v4 configuration:
 
```css
@import "tailwindcss";
 
@theme {
  --color-agent-support: #3b82f6;
  --color-agent-order: #f97316;
  --color-agent-billing: #10b981;
}
```
 
## File Organization
 
**Backend**
 
- Routes: `backend/src/routes/[domain].routes.ts`
- Controllers: `backend/src/controllers/[domain].controller.ts`
- Services: `backend/src/services/[domain].service.ts`
- Agents: `backend/src/agents/[name].agent.ts`
- Tools: `backend/src/agents/tools/[domain].tools.ts`
- Prompts: `backend/src/agents/prompts/[name].prompt.ts`
- Middleware: `backend/src/middleware/[name].middleware.ts`
- Errors: `backend/src/lib/errors.ts`
- Prisma client singleton: `backend/src/db/client.ts`
**Frontend**
 
- Components: `frontend/src/components/[feature]/ComponentName.tsx`
- Hooks: `frontend/src/hooks/useThing.ts`
- RPC client: `frontend/src/lib/client.ts`
- Utils: `frontend/src/lib/[utility].ts`
## Naming
 
- Components: PascalCase (`MessageBubble.tsx`)
- Files: match component name, or kebab-case with a `.role.ts` suffix on the backend
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)
- Tools: camelCase verb phrases (`fetchOrderDetails`, not `orderTool`)
- Agent types: lowercase string literals matching the DB enum (`'order'`, not `'Order'`)
## Styling
 
- Tailwind CSS for all styling
- No inline styles
- Dark mode first, light mode as option
- Agent colors come from the theme, never hardcoded per-component
## Database
 
- Use Prisma ORM for all database operations
- Always use `prisma migrate dev` for schema changes (not `db push`)
- Run `prisma migrate status` before committing to verify migrations are in sync
- Production deployments must run `prisma migrate deploy` before the app starts
- `prisma generate` runs as a `postinstall` in `backend`
- One PrismaClient instance, exported as a singleton - never construct it inside a service
**CRITICAL**: Prisma `Decimal` fields are not JS numbers. Convert them at the service boundary with `.toNumber()` before the value reaches a tool result, an agent prompt, or an RPC response. A raw Decimal serialises into an object that the model misreads and the client cannot use.
 
Never return raw Prisma models from a route handler. Map to a plain object in the service so the type crossing into `AppType` is honestly JSON-serialisable.
 
## Agents and Tools
 
- One prompt per agent, in its own file - never inline a multi-line prompt in agent code
- Sub-agents receive conversation context as an argument and hold no state
- A sub-agent may only be given tools from its own domain
- The router uses `generateObject` with a Zod schema, no tools, no streaming
- Sub-agents use `streamText`
**Tools contain no business logic.** A tool is a description, a Zod input schema, and one call into a service:
 
```ts
export const fetchOrderDetails = tool({
  description: 'Fetch full details for an order by its order number',
  inputSchema: z.object({ orderNumber: z.string() }),
  execute: ({ orderNumber }) => orderService.getByOrderNumber(orderNumber),
})
```
 
If a tool body needs a conditional, a loop, or a second query, that logic belongs in the service.
 
- Tools call the same services the REST routes call - never write a second data-access path
- Tool descriptions are written for the model, not for a developer: state when to use it, not how it works
- Model identifiers come from env vars, never hardcoded
## Data Fetching
 
- Frontend calls the backend only through the typed RPC client (`hc<AppType>`)
- No raw `fetch` to API routes, no manually written response types
- Wrap RPC calls in hooks; components do not call the client directly
- Validate all inputs with Zod on the backend
## Error Handling
 
- Define typed errors in `lib/errors.ts`: `NotFoundError`, `ValidationError`, `ExternalServiceError`
- Services throw them; they carry a status code and a user-safe message
- One error middleware maps error class to HTTP status - registered with `app.onError`
- Controllers never contain `try/catch`
- Frontend checks `res.ok` before parsing and surfaces the message via toast
**Tool failures are the exception.** A tool that throws must be caught inside the agent layer and returned to the model as a tool result describing the failure, so the agent can say "I couldn't find that order number" in prose. An uncaught tool error kills the stream mid-sentence.
 
## Code Quality
 
- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
- No abstraction added before there are two concrete callers for it
 