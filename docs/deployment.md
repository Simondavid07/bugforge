# Deployment runbook

## Production topology

BugForge is deployed from the `main` branch of `Simondavid07/bugforge` to Vercel at [bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app). Vercel serves the Vite single-page application and routes `/api/*` to the Node serverless catch-all. `server/_core/app.ts` is shared between the Vercel function and the managed runtime.

The external runtime uses Supabase PostgreSQL and the private `bugforge-private` Storage bucket. The original managed deployment and MySQL/TiDB database remain available as rollback and are not deleted by this deployment.

## Environment setup

Configure protected Production and Preview values through the deployment settings. At minimum, the external runtime needs the password-bearing `SUPABASE_DATABASE_URL`, server-only `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET=bugforge-private`, plus the existing signing, Supabase browser, and application branding variables required by the source environment. Never put the service-role key or database password in `VITE_*` variables.

Configure GitHub OAuth in Supabase Auth. The GitHub provider callback is `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`; the post-auth browser redirect is the production `/auth/callback` route. Keep the project URL and redirect allowlist aligned before testing login.

## Release procedure

Review the source diff and `todo.md`, run `pnpm check`, `pnpm test`, `pnpm build:vercel`, and `pnpm build:managed`, then create a recoverable checkpoint. Push the reviewed commit to GitHub `main`, wait for Vercel to report Ready, and run the non-destructive health probe. Confirm the public result reports `{ "ok": true, "database": "connected" }` without returning credentials or data.

For an authenticated smoke test, sign in through GitHub, open the workspace, navigate to Issues and Workboard, verify project personalization, and—when necessary—use a harmless avatar upload to check private Storage. Avoid creating production issues only for testing unless the owner has approved cleanup.

## Rollback

If the Vercel build or authenticated flow regresses, use the managed deployment as the operational rollback. Do not reverse or delete the Supabase database as a first response. Preserve the last known-good checkpoint and inspect Vercel runtime logs, browser console output, and network status before attempting a corrective commit.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel rewrites"
[2]: https://vercel.com/kb/guide/using-express-with-vercel "Using Express.js with Vercel"
[3]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub login"
