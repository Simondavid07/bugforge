# Production readiness

**Verified:** 26 August 2026

BugForge has completed its **Supabase PostgreSQL runtime conversion** and now has a ready Vercel Production deployment with a live database health response. The existing managed deployment and managed MySQL/TiDB database are deliberately preserved as rollback infrastructure. The external deployment is operational for static/API routing and PostgreSQL connectivity, but it is not yet an end-to-end authenticated product release because Manus OAuth rejects the Vercel callback domain.

| Check | Result |
|---|---|
| TypeScript | Passed after the PostgreSQL schema, Drizzle driver, conflict-target, and `returning()` conversion. |
| Regression suite | Passed, including authorization, preferences, saved-search routing, accent behavior, serverless route recovery, system-health behavior, and the live Supabase connection test. |
| Builds | `pnpm build:vercel` and `pnpm build:managed` both passed. The latter confirms the managed rollback artifact remains buildable. |
| Supabase database | The isolated project `zznvjtdspjampmztrunx` connects through the server-only shared transaction pooler after the latest password rotation. |
| Vercel production | Deployment `AiZd2t9T1SwmSBXzbXjhrXhQV5NR` is **Ready**. Both the assigned stable domain and the unique deployment URL returned HTTP 200 and `{ok:true,database:"connected"}` from the public, safe health procedure. |
| Vercel tRPC boundary | `https://bugforge-lyart.vercel.app/api/trpc/auth.me` returned HTTP 200 and the expected unauthenticated JSON-null result. |
| Supabase security advisor | RLS-disabled errors are resolved. Informational default-deny “RLS enabled, no policy” notices remain by design because browser-side Data API access is not used. |
| External OAuth | **Blocked by provider configuration.** Manus OAuth reports that `bugforge-lyart.vercel.app` is not an allowed redirect domain when sign-in is attempted. |
| External Forge features | **Not verified.** Managed Forge storage and AI credentials were intentionally not copied to Vercel. |

## Database runtime and security model

The runtime uses `drizzle-orm/node-postgres` with the Supabase shared transaction endpoint. The connection is server-only and the application pool is constrained for serverless execution. PostgreSQL `onConflictDoUpdate` replaces MySQL `onDuplicateKeyUpdate`, while `.returning({ id })` replaces MySQL `insertId` reads. Transaction pooler connections are appropriate for transient/serverless clients, provided the application does not rely on session-level prepared-statement behavior.[1]

The tables remain in the Supabase `public` schema but all have RLS enabled. Because BugForge continues to enforce authorization through its server-side Manus OAuth and tRPC layer, no permissive public RLS policy was created. This default-deny posture blocks direct Data API reads and writes unless a future design explicitly adds narrowly scoped policies.[2]

## Vercel architecture and current boundary

Vercel serves Vite’s static output and dispatches `/api/*` through `api/[...path].ts`, which creates the shared Express application without starting a long-lived listener. The explicit API and SPA rewrites preserve tRPC, OAuth callback, and deep-link routing, while the legacy `/manus-storage/*` compatibility route remains server-side. Vercel automatically recognizes Node functions in the project’s `api` directory; the implementation does not use an invalid explicit Node runtime override.[3] [4]

The production URL is [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app). A live browser login attempt reaches Manus OAuth but is rejected with the exact message: `invalid redirect_uri: redirect_uri domain 'bugforge-lyart.vercel.app' not allowed for this project`. Until the OAuth application allowlists this domain, browser navigation will redirect to a login page that cannot complete, so authenticated workspace and mobile UI checks are intentionally not reported as passed.

## Rollback and cutover policy

The managed MySQL/TiDB deployment remains the rollback path and must be retained until the Vercel domain is allowlisted, an authenticated workspace flow succeeds on the Vercel origin, core issue-management routes have been reviewed at desktop and mobile widths, and any desired external replacements for Forge storage/AI have been tested. If the external runtime regresses before that cutover decision, use the managed deployment rather than attempting to reverse the Supabase migration or delete the database.

## Bundle audit

Route-level loading continues to defer individual page modules, the command palette, and the personalization panel. The entry JavaScript bundle remains approximately **740 kB** uncompressed and **215 kB** gzip. The shared-chunk warning is documented and accepted until field measurements justify further splitting.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase: Connect to your database"
[2]: https://supabase.com/docs/guides/api/securing-your-api "Supabase: Securing your API"
[3]: https://vercel.com/kb/guide/using-express-with-vercel "Vercel: Using Express.js with Vercel"
[4]: https://vercel.com/docs/functions/runtimes/node-js "Vercel: Node.js runtime"
