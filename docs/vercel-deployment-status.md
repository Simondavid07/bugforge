# Vercel deployment status

**Last checked:** 27 August 2026

| Item | Status |
|---|---|
| Team | `davidsimon7873-4146's projects` (`team_NDe4yP0FtJ1QaohLAPLK8FLp`) |
| Project | `bugforge` (`prj_etdzqiHKGxrzIhsoUIeInQtW7LwU`) |
| Git repository | Private `Simondavid07/bugforge` repository on `main` |
| Current production deployment | **Ready** — `dpl_9PiW675zW8hrotWTid4z3USnShov`, source commit `a1e3fa7` (`feat: route AI drafts through Vercel OIDC`). |
| Stable production URL | [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app) |
| Unique production URL | [https://bugforge-ektgo1wqv-davidsimon7873-4146s-projects.vercel.app](https://bugforge-ektgo1wqv-davidsimon7873-4146s-projects.vercel.app) |
| Database conversion | Completed and validated against dedicated Supabase PostgreSQL through a server-only transaction pooler. |
| Vercel database proof | Earlier stable and unique production health checks returned HTTP 200 with `{"ok":true,"database":"connected"}`; the latest ready deployment also passed the safe, non-sensitive health probe. |
| API routing proof | The stable URL returned HTTP 200 and the expected JSON-null unauthenticated result from `auth.me`. |
| Protected values | `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET=bugforge-private` are present only in protected Production and Preview configuration. GitHub OAuth client credentials remain in Supabase Auth; no GitHub client secret, Storage service-role key, or long-lived AI Gateway key is added to BugForge source or browser configuration. |
| OAuth status | **Verified.** GitHub OAuth uses the Supabase callback and returns through the Vercel SPA PKCE callback route. A fresh browser review found a signed-in Supabase Auth session and the authorized BugForge workspace. |
| Private Storage | **Verified on Vercel.** The deployed server writes only after role checks, stores private Supabase markers in PostgreSQL, and returns 15-minute signed read URLs. An authenticated avatar upload and retrieval succeeded. |
| AI Gateway | **Adapter deployed, live model request pending.** The server forwards Vercel’s request-scoped OIDC token to AI Gateway and preserves strict JSON outputs plus the human review gate. No long-lived AI key is required or retained. |

## Compatible deployment layout

The external build does not start `server/_core/index.ts`, the long-lived managed-runtime bootstrap. Instead, common request registration is isolated in `server/_core/app.ts`; Vercel imports it through `api/[...path].ts`, while the managed server continues to attach Vite/static middleware and listen on a port. `vercel.json` retains explicit API catch-all routing, restores the original API pathname in the handler, rewrites legacy `/manus-storage/*` URLs into the serverless handler, and sends non-API deep links to the Vite SPA entry point.[1] [2]

Vercel emits one Node function for the API catch-all. The reachable server import graph uses Node-compatible ESM `.js` specifiers, avoiding runtime module-resolution failures. The current production deployment confirms that the static site, function routing, and server-side PostgreSQL credentials are all active.

## What remains before calling the Vercel site fully usable

The Vercel root URL now presents **Continue with GitHub** to anonymous users and renders the authorized workspace after the Supabase Auth PKCE callback completes. The GitHub App’s authorization callback is intentionally the Supabase Auth callback, while Supabase returns the browser to the allowlisted Vercel SPA route `/auth/callback`.[3] [4] This replaces the prior Manus redirect-domain constraint; a temporary direct-GitHub callback change made during inspection was restored before final validation.

The managed Forge credentials were intentionally not copied to the third-party deployment. Attachments and personalization images now use private Supabase Storage on the server, authenticated by existing BugForge role checks and delivered by signed read URLs. AI recommendation code now uses the Vercel Function’s OIDC token with AI Gateway’s OpenAI-compatible structured-output API; an actual model draft remains pending until the account owner enables model-request funding.[5] [6]

> The managed MySQL/TiDB deployment and its database remain intact. Retain them as the rollback route until external OAuth and the outstanding external integrations are validated.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel: Rewrites"
[2]: https://vercel.com/kb/guide/using-express-with-vercel "Vercel: Using Express.js with Vercel"
[3]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[4]: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession "Supabase JavaScript: exchangeCodeForSession"
[5]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage: Create signed URL"
[6]: https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc "Vercel AI Gateway: OIDC"
