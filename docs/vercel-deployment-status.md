# Vercel deployment status

**Last checked:** 26 August 2026

| Item | Status |
|---|---|
| Team | `davidsimon7873-4146's projects` (`team_NDe4yP0FtJ1QaohLAPLK8FLp`) |
| Project | `bugforge` (`prj_etdzqiHKGxrzIhsoUIeInQtW7LwU`) |
| Git repository | Private `Simondavid07/bugforge` repository on `main` |
| Current production deployment | **Ready** — `AiZd2t9T1SwmSBXzbXjhrXhQV5NR`, source commit `fdd74c5` |
| Stable production URL | [https://bugforge-lyart.vercel.app](https://bugforge-lyart.vercel.app) |
| Unique production URL | [https://bugforge-8e4ke7f5f-davidsimon7873-4146s-projects.vercel.app](https://bugforge-8e4ke7f5f-davidsimon7873-4146s-projects.vercel.app) |
| Database conversion | Completed and validated against dedicated Supabase PostgreSQL through a server-only transaction pooler. |
| Vercel database proof | Both production URLs returned HTTP 200 and `{"ok":true,"database":"connected"}` from `system.health` after the Supabase password reset, Vercel secret rotation, and redeployment. |
| API routing proof | The stable URL returned HTTP 200 and the expected JSON-null unauthenticated result from `auth.me`. |
| Protected values | `SUPABASE_DATABASE_URL` was rotated for Production and Preview. `JWT_SECRET` is present for Production and Preview. OAuth application settings are configured; the server-side OAuth endpoint is Production-only. |
| OAuth status | **Blocked by allowed redirect-domain configuration.** Manus OAuth rejects `bugforge-lyart.vercel.app` as an invalid redirect URI. |
| Forge storage and AI | Not transferred to Vercel and not verified externally. |

## Compatible deployment layout

The external build does not start `server/_core/index.ts`, the long-lived managed-runtime bootstrap. Instead, common request registration is isolated in `server/_core/app.ts`; Vercel imports it through `api/[...path].ts`, while the managed server continues to attach Vite/static middleware and listen on a port. `vercel.json` retains explicit API catch-all routing, restores the original API pathname in the handler, rewrites legacy `/manus-storage/*` URLs into the serverless handler, and sends non-API deep links to the Vite SPA entry point.[1] [2]

Vercel emits one Node function for the API catch-all. The reachable server import graph uses Node-compatible ESM `.js` specifiers, avoiding runtime module-resolution failures. The current production deployment confirms that the static site, function routing, and server-side PostgreSQL credentials are all active.

## What remains before calling the Vercel site fully usable

The Vercel root URL can begin login, but selecting the authenticated account returns the provider error `invalid redirect_uri: redirect_uri domain 'bugforge-lyart.vercel.app' not allowed for this project`. The OAuth application must allowlist the stable Vercel domain before authenticated workspace, issue, personalization, desktop, and mobile flows can be verified on that origin. This is an external identity-provider configuration boundary; it is not corrected by hardcoding the domain in source code.

Managed Forge storage and AI keys were intentionally not copied to the third-party deployment. Attachments, custom logos/avatars, and AI recommendation flows therefore remain managed-runtime capabilities until a compatible server-only external implementation is established and separately tested.

> The managed MySQL/TiDB deployment and its database remain intact. Retain them as the rollback route until external OAuth and the outstanding external integrations are validated.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel: Rewrites"
[2]: https://vercel.com/kb/guide/using-express-with-vercel "Vercel: Using Express.js with Vercel"
