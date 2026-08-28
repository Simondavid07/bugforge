# Production readiness

**Verified:** 28 August 2026

BugForge has a working external production deployment using the dedicated Supabase PostgreSQL project, GitHub OAuth through Supabase Auth, and private Supabase Storage. The managed deployment and MySQL/TiDB database remain intact as rollback infrastructure. The working managed AI recommendation path remains unchanged and no external AI funding or provider key is configured.

## Release checklist

| Check           | Result                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript      | Passed after the PostgreSQL runtime conversion, private Storage adapter, signed URL hydration, and project-accent UI work.                    |
| Tests           | Complete Vitest suite passed; focused coverage includes RBAC, persistence, Storage, authentication synchronization, and personalization.      |
| Builds          | `pnpm build:vercel` and `pnpm build:managed` passed.                                                                                          |
| Database        | Dedicated Supabase project `zznvjtdspjampmztrunx` connects through the server-only transaction pooler.                                        |
| Authentication  | GitHub OAuth through Supabase Auth completed in the production browser; the authorized workspace rendered.                                    |
| Storage         | Private avatar upload, signed read, marker persistence, and browser-safe hydration verified in production.                                    |
| Personalization | Project accent selection and persistence verified with Web Console set to `#75937E`.                                                          |
| Vercel          | Stable production URL [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app); latest GitHub `main` deployment reported Ready. |
| Security        | RLS is enabled on public BugForge tables; Storage remains private and service-role access is server-only.                                     |
| Rollback        | Managed deployment and MySQL/TiDB data remain available.                                                                                      |

## Runtime and security model

The Vercel function uses `drizzle-orm/node-postgres` with the Supabase transaction endpoint. The browser never receives the database URL or service-role key. Supabase public-table RLS is enabled as defense in depth, while application-level workspace/project RBAC continues to protect every scoped procedure.

The `bugforge-private` bucket accepts the configured file types within the 5 MiB limit. Server procedures validate uploads and authorization before writing. Database rows retain object markers and metadata; authorized reads exchange markers for short-lived signed URLs. No permissive browser Storage policy was introduced.

## Vercel architecture

Vercel serves Vite’s static output and dispatches `/api/*` through `api/[...path].ts`, which creates the shared Express application without starting a long-lived listener. Rewrites preserve tRPC routes, the SPA callback route, deep links, and legacy managed-storage compatibility handling.

## AI boundary

The existing AI recommendation implementation remains managed-only. It returns structured drafts and preserves the explicit human apply/dismiss gate. The optional Vercel AI Gateway experiment was removed by owner direction; there is no external provider key, funding configuration, or live external model request in the release.

## Rollback policy

If an external application regression appears, use the managed deployment first. Do not delete or reverse the Supabase database as an incident shortcut. Preserve the failing commit and inspect redacted Vercel runtime logs, browser errors, and API responses before preparing a forward fix.

## Bundle audit

Route-level loading defers page modules, the command palette, and the personalization panel. The Supabase Auth client contributes to the entry bundle; the shared-chunk warning is documented and accepted until field measurements justify further optimization.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase PostgreSQL connections"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase PostgreSQL RLS"
[3]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase signed URLs"
[4]: https://vercel.com/kb/guide/using-express-with-vercel "Using Express.js with Vercel"
[5]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
