# Production readiness

**Verified:** 27 August 2026

BugForge has completed its **Supabase PostgreSQL runtime conversion** and has a ready Vercel Production deployment with live database health and authenticated GitHub login. The existing managed deployment and managed MySQL/TiDB database are deliberately preserved as rollback infrastructure. The external deployment uses GitHub OAuth through Supabase Auth; it no longer depends on Manus end-user OAuth for login.

| Check | Result |
|---|---|
| TypeScript | Passed after the PostgreSQL schema, Drizzle driver, conflict-target, and `returning()` conversion. |
| Regression suite | The complete Vitest suite passed, including authorization, preferences, saved-search routing, accent behavior, serverless route recovery, system-health behavior, the Supabase Storage round-trip, and the live Supabase connection test. |
| Builds | `pnpm build:vercel` and `pnpm build:managed` both passed. The latter confirms the managed rollback artifact remains buildable. |
| Supabase database | The isolated project `zznvjtdspjampmztrunx` connects through the server-only shared transaction pooler after the latest password rotation. |
| Vercel production | Deployment `dpl_2ahhu3wfLofHhhKGEZcoTo8zw4Jn`, source commit `967e462`, is **Ready**. The stable domain remains [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app), and its safe health probe continues to succeed. |
| Vercel tRPC boundary | `https://bugforge-lyart.vercel.app/api/trpc/auth.me` returned HTTP 200 and the expected unauthenticated JSON-null result. |
| Supabase security advisor | RLS-disabled errors are resolved. Informational default-deny “RLS enabled, no policy” notices remain by design because browser-side Data API access is not used. |
| External OAuth | **Verified.** The live Vercel browser session is signed in through GitHub OAuth with Supabase Auth and renders the authorized Orbit Labs / Web Console workspace. |
| Private Supabase Storage | **Verified.** Vercel Production and Preview hold the protected server-only Storage configuration. A real authenticated avatar upload persisted a private object marker and rendered through a 15-minute signed URL. |
| External AI | **Intentionally unchanged.** The existing managed AI recommendation path retains its strict JSON output and human-review workflow. No Vercel AI Gateway configuration, funding, credential, or live external model request was added. |

## Database runtime and security model

The runtime uses `drizzle-orm/node-postgres` with the Supabase shared transaction endpoint. The connection is server-only and the application pool is constrained for serverless execution. PostgreSQL `onConflictDoUpdate` replaces MySQL `onDuplicateKeyUpdate`, while `.returning({ id })` replaces MySQL `insertId` reads. Transaction pooler connections are appropriate for transient/serverless clients, provided the application does not rely on session-level prepared-statement behavior.[1]

The tables remain in the Supabase `public` schema but all have RLS enabled. BugForge authenticates tRPC requests by validating the browser’s Supabase Auth bearer token server-side and continues to enforce workspace and project authorization in the application layer. No permissive browser Data API policy was created, retaining a default-deny posture for direct table access unless a future design explicitly adds narrowly scoped policies.[2]

The `bugforge-private` Storage bucket follows the same defense-in-depth model. Browser clients receive only short-lived signed URLs after the application’s own role checks; they never receive the service-role credential, a public bucket URL, or a direct Storage policy. The real upload/sign/read/delete test and an authenticated production avatar upload both passed. Supabase documents signed URLs as the appropriate temporary read mechanism for private objects.[3]

## Vercel architecture and current boundary

Vercel serves Vite’s static output and dispatches `/api/*` through `api/[...path].ts`, which creates the shared Express application without starting a long-lived listener. The explicit API and SPA rewrites preserve tRPC, the public Supabase Auth PKCE callback route `/auth/callback`, and deep links, while the legacy `/manus-storage/*` compatibility route remains server-side. Vercel automatically recognizes Node functions in the project’s `api` directory; the implementation does not use an invalid explicit Node runtime override.[3] [4]

The production URL is [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app). A fresh browser review observed the live signed-in `Simondavid07` workspace, the `WEB — Web Console` project, and a Supabase Auth session marker without exposing a token value. The GitHub OAuth App callback is correctly registered with Supabase Auth, and Supabase’s allowlisted post-login URL is `https://bugforge-lyart.vercel.app/auth/callback`.[5] [6]

The existing AI recommendation implementation remains available through the managed runtime and retains its strict JSON Schema output plus the explicit apply/dismiss human-review boundary. The external Vercel configuration deliberately does not add a model provider, a long-lived provider key, model-request funding, or any new billing dependency.

## Rollback and cutover policy

The managed MySQL/TiDB deployment remains the rollback path and must be retained until the authenticated Vercel flow continues to succeed through normal use and core issue-management routes have been reviewed at desktop and mobile widths. If the external runtime regresses before that cutover decision, use the managed deployment rather than attempting to reverse the Supabase migration or delete the database. External AI activation is a separate, owner-controlled decision rather than a readiness prerequisite.

## Bundle audit

Route-level loading continues to defer individual page modules, the command palette, and the personalization panel. The entry JavaScript bundle is approximately **961 kB** uncompressed and **274 kB** gzip after adding the Supabase Auth client. The shared-chunk warning is documented and accepted until field measurements justify further splitting.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase: Connect to your database"
[2]: https://supabase.com/docs/guides/api/securing-your-api "Supabase: Securing your API"
[3]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage: Create signed URL"
[4]: https://vercel.com/kb/guide/using-express-with-vercel "Vercel: Using Express.js with Vercel"
[5]: https://vercel.com/docs/functions/runtimes/node-js "Vercel: Node.js runtime"
[6]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[7]: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession "Supabase JavaScript: exchangeCodeForSession"
