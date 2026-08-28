# GitHub authentication through Supabase Auth

**Status:** Verified in the dedicated BugForge Supabase project and the Vercel production deployment.

## Chosen architecture

BugForge uses GitHub as the identity provider through Supabase Auth. It does not implement a direct GitHub OAuth callback in the BugForge server and does not use the original Manus OAuth flow for end users.

| Boundary               | Configuration                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Browser                | Supabase JavaScript client with persisted PKCE session.                                              |
| Provider               | GitHub OAuth configured in Supabase Auth.                                                            |
| GitHub callback        | `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`                                          |
| BugForge callback page | Production `/auth/callback`, which exchanges the PKCE code once.                                     |
| API authentication     | Supabase access token forwarded as a Bearer header to `/api/trpc`.                                   |
| Server validation      | `server/_core/supabaseAuth.ts` validates the token through Supabase Auth before creating `ctx.user`. |

## Configuration checklist

1. Create or open the GitHub OAuth App used by BugForge.
2. Set its homepage to `https://bugforge-lyart.vercel.app`.
3. Set its authorization callback to the Supabase Auth callback shown above. Do not replace it with the Vercel route.
4. In Supabase Authentication → Providers, enable GitHub and enter the GitHub client ID and client secret. Keep the secret only in Supabase.
5. Set the Supabase Site URL to `https://bugforge-lyart.vercel.app`.
6. Add `https://bugforge-lyart.vercel.app/auth/callback` to Supabase’s redirect allowlist.
7. Keep database credentials, service-role keys, GitHub secrets, and access tokens outside Git and browser bundles.

For local sign-in, add a local `/auth/callback` URL to the Supabase allowlist and use a provider configuration intended for local development. Do not alter the production callback while testing locally.

## Request lifecycle

The browser starts `supabase.auth.signInWithOAuth({ provider: "github" })` with a PKCE challenge and a redirect to `/auth/callback`. GitHub returns to Supabase Auth, which performs the provider exchange and redirects the browser to BugForge. `AuthCallback.tsx` exchanges the one-time code exactly once and routes the user into the workspace.

The tRPC transport reads the active Supabase access token and sends it as a Bearer header. The server validates the token against Supabase Auth, maps the verified GitHub identity and profile fields, preserves existing memberships through the confirmed identity boundary, and upserts the BugForge user. Existing protected procedures continue to receive the numeric BugForge user through `ctx.user`.

## Security boundary

The GitHub client secret remains in Supabase Auth. The browser may receive only browser-safe Supabase configuration. The Supabase service-role key and PostgreSQL connection string remain server-only. A valid identity does not grant unrestricted workspace access; project and workspace RBAC checks run separately inside protected procedures.

## Verification record

A production browser session completed GitHub consent, returned through the Supabase PKCE callback, established a Supabase Auth session, and rendered the authorized BugForge workspace. The public unauthenticated `auth.me` contract returns JSON `null`, while an authenticated workspace request resolves the expected user and project data. The stable production health response remains bounded and reports PostgreSQL connectivity without exposing credentials or data.

## Troubleshooting

A redirect error usually means the GitHub callback, Supabase Site URL, redirect allowlist, or Vercel origin does not match exactly. A healthy database response does not prove OAuth configuration is correct. Check the exact URLs, clear a stale PKCE session, retry from the production origin, and inspect only redacted browser/server logs.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[2]: https://supabase.com/docs/reference/javascript/auth-signinwithoauth "Supabase JavaScript signInWithOAuth"
[3]: https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession "Supabase JavaScript exchangeCodeForSession"
