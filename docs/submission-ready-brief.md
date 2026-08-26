# BugForge — Submission-Ready Product Brief

## Product statement

**BugForge** is a secure, AI-assisted issue intelligence workspace that rebuilds the core Bugzilla problem for contemporary teams: capture a reliable defect signal, triage it collaboratively, make work ownership visible, and decide whether a release is ready with evidence rather than intuition. It takes inspiration from Bugzilla’s enduring structured issue, workflow, search, attachment, and reporting concerns while deliberately using an independent information architecture and a vivid operational experience rather than reproducing the legacy interface.[1]

> **Design premise:** Reporting a bug should create a clear decision trail, not an inbox item that disappears into a queue.

| Product pillar | What BugForge implements | Why it matters |
| --- | --- | --- |
| Secure scope | Manus OAuth, workspace members, project roles, and server-side project checks | Data visibility and actions remain constrained to the relevant workspace and project. |
| Structured issue record | Severity, priority, status, reporter, assignee, labels, components, milestones, expected/actual behavior, environment, and reproducible steps | Reports carry enough context to triage and verify without a separate spreadsheet. |
| Flow and accountability | Intake → triage → in progress → verify → done, required close resolution, activity history, dedicated personal/team risk boards | Teams can see ownership, queue debt, blockers, and flow at the same time. |
| Collaborative proof | Threaded replies, explicit member mentions, watchers, issue links, and validated evidence references | Conversations, dependencies, and supporting files remain attached to the issue they explain. |
| Decision intelligence | Search, filters, user-selectable sort, pagination, saved views, project health, aging, severity, throughput, and release radar | Discovery and release readiness are built into the work surface. |
| Human-controlled AI | Compact-model draft summaries, severity/label recommendations, duplicate candidates, and test steps | AI accelerates preparation but never silently changes a record. |

## AI model disclosure

The user requested a simple “Manus 1.6” setup. The live model catalog available to the project did **not** contain a model ID called `Manus 1.6`; BugForge therefore resolves the current compact `gpt-5-mini` option from the live catalog and retains the chosen model with every recommendation. The interface labels output as **AI draft — review first**, supports field-by-field acceptance or dismissal, and records the human decision in issue activity. This keeps the product honest about model availability while preserving the requested lightweight-assistant experience.

## Architecture and delivery notes

The stack is React 19, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, MySQL-compatible storage, Manus OAuth, managed S3-style evidence storage, and a server-only model proxy. The data model includes workspaces, project memberships, issue metadata, labels, links, comments, watchers, notifications, attachments, saved views, activity events, and AI recommendations. Database migrations have been generated and applied.

The visual direction is a responsive **neo-brutalist issue command center**: a peach operating field, hard black structure, offset shadows, technical micro-labels, heavyweight headlines, and purposeful yellow/mint/lilac signals. Color has fixed meaning: yellow indicates mission or attention, mint indicates safe action or assistance, lilac marks selection, peach defines the workspace, and white denotes live data surfaces.

## Full implementation prompt

> Build **BugForge**, a modern, secure, full-stack software issue tracking workspace inspired by the problem domain of Bugzilla but with a completely independent product and interface. Use React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, a MySQL-compatible database, OAuth authentication, and managed object storage. Create authenticated workspaces with workspace and project memberships; enforce roles on the server for every project-scoped read or mutation. Model projects, configurable workflows, milestones, components, labels, issues, issue labels, issue links, comments with replies, watchers, evidence metadata, saved views, notifications, activity history, and AI recommendation drafts. Structured issues must include severity, priority, status, assignee, reporter, labels, components, milestones, expected result, actual result, environment, reproducible steps, due date, and release-blocker state. Implement searchable, filterable, sortable, paginated issue discovery with user saved views; workflow lanes; personal assigned work; team views for untriaged, overdue, and release-blocking work; analytics for health, severity, aging, throughput, and release readiness; in-app notifications for explicit project-member mentions, assignments, watchers, and watched status changes; validated evidence uploads for PNG/JPG/WebP/TXT/JSON/PDF under 5 MB; and a human-review-only AI assistant. The AI must return structured draft data for summary, severity, labels, duplicate candidates, reproducible steps, caveats, and confidence, never mutate issues automatically, and allow only explicit accept/dismiss decisions recorded in activity. Make the interface keyboard-accessible, responsive, include light/dark theming, clear loading/empty/error states, and use a vibrant neo-brutalist Memphis aesthetic: peach ground, mint/lilac/yellow geometric signals, bold uppercase black typography, black dots/diamonds/lines, and hard offset shadows. Do not recreate Bugzilla’s visual UI; create a distinctive, energetic issue command center.

## Demo flow

First, sign in and create a workspace plus project. Then capture a structured issue from the explorer, add evidence and a threaded note, mention an explicit project member, follow the issue, move it through the workflow, ask for an AI draft, choose which draft fields to apply, save an issue view, inspect personal/team workboards, and finish with the analytics and notifications surfaces.

## References

[1] [Bugzilla official source repository](https://github.com/bugzilla/bugzilla)
