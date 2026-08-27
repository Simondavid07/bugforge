# Integration status

**Last verified:** 27 August 2026

BugForge now runs against its isolated **Supabase PostgreSQL** project through the server-only `SUPABASE_DATABASE_URL` transaction-pooler secret. A fresh database-password rotation was applied to the dedicated BugForge project and its protected local, Vercel Production, and Vercel Preview credentials were updated. No credential is included in this repository, in client configuration, or in this document.

| Area | Verified state | Remaining action |
|---|---|---|
| Application database runtime | Drizzle now uses `node-postgres` and PostgreSQL table definitions. MySQL duplicate-key operations and insert-ID assumptions are replaced with explicit PostgreSQL conflict targets and `returning()` IDs. | Maintain PostgreSQL parity for future schema changes. |
| Dedicated Supabase project | **BugForge**, ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17. The migrated records match the authorized MySQL snapshot. | Keep Lock Note’s separate `clonefest-2` project untouched. |
| Server-only connectivity | The live connection test executed `SELECT 1` with the freshly rotated transaction-pooler credential. | Rotate the secret through Supabase, Manus, and Vercel together whenever the password changes. |
| Vercel database health | Production deployment `3wcDfqLkHku1qgjEeJ9dfw1cGkQR`, source commit `9043622`, is **Ready**. Both its unique URL and `https://bugforge-lyart.vercel.app` returned HTTP 200 with `{"ok":true,"database":"connected"}` from `system.health`. | Keep the health route free of connection details and continue monitoring through platform logs. |
| Vercel API routing | The stable domain returned HTTP 200 with the expected unauthenticated `auth.me` JSON-null contract rather than a source file, 404, or function error. | Preserve the API catch-all rewrite and original-path restoration when editing routing. |
| Authentication | **Verified on Vercel.** GitHub OAuth is mediated through Supabase Auth. The GitHub App callback is `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`; Supabase returns to the allowlisted Vercel SPA route `/auth/callback`, which completes the PKCE exchange. A fresh live browser review showed the signed-in `Simondavid07` workspace and stored Supabase Auth session. | Retain the GitHub App/Supabase redirect configuration and re-run the authenticated smoke test after identity changes. |
| Managed Forge storage and AI | The managed deployment’s Forge-backed storage and AI configuration remains protected and was not copied to Vercel. | Do not claim these capabilities work externally until a compatible, server-only external integration is configured and tested. |
| Security hardening | RLS is enabled on all BugForge public-schema tables. `public.set_updated_at()` has a fixed `pg_catalog` search path. The advisor’s remaining notices are expected informational default-deny findings because browser Data API access is intentionally unused. | Do not expose Supabase Data API or service-role credentials to the frontend. |
| GitHub source control | The private [`Simondavid07/bugforge`](https://github.com/Simondavid07/bugforge) repository remains linked to Vercel on `main`. | Push this final non-secret documentation and validation record after the secret audit. |

## Runtime validation

The final local validation suite passed TypeScript checking, the complete Vitest suite, the Vercel build, and the managed-runtime build. The focused `server/supabase.connection.test.ts` also passed after the password rotation and confirms the configured server-only URI can execute a lightweight PostgreSQL health query. The managed runtime was not replaced or deleted; it remains the verified rollback environment.

The public Vercel verification intentionally used only safe, read-only requests. `system.health` performs a `SELECT 1` and reports the coarse states `connected` or `unavailable`; it does not return a host, user, password, or driver error. The serverless runtime uses the Supabase shared transaction pooler, the documented connection mode for temporary and serverless clients.[1]

## Authentication and external-runtime boundary

The external deployment now uses the user-configured **GitHub OAuth with Supabase Auth** flow, not Manus end-user OAuth. The client initiates GitHub sign-in through Supabase, then exchanges the returned PKCE code exactly once at the public `/auth/callback` SPA route. The tRPC transport forwards the short-lived Supabase access token in an Authorization header; the server obtains the Supabase identity server-side and resolves it to the existing BugForge user record. Existing workspace membership is therefore preserved by a confirmed-email match rather than by replacing access-control tables.[2] [3]

The prior Manus `invalid redirect_uri` finding is closed for this deployment path. During reconciliation, the GitHub OAuth App callback was restored to the Supabase Auth callback after a temporary direct-GitHub inspection change; the GitHub App’s homepage remains the stable Vercel URL. No GitHub client secret is stored in BugForge source, documentation, Git history, or frontend configuration.

> The managed MySQL/TiDB deployment and its data are deliberately retained as rollback infrastructure. Do not remove or overwrite them until external OAuth, authenticated workspace routes, and any required external storage/AI alternatives are verified.

## Project accent behavior

The authenticated **Orbit Labs / Web Console** workspace retains its sage `#75937E` accent after the PostgreSQL conversion. The server validates the hex value and project-admin membership before persisting an update.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase: Connect to your database"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[3]: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession "Supabase JavaScript: exchangeCodeForSession"
