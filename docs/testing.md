# Testing and verification

BugForge uses TypeScript for static validation, Vitest for server and component behavior, and Playwright for authenticated end-to-end flows when a test session is configured.

## Local checks

```bash
pnpm check
pnpm test
pnpm build:vercel
pnpm build:managed
```

The type check must complete without errors. The full Vitest suite should pass before a checkpoint. Both builds matter because the server modules are shared by the external Vercel function and the managed rollback runtime.

## Coverage areas

| Area          | What is covered                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Identity      | Supabase-authenticated user resolution, logout behavior, provider-profile synchronization, and browser-safe avatar hydration.         |
| Authorization | Project scope, role thresholds, upload permissions, personalization permissions, issue operations, and workspace deletion safeguards. |
| Persistence   | Preferences, project accents, navigation order, saved searches, issue relationships, and activity history.                            |
| Storage       | Private bucket inventory, upload/sign/read/delete round-trip, marker resolution, legacy fallback, and short-lived signed reads.       |
| UI contracts  | Personalization controls, project accent application, command navigation, and responsive route states.                                |
| Deployment    | Vercel build, managed build, serverless API routing, system health, PostgreSQL connection, and authenticated browser navigation.      |

## Safe production smoke test

Use the public health endpoint for a non-destructive first check. It should return a bounded success object and no secret. Then sign in through GitHub, open Overview, Issues, Workboard, Insights, and Inbox, and confirm the active workspace loads. If Storage must be tested, use the signed-in owner’s avatar control with a tiny harmless image and verify that the returned image renders; do not create disposable customer issues unless cleanup is planned.

Do not treat a screenshot as a substitute for tests. Do not treat an empty database as proof that issue lifecycle behavior works. Add focused tests for every new authorization rule and every persistence path.

## Regression expectations

A release is not ready if a client-only permission check passes while the server procedure is unguarded, if a private Storage marker reaches the browser without signed hydration, if a managed build fails after a Vercel-only change, or if a recommendation can be applied without explicit human review.

## References

[1]: https://vitest.dev/guide/ "Vitest documentation"
[2]: https://playwright.dev/docs/intro "Playwright documentation"
[3]: https://www.typescriptlang.org/docs/ "TypeScript documentation"
