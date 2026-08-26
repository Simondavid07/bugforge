# Vercel deployment status

**Last checked:** 26 August 2026

| Item | Status |
|---|---|
| Team | `davidsimon7873-4146's projects` (`team_NDe4yP0FtJ1QaohLAPLK8FLp`) |
| Project | `bugforge` (`prj_etdzqiHKGxrzIhsoUIeInQtW7LwU`) |
| Git repository | `Simondavid07/bugforge` on `main` |
| First Vercel deployment | Commit `e5a7a29` at `https://bugforge-qncfaztce-davidsimon7873-4146s-projects.vercel.app` |
| Current state | **Paused. Not a usable BugForge URL.** |
| Database conversion | Completed and locally validated against dedicated Supabase PostgreSQL via server-only transaction pooler. |
| Corrected source architecture | Ready for source-control review: `api/[...path].ts` exports an Express serverless handler; Vite emits static `dist` assets for Vercel; SPA and storage rewrites are explicit in `vercel.json`. |
| Configured Vercel runtime values | Production and Preview have protected `SUPABASE_DATABASE_URL` and `JWT_SECRET`; both receive the public OAuth application and portal settings. Production also has the server-side OAuth service endpoint. |

## Why the Vercel deployment remains paused

The first deployment auto-detected the repository incorrectly and served bundled Express/server output instead of the BugForge interface. Resuming it without an explicit Vercel architecture could expose incorrect application behavior. It remains a rollback-safe paused artifact, not a production deployment.

## Corrected deployment layout

The external build no longer starts `server/_core/index.ts`, which is the long-lived managed-runtime bootstrap. Instead, the common request registration is isolated in `server/_core/app.ts`; Vercel imports it through `api/[...path].ts`, while the managed server still attaches Vite/static middleware and listens on a port. `vercel.json` preserves `/api/*` function routes, rewrites existing `/manus-storage/*` URLs into the serverless handler, and sends non-API deep links to `index.html`.

The Vercel project now has the core server-only transaction-pooler connection and session signing secret, plus the non-secret client OAuth configuration. A new build is required for those values to take effect. The external runtime must still prove the Manus OAuth callback and optional Forge-backed storage/AI operations work from Vercel; managed Forge credentials were not copied or exposed outside the managed runtime.

The existing MySQL/TiDB managed project is preserved as rollback infrastructure until the corrected Vercel build renders the actual UI and its authenticated workspace routes pass against Supabase.
