# Integration status

**Last verified:** 26 August 2026

BugForge’s application code now uses the dedicated **Supabase PostgreSQL** project through the server-only `SUPABASE_DATABASE_URL` transaction-pooler secret. The prior managed MySQL/TiDB runtime and deployment have not been deleted or overwritten; they remain the rollback path until an external deployment is functionally verified.

| Area | Verified state | Remaining action |
|---|---|---|
| Application database runtime | Converted to Drizzle `node-postgres` and PostgreSQL table definitions. MySQL duplicate-key operations and insert-ID assumptions are replaced with explicit PostgreSQL conflict targets and `returning()` IDs. | Complete the Vercel-specific serverless architecture and production route validation. |
| Dedicated Supabase project | **BugForge**, ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17. The migrated records match the authorized MySQL snapshot. | Keep Lock Note’s separate `clonefest-2` project untouched. |
| Server-only connectivity | The Supabase Shared Pooler transaction URI is stored only as `SUPABASE_DATABASE_URL`; the health test executes `SELECT 1` successfully. | Configure the same server-only variable in Vercel immediately before the corrected deployment is resumed. |
| Security hardening | RLS is enabled on all BugForge public-schema tables. `public.set_updated_at()` has a fixed `pg_catalog` search path. The post-hardening advisor has only expected informational notices that the default-deny RLS tables intentionally have no browser-facing policies. | Do not add Supabase Data API or service-role credentials to the frontend. If browser Data API access is later introduced, add authorization-specific RLS policies first. |
| GitHub source control | Private repository [`Simondavid07/bugforge`](https://github.com/Simondavid07/bugforge) uses `main`; the managed artifact remote remains separate. | Push the reviewed non-secret conversion and deployment changes after final validation. |

## Runtime validation

The converted backend passed TypeScript validation, all 18 Vitest tests, and the live PostgreSQL health test. After restarting the development runtime, authenticated `auth.me`, `workspace.mine`, `personalization.get`, and empty Issue Explorer queries returned the migrated **Orbit Labs / Web Console** data from Supabase. The database connection uses Supabase’s IPv4-compatible transaction pooler, which is the documented connection mode for temporary/serverless application clients.

## Performance advisor notes

The Supabase performance advisor currently reports informational “unused index” notices for several empty or low-traffic BugForge tables. Those indexes implement the app’s expected project, issue, notification, and relationship lookup patterns, so they are intentionally retained rather than removed before real workload evidence exists.

## Project accent behavior

The project accent selector remains admin-authorized. The authenticated **Orbit Labs / Web Console** workspace retains its sage `#75937E` accent after the runtime conversion. The server validates the hex value and project-admin membership before persisting an update.
