# Troubleshooting

## GitHub login returns a callback or redirect error

Confirm that GitHub’s OAuth callback is the Supabase Auth callback and that the Vercel `/auth/callback` URL is present in Supabase Auth’s redirect allowlist. The browser must exchange the PKCE code once. Do not add a direct GitHub OAuth callback to the BugForge server unless the authentication architecture is intentionally redesigned.

## The app loads but `auth.me` is null

Check that the browser has a current Supabase session and that the tRPC client forwards its access token as a Bearer header. Confirm the Supabase project URL and browser-safe key are configured for the same project. A public `auth.me` result of JSON `null` is expected when no valid session is present.

## System health reports a database problem

Use the bounded health endpoint first, then inspect server runtime logs without printing environment values. Confirm that `SUPABASE_DATABASE_URL` is the password-bearing transaction-pooler URL and that the password has not expired or been rotated without updating protected deployment settings. Do not place the password in a browser variable or commit it to a log.

## Images or attachments do not render

Confirm that the Storage bucket is private, the server has `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` matches `bugforge-private`. Verify that the request reaches the authorized tRPC path and that the database row contains a storage marker or a supported legacy managed path. A private marker must be resolved to a signed URL after authorization; it should not be used directly as an image URL.

## Vercel API routes return a static-page error

Confirm that the Vercel catch-all handler receives the original `/api/trpc` pathname, that the rewrite rules are present, and that the serverless bundle resolves Node ESM imports. Run `pnpm build:vercel` locally and inspect the Vercel deployment logs. Do not fix an API routing problem by exposing database credentials to the client.

## A build fails after a server change

Run `pnpm check`, `pnpm test`, `pnpm build:vercel`, and `pnpm build:managed`. Shared server imports affect both deployments. If the Vercel build is broken but the managed runtime is healthy, use the managed deployment as rollback while correcting the source. Do not delete or reverse the Supabase database during an application-build incident.

## A recommendation appears wrong

AI output is advisory and may be incorrect. Review the source issue, severity, labels, duplicate candidates, and reproducible steps. Use the explicit accept or dismiss controls. A recommendation must remain a pending human-review draft until a permitted user chooses to apply it.

## Escalation checklist

Record the deployment commit, route, timestamp, HTTP status, browser state, and non-secret log message. Redact tokens, cookies, signed URL query strings, passwords, and personal data before sharing an issue. Include whether the managed rollback remains healthy and whether the problem reproduces locally.

## References

[1]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"
[2]: https://vercel.com/docs/functions "Vercel Functions documentation"
