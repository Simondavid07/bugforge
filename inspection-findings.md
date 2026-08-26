# BugForge inspection findings

Date: 26 August 2026

## Current architecture

BugForge is a Vite React frontend with an Express/tRPC backend. Vercel serves the built SPA and dispatches `/api/*` to `api/[...path].ts`, which imports `server/_core/app.ts`. The shared app registers the OAuth callback at `/api/oauth/callback` and tRPC at `/api/trpc`.

## Current authentication implementation

The frontend login entry point is `client/src/const.ts`. `startLogin()` derives the redirect URI from `window.location.origin` as `${origin}/api/oauth/callback`, generates a nonce, stores it in the `__Host-oauth_state` cookie, and redirects to the configured Manus OAuth portal with `VITE_APP_ID`, `redirectUri`, and the encoded state.

The callback in `server/_core/oauth.ts` validates the nonce against the cookie, exchanges the authorization code through the Manus OAuth server, fetches user information, upserts the user into the application database, creates the BugForge session JWT, sets the session cookie, and redirects to `/`.

The code is not currently using Supabase Auth or a GitHub OAuth client directly. It uses Manus OAuth as the identity broker. GitHub is recognized only as a possible upstream login method when the Manus user profile reports `REGISTERED_PLATFORM_GITHUB`; this is handled in `server/_core/sdk.ts`.

## Live observations

The public Vercel landing page loads successfully and shows the `Enter your workspace` sign-in control. The GitHub repository URL returned a public 404 in the sandbox browser, but `gh repo clone Simondavid07/bugforge` succeeded using the enabled GitHub integration, confirming the private repository is accessible through the authenticated CLI.

The Vercel dashboard URL redirected to a Vercel login page in the sandbox browser, so dashboard inspection should use the configured authenticated service/MCP path or the connected browser session if it becomes active. The repository's own deployment notes record that the live app reaches Manus OAuth but the provider rejects the callback because `bugforge-lyart.vercel.app` is not an allowed redirect domain. The documented blocker is therefore an external OAuth-provider allowlist/configuration issue, not a missing callback route, Vercel rewrite, or Supabase database failure.

## Supabase boundary

The repository uses Supabase PostgreSQL as the server-only application database through `SUPABASE_DATABASE_URL`. The code does not currently use Supabase Auth. RLS is intentionally default-deny because browser Data API access is not part of the app's server-side authorization model.

## Next action

Inspect the live Vercel project and Supabase project through their authenticated integrations, then determine whether the Manus OAuth application's allowed redirect-domain list can be updated. Do not replace the existing Manus OAuth flow with a separate Supabase Auth GitHub flow unless the provider configuration is unavailable and the user explicitly chooses that architectural change.

## Dashboard-session update

The authenticated Vercel and Supabase management integrations are available through the configured services and confirmed the Vercel team/project and Supabase project metadata. The sandbox browser itself still renders the Vercel and Supabase account sign-in pages, so it is not the same authenticated browser session the user signed into. No dashboard mutation has been made. The Supabase project is active and healthy; the application’s repository and deployment notes still indicate that Supabase Auth is not wired into the app.
