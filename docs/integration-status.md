# Integration status

**Last verified:** 27 August 2026

BugForge now runs against its isolated **Supabase PostgreSQL** project through the server-only `SUPABASE_DATABASE_URL` transaction-pooler secret. A fresh database-password rotation was applied to the dedicated BugForge project and its protected local, Vercel Production, and Vercel Preview credentials were updated. No credential is included in this repository, in client configuration, or in this document.

| Area | Verified state | Remaining action |
|---|---|---|
| Application database runtime | Drizzle now uses `node-postgres` and PostgreSQL table definitions. MySQL duplicate-key operations and insert-ID assumptions are replaced with explicit PostgreSQL conflict targets and `returning()` IDs. | Maintain PostgreSQL parity for future schema changes. |
| Dedicated Supabase project | **BugForge**, ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17. The migrated records match the authorized MySQL snapshot. | Keep Lock Note’s separate `clonefest-2` project untouched. |
| Server-only connectivity | The live connection test executed `SELECT 1` with the freshly rotated transaction-pooler credential. | Rotate the secret through Supabase, Manus, and Vercel together whenever the password changes. |
| Vercel database health | Production deployment `dpl_9PiW675zW8hrotWTid4z3USnShov`, source commit `a1e3fa7`, is **Ready**. The stable production health probe continues to complete successfully without returning connection details. | Keep the health route free of connection details and continue monitoring through platform logs. |
| Vercel API routing | The stable domain returned HTTP 200 with the expected unauthenticated `auth.me` JSON-null contract rather than a source file, 404, or function error. | Preserve the API catch-all rewrite and original-path restoration when editing routing. |
| Authentication | **Verified on Vercel.** GitHub OAuth is mediated through Supabase Auth. The GitHub App callback is `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`; Supabase returns to the allowlisted Vercel SPA route `/auth/callback`, which completes the PKCE exchange. A fresh live browser review showed the signed-in `Simondavid07` workspace and stored Supabase Auth session. | Retain the GitHub App/Supabase redirect configuration and re-run the authenticated smoke test after identity changes. |
| Private file storage | **Verified on Vercel.** The private `bugforge-private` Supabase Storage bucket accepts server-authorized uploads and produces 15-minute signed reads. An authenticated avatar upload stored a `supabase-storage://` database marker and rendered through a signed URL; no Storage browser policy or service-role key was exposed. | Add lifecycle cleanup for superseded/deleted-object keys in a later maintenance pass. |
| AI recommendation boundary | The server now prefers Vercel AI Gateway using the request-scoped OIDC token supplied to Vercel Functions; the retained Forge adapter is reachable only in the managed rollback runtime. The strict schema and `pending_review` gate are unchanged. | Enable model-request funding in Vercel, then perform one authorized live recommendation test before calling the external AI flow verified. |
| Security hardening | RLS is enabled on all BugForge public-schema tables. `public.set_updated_at()` has a fixed `pg_catalog` search path. The latest advisor reports only the expected informational default-deny notices for tables with RLS and no browser Data API policies, plus Supabase Auth’s independent leaked-password-protection warning. | Do not expose Supabase Data API or service-role credentials to the frontend. Enable leaked-password protection if password sign-in is introduced. |
| GitHub source control | The private [`Simondavid07/bugforge`](https://github.com/Simondavid07/bugforge) repository remains linked to Vercel on `main`. | Push this final non-secret documentation and validation record after the secret audit. |

## Runtime validation

The final local validation suite passed TypeScript checking, **35 Vitest assertions**, the Vercel build, and the managed-runtime build. Focused tests cover a real private Storage upload/sign/read/delete round-trip, the read-only bucket inventory, private marker hydration, and Vercel OIDC/managed-Forge AI routing. The focused `server/supabase.connection.test.ts` also passed after the password rotation and confirms the configured server-only URI can execute a lightweight PostgreSQL health query. The managed runtime was not replaced or deleted; it remains the verified rollback environment.

The public Vercel verification intentionally used only safe, read-only requests. `system.health` performs a `SELECT 1` and reports the coarse states `connected` or `unavailable`; it does not return a host, user, password, or driver error. The serverless runtime uses the Supabase shared transaction pooler, the documented connection mode for temporary and serverless clients.[1]

## Authentication and external-runtime boundary

The external deployment now uses the user-configured **GitHub OAuth with Supabase Auth** flow, not Manus end-user OAuth. The client initiates GitHub sign-in through Supabase, then exchanges the returned PKCE code exactly once at the public `/auth/callback` SPA route. The tRPC transport forwards the short-lived Supabase access token in an Authorization header; the server obtains the Supabase identity server-side and resolves it to the existing BugForge user record. Existing workspace membership is therefore preserved by a confirmed-email match rather than by replacing access-control tables.[2] [3]

The prior Manus `invalid redirect_uri` finding is closed for this deployment path. During reconciliation, the GitHub OAuth App callback was restored to the Supabase Auth callback after a temporary direct-GitHub inspection change; the GitHub App’s homepage remains the stable Vercel URL. No GitHub client secret is stored in BugForge source, documentation, Git history, or frontend configuration.

> The managed MySQL/TiDB deployment and its data are deliberately retained as rollback infrastructure. Do not remove or overwrite them until external OAuth, authenticated workspace routes, and any required external storage/AI alternatives are verified.

## External storage and AI boundary

The Storage cutover is server-mediated. After BugForge’s own workspace/project authorization succeeds, the server writes to the private `bugforge-private` bucket with its server-only service-role credential. Database records retain a non-public marker rather than a permanent object URL; read paths exchange the marker for a 15-minute signed URL only after authorization. This matches Supabase’s private-bucket and signed-URL model while keeping the service-role credential outside the browser.[4] [5]

The Vercel deployment now uses AI Gateway’s OpenAI-compatible `/v1` interface. Each Function request contributes its short-lived `x-vercel-oidc-token` to the server-only model catalog and completion calls, avoiding a persisted AI Gateway key. The recommendation procedure still requires project membership before gathering issue context, constrains output through the existing strict JSON Schema, and persists the result only as a human-reviewable `pending_review` draft. Vercel documents both the request-scoped OIDC mechanism and the OpenAI-compatible structured-output contract.[6] [7]

No production AI recommendation was generated during this milestone. The Vercel AI Gateway account still requires the owner to enable model-request funding; adding a payment method and approving any related charge is intentionally outside this automated work. The next safe validation is one owner-authorized draft against a disposable issue, followed by verification that the draft remains pending until a human explicitly applies or dismisses it.

## Project accent behavior

The authenticated **Orbit Labs / Web Console** workspace retains its sage `#75937E` accent after the PostgreSQL conversion. The server validates the hex value and project-admin membership before persisting an update.

## References

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase: Connect to your database"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[3]: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession "Supabase JavaScript: exchangeCodeForSession"
[4]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage: Access control"
[5]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage: Create signed URL"
[6]: https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc "Vercel AI Gateway: OIDC"
[7]: https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/structured-outputs "Vercel AI Gateway: Structured Outputs"
