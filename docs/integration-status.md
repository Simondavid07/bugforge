# Integration status

**Last verified:** 26 August 2026

BugForge now runs against its isolated **Supabase PostgreSQL** project through the server-only `SUPABASE_DATABASE_URL` transaction-pooler secret. A fresh database-password rotation was applied to the dedicated BugForge project and its protected local, Vercel Production, and Vercel Preview credentials were updated. No credential is included in this repository, in client configuration, or in this document.

| Area | Verified state | Remaining action |
|---|---|---|
| Application database runtime | Drizzle now uses `node-postgres` and PostgreSQL table definitions. MySQL duplicate-key operations and insert-ID assumptions are replaced with explicit PostgreSQL conflict targets and `returning()` IDs. | Maintain PostgreSQL parity for future schema changes. |
| Dedicated Supabase project | **BugForge**, ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17. The migrated records match the authorized MySQL snapshot. | Keep Lock Note’s separate `clonefest-2` project untouched. |
| Server-only connectivity | The live connection test executed `SELECT 1` with the freshly rotated transaction-pooler credential. | Rotate the secret through Supabase, Manus, and Vercel together whenever the password changes. |
| Vercel database health | Deployment `AiZd2t9T1SwmSBXzbXjhrXhQV5NR` is **Ready**. Both its unique URL and `https://bugforge-lyart.vercel.app` returned HTTP 200 with `{"ok":true,"database":"connected"}` from `system.health`. | Keep the health route free of connection details and continue monitoring through platform logs. |
| Vercel API routing | The stable domain returned HTTP 200 with the expected unauthenticated `auth.me` JSON-null contract rather than a source file, 404, or function error. | Preserve the API catch-all rewrite and original-path restoration when editing routing. |
| Authentication | The external login start reaches Manus OAuth, proving the application receives the current browser origin. The OAuth provider then rejects the callback because `bugforge-lyart.vercel.app` is not on this application’s allowed redirect-domain list. | Allowlist the Vercel domain in the Manus OAuth application, then perform an authenticated workspace regression pass. |
| Managed Forge storage and AI | The managed deployment’s Forge-backed storage and AI configuration remains protected and was not copied to Vercel. | Do not claim these capabilities work externally until a compatible, server-only external integration is configured and tested. |
| Security hardening | RLS is enabled on all BugForge public-schema tables. `public.set_updated_at()` has a fixed `pg_catalog` search path. The advisor’s remaining notices are expected informational default-deny findings because browser Data API access is intentionally unused. | Do not expose Supabase Data API or service-role credentials to the frontend. |
| GitHub source control | The private [`Simondavid07/bugforge`](https://github.com/Simondavid07/bugforge) repository remains linked to Vercel on `main`. | Push this final non-secret documentation and validation record after the secret audit. |

## Runtime validation

The final local validation suite passed TypeScript checking, the complete Vitest suite, the Vercel build, and the managed-runtime build. The focused `server/supabase.connection.test.ts` also passed after the password rotation and confirms the configured server-only URI can execute a lightweight PostgreSQL health query. The managed runtime was not replaced or deleted; it remains the verified rollback environment.

The public Vercel verification intentionally used only safe, read-only requests. `system.health` performs a `SELECT 1` and reports the coarse states `connected` or `unavailable`; it does not return a host, user, password, or driver error. The serverless runtime uses the Supabase shared transaction pooler, the documented connection mode for temporary and serverless clients.[1]

## Authentication and external-runtime boundary

The external deployment is **not yet an end-to-end authenticated BugForge release**. The exact observed OAuth failure is: `invalid redirect_uri: redirect_uri domain 'bugforge-lyart.vercel.app' not allowed for this project`. This is a provider allowlist configuration issue, not a Vercel router or database failure. The implementation correctly derives the callback from the browser origin; changing the application source to hardcode a Vercel URL would not safely resolve provider authorization.

> The managed MySQL/TiDB deployment and its data are deliberately retained as rollback infrastructure. Do not remove or overwrite them until external OAuth, authenticated workspace routes, and any required external storage/AI alternatives are verified.

## Project accent behavior

The authenticated **Orbit Labs / Web Console** workspace retains its sage `#75937E` accent after the PostgreSQL conversion. The server validates the hex value and project-admin membership before persisting an update.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase: Connect to your database"
