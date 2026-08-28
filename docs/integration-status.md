# Integration status

**Last verified:** 28 August 2026

BugForge’s external production runtime uses the isolated Supabase PostgreSQL project created for BugForge. GitHub OAuth is mediated by Supabase Auth, new files use private Supabase Storage, Vercel hosts the external build, and the managed deployment remains the rollback path. The selected GitHub repository is `Simondavid07/bugforge` on `main`; repository visibility should be reviewed independently of application secret safety.

| Area                       | Verified state                                                                                                                                                        | Operating boundary                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| PostgreSQL runtime         | Drizzle uses `pg` and PostgreSQL definitions through the Supabase transaction pooler.                                                                                 | Preserve schema parity for future migrations.                                                  |
| Dedicated Supabase project | BugForge project ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17.                                                                                      | Keep Lock Note project `clonefest-2` untouched.                                                |
| Database health            | Server-only `SELECT 1` health test and production health probe succeeded.                                                                                             | Do not return connection details or driver errors publicly.                                    |
| Vercel                     | Stable production URL: [bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app). Latest verified deployment from GitHub `main` is Ready.                        | Preserve the API catch-all and SPA fallback routing.                                           |
| Authentication             | GitHub OAuth through Supabase Auth with PKCE; Supabase callback `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`; Vercel post-auth route `/auth/callback`. | Keep provider credentials in Supabase Auth, never in source or browser bundles.                |
| Private Storage            | `bugforge-private` is private. Server-authorized avatar, logo, and attachment writes store markers and return short-lived signed reads.                               | Do not add permissive browser Storage policies or expose the service-role key.                 |
| Project personalization    | Project admins can persist hex accents; the authenticated Web Console project was verified at sage `#75937E`.                                                         | Continue validating values server-side and keep UI feedback accessible.                        |
| AI recommendations         | Existing managed Forge workflow remains unchanged, structured, and human-reviewed.                                                                                    | Do not activate external AI funding, keys, or live requests without a separate owner decision. |
| Security                   | BugForge public tables have RLS enabled and the timestamp trigger search path is hardened.                                                                            | Application RBAC remains required; RLS is defense in depth.                                    |
| Rollback                   | Managed MySQL/TiDB deployment and data remain available.                                                                                                              | Do not delete or reverse either database as a first response to an application incident.       |

## Validation evidence

The complete TypeScript check, Vitest suite, Vercel build, and managed build passed during the final application milestones. Focused verification covered Supabase PostgreSQL connectivity, private Storage upload/sign/read/delete behavior, authenticated avatar marker hydration, GitHub/Supabase Auth, project-accent persistence, and the production workboard. No credentials are recorded in this document.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[2]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage access control"
[3]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase PostgreSQL connections"
