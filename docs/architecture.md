# BugForge architecture

## Purpose and boundary

BugForge is an authenticated, workspace-scoped issue-intelligence platform. It reconstructs the core developer workflow behind Bugzilla—report, classify, assign, discuss, verify, resolve, and learn from defects—without copying Bugzilla’s interface or implementation.

Every mutable project record belongs to a project, every project belongs to a workspace, and every server procedure resolves the caller’s membership and role before reading or mutating scoped data. The browser is an interaction client; it is not the authorization boundary.

## Runtime topology

```text
React 19 + Vite browser
  ├─ Supabase Auth client: GitHub OAuth + PKCE
  ├─ Wouter routes and responsive UI
  └─ tRPC client with current Supabase bearer token
                 │
                 ▼
Vercel Node function / Express request app
  ├─ context.ts: authenticate bearer token with Supabase Auth
  ├─ routers.ts: typed tRPC procedures and Zod validation
  ├─ db.ts: Drizzle queries over node-postgres
  └─ storage.ts: server-only private Storage adapter
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
Supabase PostgreSQL   Supabase Storage
BugForge domain data  private bugforge-private bucket
       │
       └── Managed runtime and MySQL/TiDB database retained as rollback
```

The shared Express application factory in `server/_core/app.ts` is imported by the Vercel catch-all handler and the managed server. The deployment-specific entry points remain separate: Vercel serves the static Vite output and `/api/*`, while the managed runtime continues to provide its own long-lived bootstrap.

## Domain model

| Domain          | Representative records                                             | Responsibility                                                     |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Identity        | `users`                                                            | Supabase-authenticated identity mapped to a BugForge user.         |
| Workspace       | `workspaces`, `workspaceMembers`                                   | Tenant boundary and workspace administration.                      |
| Project         | `projects`, `projectMembers`, `milestones`, `components`, `labels` | Product area, membership, workflow, and issue taxonomy.            |
| Work            | `issues`, `issueLabels`, `issueLinks`, `activityEvents`            | Structured issue lifecycle and append-only audit history.          |
| Collaboration   | `comments`, `issueWatchers`, `attachments`, `notifications`        | Discussion, watchers, evidence metadata, and in-app alerts.        |
| Intelligence    | `aiRecommendations`                                                | Structured advisory drafts that never mutate issues automatically. |
| Personalization | User preferences, avatar metadata, project logo and accent data    | Per-user navigation, motion, theme, and project identity.          |

Drizzle definitions live in `drizzle/schema.ts`; query helpers live in `server/db.ts`; procedures live in `server/routers.ts`; shared types and constants live in `shared/`.

## Authorization model

Workspace roles provide broad administration while project roles control everyday issue work. The server evaluates the requested project before returning data or performing a mutation.

| Role            | Read | Report | Edit issue        | Triage/assign | Project settings | Workspace members |
| --------------- | ---- | ------ | ----------------- | ------------- | ---------------- | ----------------- |
| Viewer          | Yes  | No     | No                | No            | No               | No                |
| Reporter        | Yes  | Yes    | Own draft reports | No            | No               | No                |
| Member          | Yes  | Yes    | Yes               | No            | No               | No                |
| Triage          | Yes  | Yes    | Yes               | Yes           | No               | No                |
| Project admin   | Yes  | Yes    | Yes               | Yes           | Yes              | No                |
| Workspace admin | Yes  | Yes    | Yes               | Yes           | Yes              | Yes               |

Client-side hidden buttons are only a convenience. Procedures such as issue updates, project personalization, uploads, membership changes, workspace deletion, and AI draft review repeat their authorization checks on the server.

## Issue workflow

BugForge presents five calm, visible lanes: **Intake**, **Triage**, **In progress**, **Verify**, and **Done**. State changes produce activity events. Resolution metadata is required when work enters Done, and duplicate relationships preserve the original issue rather than replacing it.

| State       | Meaning                                                         | Typical authority                                           |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| Intake      | A new report awaits assessment.                                 | Reporter or higher to create; triage or higher to advance.  |
| Triage      | Severity, scope, ownership, and milestone are clarified.        | Triage or higher.                                           |
| In progress | Someone is accountable for implementation.                      | Triage, assignee, or administrator according to transition. |
| Verify      | A proposed resolution needs validation.                         | Assignee, triage, administrator, or verifier.               |
| Done        | Resolved, closed, or marked duplicate with resolution metadata. | Triage or higher; reopen is permission-controlled.          |

## Authentication flow

The browser starts GitHub OAuth through the Supabase Auth client using PKCE. GitHub returns to the Supabase Auth provider callback. Supabase redirects the browser to BugForge’s allowlisted `/auth/callback` route, where the client exchanges the code exactly once. The tRPC client forwards the active Supabase access token as a Bearer header.

`server/_core/supabaseAuth.ts` validates the token against Supabase Auth, maps the verified GitHub identity, preserves existing membership through the confirmed identity/email boundary, and upserts the BugForge user. No direct GitHub OAuth callback is used by the BugForge server, and no GitHub client secret is exposed to the browser or repository.

## Storage flow

New avatar, project-logo, and attachment bytes are uploaded through authorized tRPC procedures. The server validates type and size, checks the relevant workspace/project role, writes bytes to the private `bugforge-private` bucket, and stores an object key plus `supabase-storage://` marker in PostgreSQL. Reads are resolved only after authorization and return short-lived signed URLs. Legacy `/manus-storage/*` references remain readable for compatibility with rollback data.

## Human-reviewed intelligence

The compact recommendation service returns structured suggestions for issue summary, severity, labels, duplicate candidates, and reproducible steps. It is advisory only. Drafts are stored with `pending_review` status and must be explicitly accepted or dismissed by an authorized human. The external Vercel AI Gateway experiment was removed by owner direction; the working managed AI adapter remains unchanged.

## Deployment boundary

The Vercel deployment uses serverless API routing, protected Supabase PostgreSQL configuration, and private Storage configuration. The managed deployment and its MySQL/TiDB database remain available as rollback. Database migration and runtime cutover are documented separately so a hosting rollback does not require destructive database reversal.

## References

[1]: https://github.com/bugzilla/bugzilla "Bugzilla reference repository"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[3]: https://supabase.com/docs/guides/storage "Supabase Storage documentation"
[4]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
[5]: https://vercel.com/docs/routing/rewrites "Vercel rewrites documentation"
