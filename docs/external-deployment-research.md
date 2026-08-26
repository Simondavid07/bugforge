# External deployment research record

**Reviewed:** 26 August 2026

| Topic | Decision recorded for BugForge | Source |
|---|---|---|
| Supabase connection mode | Use the Shared Pooler transaction endpoint on port `6543` for the Vercel/serverless runtime. The direct endpoint is IPv6-only on the free tier and is reserved for migrations or persistent IPv6-capable services. | [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) |
| PostgreSQL pooler behavior | Do not rely on prepared statements in transaction mode. Reuse a small application-side pool while keeping a low serverless connection ceiling. | [Supabase: Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres) and [Connection management](https://supabase.com/docs/guides/database/connection-management) |
| Supabase public tables | Enable RLS on every BugForge public-schema table. The app maintains server-side Manus OAuth/tRPC authorization, so no browser Data API policies were created; this is an intentional default-deny posture. | [Supabase security guidance](https://supabase.com/docs/guides/api/securing-your-api) |
| Vite SPA routing | Build static Vite output for Vercel and use a final SPA rewrite to `index.html`, while excluding API-function paths from the fallback. | [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) |
| Vercel serverless backend | Export an Express handler from `api/[...path].ts`; never start a long-lived listener in a Vercel function. | [Vercel: Using Express.js with Vercel](https://vercel.com/kb/guide/using-express-with-vercel) and [Vercel Functions](https://vercel.com/docs/functions) |
| Vercel Node API runtime | Node functions in the root `/api` directory are automatically detected; do **not** set a `runtime` override for an official Node function. The `functions.runtime` setting is for a versioned community runtime package. | [Vercel: Configuring function runtime](https://vercel.com/docs/functions/configuring-functions/runtime) and [Vercel: Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) |
| Internal routing | Rewrite legacy `/manus-storage/*` URLs into the Express serverless function and preserve `/api/*` for tRPC and OAuth. | [Vercel rewrites](https://vercel.com/docs/routing/rewrites) |

## Review notes

The Vercel and Supabase guidance supports the present source layout, but it does not establish that Manus OAuth and Forge storage/AI credentials are transferable outside the managed runtime. Those integrations must be validated in a protected Vercel preview before the paused project is resumed.
