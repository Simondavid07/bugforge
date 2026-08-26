# Production readiness

**Verified:** 26 August 2026

BugForge has completed its **Supabase PostgreSQL runtime conversion** locally. The existing managed deployment and managed MySQL/TiDB database are deliberately preserved as rollback infrastructure. Vercel is not yet a live BugForge endpoint because its first deployment served the bundled Express output instead of the application UI and remains paused.

| Check | Result |
|---|---|
| TypeScript | Passed after PostgreSQL schema, Drizzle driver, conflict-target, and `returning()` conversion. |
| Regression suite | Passed: **18 Vitest tests**, including authorization, preferences, saved-search routing, accent behavior, and live Supabase `SELECT 1` validation. |
| Production build | Passed. Vite produced the SPA assets and the current managed Express build completed successfully. |
| Supabase database | Dedicated project `zznvjtdspjampmztrunx` connects successfully through the server-only transaction pooler. |
| Authenticated development smoke check | Passed after restarting with the Supabase runtime: the signed-in user, Orbit Labs / Web Console workspace, preferences, and empty Issue Explorer data all returned from PostgreSQL. |
| Supabase security advisor | All previous RLS-disabled errors are resolved. Informational default-deny “RLS enabled, no policy” notices remain by design because browser-side Data API access is not used. |
| Vercel production URL | **Not ready.** The existing URL is paused and must not be treated as a working deployment. |

## Database runtime and security model

The runtime uses `drizzle-orm/node-postgres` with the Supabase Shared Pooler transaction endpoint. The connection is server-only and the pool is constrained for serverless execution. PostgreSQL `onConflictDoUpdate` replaces MySQL `onDuplicateKeyUpdate`, while `.returning({ id })` replaces MySQL `insertId` reads.

The tables remain in the Supabase `public` schema but all have RLS enabled. Because BugForge continues to enforce authorization through its server-side Manus OAuth and tRPC layer, no permissive public RLS policy was created. This default-deny posture blocks direct Data API reads and writes unless a future design explicitly adds narrowly scoped policies.

## Bundle audit

Route-level loading continues to defer individual page modules, the command palette, and the personalization panel. The entry JavaScript bundle is approximately **740 kB** uncompressed and **215 kB** gzip. The remaining shared-chunk warning is documented and accepted until field measurements justify further splitting.

## External deployment boundary

Before resuming Vercel, BugForge needs an explicit Vercel serverless API adapter for tRPC, OAuth callback compatibility, managed storage handling, static SPA routing, and secure environment-variable configuration. This work is intentionally separate from the database migration so the verified managed application remains an available rollback path.
