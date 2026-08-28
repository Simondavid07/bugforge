# BugForge — submission-ready product brief

## Product statement

**BugForge** is a modern issue-intelligence workspace that reconstructs the core developer workflow behind Bugzilla for contemporary teams: capture a reliable defect signal, triage it collaboratively, make ownership visible, and decide whether work is ready to ship with evidence rather than intuition. It takes inspiration from structured issues, workflow, search, attachments, and reporting while using an independent information architecture and a calm, responsive interface.

> **Design premise:** A bug report should create a clear decision trail, not disappear into a queue.

## Evaluation map

| Product pillar                | Implemented capability                                                                                                                                                          | Demonstrable value                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Secure scope                  | GitHub OAuth through Supabase Auth, workspace membership, project roles, and server-side scope checks.                                                                          | Users see and mutate only the work authorized by their workspace and project role. |
| Structured issue record       | Severity, priority, workflow state, reporter, assignee, labels, components, milestones, expected and actual behavior, environment, reproducible steps, and resolution metadata. | Reports carry enough context to triage and verify without a separate spreadsheet.  |
| Flow and accountability       | Intake, Triage, In progress, Verify, and Done lanes; personal/team workboards; activity history; release blockers and overdue signals.                                          | Ownership and workflow debt remain visible at the same time as individual issues.  |
| Collaborative evidence        | Threaded comments, replies, mentions, watchers, related/duplicate links, notifications, and validated attachment metadata.                                                      | Context and proof stay connected to the issue they explain.                        |
| Discovery and insight         | Search, filters, sorting, pagination, saved searches, Cmd/Ctrl+K navigation, severity, aging, throughput, and release-readiness views.                                          | Teams can find the right thread and understand backlog health quickly.             |
| Personalization               | Theme preference, project accents, avatars, project logos, reorderable navigation/projects, and motion intensity.                                                               | The workspace is identifiable and adaptable without sacrificing accessibility.     |
| Human-controlled intelligence | Structured recommendation drafts for summaries, severity, labels, duplicate candidates, and reproducible steps.                                                                 | AI reduces preparation effort while a human retains the decision.                  |

## Honest AI disclosure

The AI assistant is advisory. Recommendations are visibly labelled, stored as drafts, and require explicit human accept or dismiss actions before any issue field changes. The external Vercel AI Gateway experiment was removed by owner direction; the working managed AI adapter remains unchanged. BugForge does not claim that AI understands an issue, guarantees severity, prevents screenshots, or prevents copying of plaintext.

## Architecture and delivery

The implementation uses React 19, TypeScript, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, and PostgreSQL. End-user identity uses GitHub OAuth mediated by Supabase Auth and browser PKCE. External production uses the dedicated BugForge Supabase PostgreSQL project and a private Supabase Storage bucket for new files. Vercel hosts the serverless/static deployment, while the managed deployment and MySQL/TiDB database remain available as rollback.

The design is a warm editorial issue workspace: paper and ink surfaces, terracotta, rose, sage, and dusty-gold signals, serif display type, quiet interface typography, restrained motion, visible focus states, and reduced-motion safeguards. It is deliberately not a Bugzilla UI reproduction.

## Suggested demonstration

Sign in with GitHub, open the workspace overview, search and filter an issue, inspect the issue desk, move through the Workboard lanes, add a threaded comment and watcher, open Insights, then use the Personalize panel to select a project accent and reorder navigation. If the managed AI runtime is configured for the demonstration, show one structured draft and the explicit review controls. Close by explaining the server-side RBAC, private Storage signed reads, PostgreSQL boundary, and retained rollback deployment.

## References

[1]: https://github.com/bugzilla/bugzilla "Bugzilla reference repository"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[3]: https://supabase.com/docs/guides/storage "Supabase Storage documentation"
