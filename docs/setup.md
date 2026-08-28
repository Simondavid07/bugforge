# BugForge setup guide

This guide describes how to run BugForge locally without copying production credentials into source control. The application has a React/Vite client, an Express/tRPC server, Drizzle ORM, and PostgreSQL runtime configuration.

## Prerequisites

Install Node.js 22 or a compatible current LTS release, pnpm 10, Git, and access to a non-production PostgreSQL database. A dedicated Supabase project can provide PostgreSQL and Supabase Auth for an external deployment. Do not use the separate Lock Note project for BugForge.

## Installation

```bash
git clone https://github.com/Simondavid07/bugforge.git
cd bugforge
pnpm install
pnpm dev
```

The development server manages the active port. Application code must read the runtime port rather than hard-code a deployment-specific value.

## Environment configuration

Use the project’s protected secret manager or a local untracked `.env` file. Never commit `.env`, passwords, service-role keys, OAuth secrets, access tokens, or customer-data exports.

| Variable                          | Required for       | Notes                                                                                            |
| --------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `SUPABASE_DATABASE_URL`           | PostgreSQL runtime | Use the password-bearing transaction-pooler URL. Direct host and port values are not sufficient. |
| `SUPABASE_SERVICE_ROLE_KEY`       | Private Storage    | Server-only. Never import it from client code or expose it in a Vite variable.                   |
| `SUPABASE_STORAGE_BUCKET`         | Private Storage    | Use `bugforge-private` for the dedicated project.                                                |
| `VITE_SUPABASE_URL`               | Browser Auth       | Supabase project URL used by the browser client.                                                 |
| `VITE_SUPABASE_ANON_KEY`          | Browser Auth       | Browser-safe Supabase public key.                                                                |
| `JWT_SECRET`                      | Server/framework   | Protected signing secret.                                                                        |
| `VITE_APP_TITLE`, `VITE_APP_LOGO` | Branding           | Browser-safe presentation values.                                                                |

GitHub OAuth credentials are configured inside Supabase Auth’s GitHub provider settings. The provider callback is the Supabase Auth callback; the post-auth redirect is BugForge’s `/auth/callback` route.

## Development loop

Run `pnpm check` after TypeScript changes and `pnpm test` after behavior changes. Use `pnpm format` for formatting. For database work, update `drizzle/schema.ts`, run `pnpm db:generate`, review the generated SQL, apply it through the approved migration workflow, and verify the resulting schema. Do not use ad hoc destructive SQL as a shortcut.

Frontend requests should use the typed tRPC client. Server procedures belong in `server/routers.ts` or a feature module, reusable queries belong in `server/db.ts`, and authorization must be checked before scoped data is returned. Keep browser-safe values under `VITE_*`; all service credentials remain server-side.

## Build commands

```bash
pnpm check
pnpm test
pnpm build:vercel
pnpm build:managed
```

`build:vercel` validates the external serverless/static artifact. `build:managed` validates the retained rollback runtime. Both are expected to remain healthy when changing a shared server module.

## Safe local data practices

Use a dedicated development workspace or test database. Never seed fake testimonials, customer reviews, ratings, or other user-generated content. Avoid uploading personal images into the repository. Storage round-trip tests should use tiny temporary fixtures, clean them up, and never commit the bytes.

## References

[1]: https://pnpm.io/cli/install "pnpm installation command"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub setup"
[3]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
