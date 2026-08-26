# BugForge GitHub authentication

**Status:** GitHub OAuth is configured in the dedicated Supabase project and the application source has been migrated away from Manus end-user OAuth.

## Provider configuration

The GitHub OAuth application is registered under the BugForge owner account with the production homepage `https://bugforge-lyart.vercel.app`. Its authorization callback URL is the Supabase Auth callback:

```text
https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback
```

Supabase Auth is configured with GitHub enabled. Its post-authentication redirect allowlist contains:

```text
https://bugforge-lyart.vercel.app/auth/callback
```

The Supabase Site URL is `https://bugforge-lyart.vercel.app`. No GitHub client secret is stored in this repository, Vercel source, documentation, or chat.

## Application flow

The browser calls `supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: "read:user user:email" } })`. Supabase Auth sends the user to GitHub and returns to the public SPA callback route. `AuthCallback.tsx` exchanges the PKCE code for a Supabase session and returns the user to `/`.

The browser keeps the Supabase session through the official Supabase client. The tRPC transport sends the current Supabase access token as a bearer token. The server calls Supabase Auth’s `/auth/v1/user` endpoint with that bearer token, derives the GitHub identity and profile fields, and upserts the corresponding BugForge user. Existing BugForge memberships are preserved when a confirmed GitHub email matches an existing application user.

All existing protected procedures continue to receive the same numeric BugForge user record through `ctx.user`, so workspace, project, issue, notification, personalization, and role checks remain unchanged. The obsolete Manus OAuth callback and SDK are no longer registered or included in the application source.

## Local development

For local development, add the local callback URL to Supabase Auth’s redirect allowlist and register the corresponding local callback with the GitHub OAuth application if local GitHub sign-in is needed. The production configuration must remain pointed at the Vercel callback above.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[2]: https://supabase.com/docs/reference/javascript/auth-signinwithoauth "Supabase JavaScript: signInWithOAuth"
