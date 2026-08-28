# Contributing to BugForge

Thank you for improving BugForge. The project values clear issue workflows, server-enforced authorization, accessible interaction design, and honest operational documentation.

## Before changing code

Read the root [`README.md`](README.md), [`docs/architecture.md`](docs/architecture.md), and the relevant feature documentation. Confirm whether a change affects the Supabase Auth boundary, PostgreSQL schema, private Storage, Vercel routing, or the managed rollback runtime. Add the work to `todo.md` before implementation when the change is a new feature, bug fix, or operational task.

## Implementation conventions

Use the typed tRPC client for browser requests and keep reusable database access in `server/db.ts`. Define or extend procedures in `server/routers.ts` and validate inputs with Zod. Every protected procedure must resolve the project/workspace scope and role on the server. UI visibility is not authorization.

For schema changes, update `drizzle/schema.ts`, generate SQL with `pnpm db:generate`, review the migration, apply it through the approved database workflow, and verify the live schema. Never use a destructive migration as a shortcut and never alter the separate Lock Note project.

For files, use the server-side Storage adapter. Keep the bucket private, store object references rather than bytes in PostgreSQL, and return signed URLs only after authorization. Do not add service-role values to browser code or `VITE_*` variables.

## Testing requirements

Run `pnpm check`, `pnpm test`, `pnpm build:vercel`, and `pnpm build:managed` for a release-significant change. Add focused Vitest coverage for new authorization, persistence, storage, and human-review behavior. Use Playwright only with a safe authenticated test account and avoid mutating production data for convenience.

## UI and accessibility

Preserve keyboard access, visible focus states, readable contrast, responsive layouts, and `prefers-reduced-motion` behavior. Reuse existing components where they match the feature. Do not introduce fake testimonials, ratings, reviews, or user-generated content. Keep animation purposeful and avoid using motion to hide loading or error states.

## Documentation and pull requests

Explain the user problem, implementation boundary, data impact, authorization model, tests, and rollback consideration. Update the relevant Markdown guide when a change modifies setup, deployment, security, authentication, storage, or user-facing behavior. Do not include secrets, access tokens, private URLs, database exports, or personal data in commits.

## Commit checklist

```text
[ ] Source and schema are synchronized
[ ] Server authorization is tested
[ ] Client states cover loading, empty, error, and success
[ ] TypeScript and Vitest pass
[ ] Vercel and managed builds pass when applicable
[ ] Documentation and todo.md are updated
[ ] git diff --check passes
[ ] No secret or personal data is included
```
