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

## Configuration checklist

1. Create a GitHub OAuth application under the account that owns BugForge.
2. Set its homepage URL to `https://bugforge-lyart.vercel.app`.
3. Set its GitHub authorization callback URL to `https://zznvjtdspjampmztrunx.supabase.co/auth/v1/callback`.
4. In Supabase Authentication → Sign In / Providers, enable GitHub and enter the GitHub client ID and client secret. Keep the client secret only in Supabase; do not commit it to Git or expose it in frontend code.
5. In Supabase Authentication → URL Configuration, set the Site URL to `https://bugforge-lyart.vercel.app` and add `https://bugforge-lyart.vercel.app/auth/callback` to Redirect URLs.
6. Push the application source to the linked GitHub repository. Vercel deploys the production branch automatically; the commit email must match a GitHub account recognized by the Vercel project.
7. Test with **Continue with GitHub**, approve the read-only profile/email request, confirm the browser reaches `/auth/callback`, and verify the authenticated workspace loads.

## Production verification

The production flow was tested on August 27, 2026 using the `Simondavid07` GitHub account. GitHub consent completed, Supabase returned the PKCE callback code, the BugForge workspace opened as an authenticated user, and the protected `workspace.mine` procedure returned HTTP 200.

A temporary workspace named `BugForge E2E Test` with project key `E2E26` was created through the production `workspace.create` procedure. The response returned HTTP 200 with workspace ID `2` and project ID `2`; a subsequent authenticated `workspace.mine` request returned both the original `WEB` project and `E2E26`, and the refreshed production UI displayed `E2E26 — E2E Console` in the project selector. The temporary workspace was then removed with a narrowly scoped administrator cleanup transaction; post-cleanup checks returned zero matching workspace and project rows.

Workspace deletion is now available in the Personalize → Workspace settings panel. It is restricted to workspace administrators and requires typing the exact workspace name before the protected `workspace.delete` mutation can run. The server deletes dependent project, issue, collaboration, notification, and membership records inside one transaction and does not delete the user identity.

The latest production build completed successfully. Runtime logs showed successful authenticated requests and no application exception. Vercel still reports Node’s `DEP0169` `url.parse()` deprecation warning from the Express 4 request-parser dependency; it is non-fatal and unrelated to authentication. The optional Umami analytics placeholders were moved into conditional application bootstrap code, so builds without analytics variables no longer emit the previous unresolved-placeholder warnings.

## Reconciliation review

On 27 August 2026, the GitHub OAuth App, Supabase Auth flow, Vercel workspace, source branch, PostgreSQL health route, and full project validation suite were re-reviewed. The GitHub App’s homepage remained `https://bugforge-lyart.vercel.app`, and its callback was confirmed and restored as the Supabase Auth callback shown above. A fresh browser session at the stable Vercel URL displayed the authenticated `Simondavid07` workspace and confirmed only the presence—not the value—of the persisted Supabase Auth session. Independent public requests continued to return `{"ok":true,"database":"connected"}` from `system.health` and JSON null for an unauthenticated `auth.me` request.

The review also corrected a workspace-deletion regression test so that the unavailable-database case passes an explicit `null` test dependency rather than accidentally using an initialized live connection. TypeScript, all 29 Vitest assertions, the Vercel build, and the managed rollback build passed after this correction. The Vercel bundle warning remains advisory: the Supabase client increases the entry bundle to approximately 961 kB uncompressed and 274 kB gzip.

## Local development

For local development, add the local callback URL to Supabase Auth’s redirect allowlist and register the corresponding local callback with the GitHub OAuth application if local GitHub sign-in is needed. The production configuration must remain pointed at the Vercel callback above.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Login with GitHub"
[2]: https://supabase.com/docs/reference/javascript/auth-signinwithoauth "Supabase JavaScript: signInWithOAuth"
[3]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage: Access control"
[4]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage: Create signed URL"
[5]: https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc "Vercel AI Gateway: OIDC"

Deployment note: the production commit is authored with the GitHub account canonical noreply email so Vercel can match the commit author.

## Automated regression coverage

Playwright coverage lives in `tests/e2e/github-auth.spec.ts`. The anonymous test verifies that signed-out visitors see **Continue with GitHub**. Authenticated tests verify the GitHub identity, the protected `workspace.mine` contract, the existing `WEB` project, and the Workspace settings deletion affordance.

To create a local authenticated state, run `PLAYWRIGHT_BASE_URL=https://bugforge-lyart.vercel.app pnpm e2e:auth:setup`, complete GitHub sign-in in the opened browser, and press Enter in the terminal. The resulting `playwright/.auth/github.json` file is ignored by Git and must never be committed. Run the suite with `PLAYWRIGHT_AUTH_STATE=playwright/.auth/github.json pnpm e2e`; run the signed-out smoke test independently with `pnpm e2e --grep signed-out`. CI should provide `PLAYWRIGHT_AUTH_STATE` through a protected secret or pre-generated private artifact rather than attempting to store OAuth credentials in the repository.

The production workspace deletion feature is available at **Personalize → Workspace settings**. Only workspace admins see the Delete action, the exact workspace name is required, and the server performs dependent-record cleanup in one transaction. The UI intentionally does not auto-submit deletion from automated tests; destructive production deletion should be performed by an authorized administrator after reviewing the confirmation text.

## Deletion and attachment audit

The `workspace.delete` transaction removes attachment rows before deleting their parent issues, so attachment database records cannot remain attached to an issue that the transaction successfully removes. A production audit found no attachment rows whose `issueId` points to a missing issue.

The current storage adapter now supports upload, signed read, and object deletion against the private Supabase bucket. Existing workspace deletion still removes database references only; it does not yet call object deletion for every attachment/logo/avatar key inside the transaction, so unreferenced objects remain a lifecycle-cleanup concern. They are not available through a public bucket and can no longer be reached from BugForge once their database references are removed. Project logo and avatar updates follow the same replacement boundary. The transaction also does not rewrite `userPreferences.projectOrder`; deleted project IDs may remain as harmless stale JSON entries and are filtered when the project list is rebuilt.[3] [4]

## External runtime boundary

GitHub OAuth through Supabase Auth remains unchanged by the Storage and AI work. A fresh authenticated production avatar upload proved that the existing Supabase bearer-token/tRPC authorization path can write a private object and return a signed URL without exposing a Storage policy or service-role credential to the browser. The server-side AI adapter now receives Vercel’s short-lived Function OIDC token for the external AI Gateway. It keeps the existing structured recommendation schema and explicit human apply/dismiss flow; it does not add a direct GitHub credential to Vercel.[5]
