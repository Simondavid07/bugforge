# BugForge Integration Status

**Last verified:** 26 August 2026

BugForge currently uses the managed application database supplied through `DATABASE_URL`. Its Drizzle configuration is explicitly set to the **MySQL dialect**, so the deployed runtime is not connected to Supabase.

| Area | Verified state | Required action to change it |
|---|---|---|
| Application database | Managed MySQL/TiDB through the current project environment | A Supabase migration would require a deliberate database-provider migration, PostgreSQL schema adjustments, data migration, new runtime credentials, and validation. It has not been performed. |
| Supabase account integration | Dedicated project **BugForge** is active and healthy: ref `zznvjtdspjampmztrunx`, region `ap-south-1`, PostgreSQL 17. Its public schema is empty and isolated from Lock Note. | Keep the existing `clonefest-2` Lock Note project untouched. BugForge runtime remains on managed MySQL/TiDB until a deliberate MySQL-to-Postgres application migration is implemented and validated. |
| GitHub authentication | The GitHub CLI is authenticated as `Simondavid07`. | No action is currently required. |
| Git repository remote | Private repository [`Simondavid07/bugforge`](https://github.com/Simondavid07/bugforge) was created and the `main` branch was pushed. The managed project `origin` remains unchanged; GitHub is tracked as a separate `github` remote. | Push future code changes to `github/main` when you want the GitHub copy updated. |

## Project accent behavior

The project accent selector is intentionally disabled until a workspace has a project selected. The authorized **Orbit Labs / Web Console** workspace was created for the signed-in administrator, and its accent was verified as persisting to the project record and visibly refreshing the shell selection to sage. The server validates the color and requires project-admin authorization; non-admin users receive a clear permission error.
