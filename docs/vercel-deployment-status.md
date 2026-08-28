# Vercel deployment status

**Last checked:** 28 August 2026

| Item                        | Status                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Team                        | `davidsimon7873-4146's projects` (`team_NDe4yP0FtJ1QaohLAPLK8FLp`)                                                                                        |
| Project                     | `bugforge` (`prj_etdzqiHKGxrzIhsoUIeInQtW7LwU`)                                                                                                           |
| Git repository              | `Simondavid07/bugforge`, `main` branch. Verify repository visibility in GitHub settings independently.                                                    |
| Current verified deployment | GitHub `main` deployment from the workflow contrast/project-accent fix reported **Ready**.                                                                |
| Stable production URL       | [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app)                                                                                    |
| Database                    | Dedicated Supabase PostgreSQL through the protected server-only transaction-pooler URL.                                                                   |
| Health proof                | Public `system.health` probe returned the bounded connected state without connection details.                                                             |
| API proof                   | Unauthenticated `auth.me` returned JSON `null`; authenticated browser navigation rendered the workspace.                                                  |
| Authentication              | GitHub OAuth through Supabase Auth with PKCE and the Supabase provider callback.                                                                          |
| Storage                     | Private `bugforge-private` bucket, server-authorized writes, marker persistence, and short-lived signed reads verified on Vercel.                         |
| Personalization             | Web Console project accent was changed to `#75937E` and remained selected after authenticated refresh.                                                    |
| AI                          | Existing managed, structured, human-reviewed recommendation workflow remains unchanged. No external AI funding, key, or live model request is configured. |
| Rollback                    | Managed deployment and MySQL/TiDB database remain preserved.                                                                                              |

## Deployment layout

The Vercel build serves the Vite SPA and routes `/api/*` to `api/[...path].ts`, which imports the shared Express application without starting a long-lived listener. Rewrites preserve tRPC, the SPA callback route, deep links, and legacy managed-storage compatibility handling. The managed runtime uses the same request registration but keeps its own long-lived bootstrap.

## Protected configuration

Production and Preview use protected Supabase database and Storage settings. The service-role key is server-only and never appears in browser configuration, source control, documentation, or tRPC responses. GitHub OAuth client credentials are kept inside Supabase Auth. The external deployment intentionally has no AI Gateway key or funding configuration.

## Verification

The Vercel production browser completed GitHub/Supabase Auth, loaded the authorized workspace, rendered private signed avatar and logo URLs, displayed the workboard with readable dark status labels, and persisted the selected sage project accent across refresh. TypeScript, the full Vitest suite, Vercel build, and managed build passed during the release milestones.

## Rollback

If the external deployment regresses, use the managed deployment as the operational fallback. Keep the managed database intact and do not reverse or delete the Supabase database as an incident shortcut. Inspect redacted deployment logs, browser errors, and API responses before preparing a forward fix.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel rewrites"
[2]: https://vercel.com/kb/guide/using-express-with-vercel "Using Express.js with Vercel"
[3]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[4]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage signed URLs"
