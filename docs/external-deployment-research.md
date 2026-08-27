# External deployment research record

**Reviewed and applied:** 26 August 2026

| Topic | Decision recorded for BugForge | Source |
|---|---|---|
| Supabase connection mode | Use the shared transaction-pooler endpoint on port `6543` for the Vercel/serverless runtime. The direct endpoint is IPv6-only on the free tier and is reserved for migrations or persistent IPv6-capable services. | [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) |
| PostgreSQL pooler behavior | Do not rely on prepared statements in transaction mode. Reuse a small application-side pool while keeping a low serverless connection ceiling. | [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) and [Connection management](https://supabase.com/docs/guides/database/connection-management) |
| Supabase public tables | Enable RLS on every BugForge public-schema table. The app verifies Supabase Auth bearer tokens server-side for tRPC authorization, so no browser Data API policies were created; this is an intentional default-deny posture. | [Supabase security guidance](https://supabase.com/docs/guides/api/securing-your-api) |
| Vite SPA routing | Build static Vite output for Vercel and use a final SPA rewrite to `index.html`, while excluding API-function paths from the fallback. | [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) |
| Vercel serverless backend | Export an Express handler from `api/[...path].ts`; never start a long-lived listener in a Vercel function. | [Vercel: Using Express.js with Vercel](https://vercel.com/kb/guide/using-express-with-vercel) and [Vercel Functions](https://vercel.com/docs/functions) |
| Vercel Node API runtime | Node functions in the root `/api` directory are automatically detected; do not set a `runtime` override for an official Node function. The `functions.runtime` setting is for a versioned community runtime package. | [Vercel: Configuring function runtime](https://vercel.com/docs/functions/configuring-functions/runtime) and [Vercel: Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) |
| Internal routing | Rewrite legacy `/manus-storage/*` URLs into the Express serverless function, preserve `/api/*` for tRPC, and send the public Supabase Auth PKCE route `/auth/callback` to the SPA. | [Vercel rewrites](https://vercel.com/docs/routing/rewrites) |
| Password rotation procedure | Reset the dedicated Supabase password, update only protected server-side connection values, validate locally with `SELECT 1`, update Vercel Production and Preview, and redeploy before exercising the live health route. | [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) |
| GitHub login callback handling | Register GitHub’s callback with Supabase Auth, allowlist the Vercel SPA callback in Supabase, exchange the PKCE code exactly once in the browser, and validate the resulting bearer token server-side. | [Supabase: Login with GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github) and [exchangeCodeForSession](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession) |

## Applied verification record

Following the second credential rotation, the focused live Supabase test passed using the protected server connection string. Vercel Production and Preview values were then rotated, and production deployment `AiZd2t9T1SwmSBXzbXjhrXhQV5NR` reached **Ready**. Its assigned stable domain and unique URL both returned HTTP 200 with the safe response `{ok:true,database:"connected"}`. The stable unauthenticated `auth.me` procedure also returned HTTP 200 and JSON null.

The earlier Manus OAuth redirect-domain blocker no longer applies. The user configured GitHub OAuth through Supabase Auth, and a fresh Vercel browser review confirmed a signed-in workspace plus a Supabase Auth storage marker. During reconciliation, the GitHub OAuth App callback was restored to the required Supabase Auth callback after a temporary inspection change. Forge storage and AI runtime credentials remain managed-only and have not been represented as working on Vercel.

> The Vercel and Supabase guidance supports the current source layout and database connection model. It does not establish that managed Forge credentials can be safely transferred outside the managed runtime, nor does it configure an external OAuth redirect allowlist automatically.
