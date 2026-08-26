# BugForge Architecture

## Product boundary

BugForge is an authenticated, workspace-scoped issue intelligence system. Every mutable record belongs to a project, every project belongs to a workspace, and every server procedure verifies membership before returning or mutating project data. The system treats artificial intelligence as an advisory service: it can prepare structured recommendations, but only a signed-in project member can apply a recommendation to an issue.

| Domain | Core records | Access rule |
| --- | --- | --- |
| Identity | `users`, `workspaceMembers`, `projectMembers` | A user is recognized through Manus OAuth and must be an active workspace member. |
| Scope | `workspaces`, `projects`, `milestones`, `components`, `labels` | A project is accessible only to its members or workspace administrators. |
| Work | `issues`, `issueLabels`, `issueLinks`, `activityEvents` | Issue reads and writes are project-scoped and activity is append-only. |
| Collaboration | `comments`, `issueWatchers`, `attachments`, `notifications` | Mention, watcher, and status events create in-app notification records only for authorized recipients. |
| Intelligence | `aiRecommendations` | Draft recommendations retain their source issue and can only be accepted or dismissed by a member with issue-edit permission. |

## Permission model

Workspace roles express broad administration. Project roles express day-to-day authority. A server procedure resolves the caller’s role in the requested project before action; client-side affordances never replace this check.

| Role | Read | Report | Edit issue fields | Triage or assign | Manage project settings | Manage workspace members |
| --- | --- | --- | --- | --- | --- | --- |
| Viewer | Yes | No | No | No | No | No |
| Reporter | Yes | Yes | Own draft reports | No | No | No |
| Member | Yes | Yes | Yes | No | No | No |
| Triage | Yes | Yes | Yes | Yes | No | No |
| Project admin | Yes | Yes | Yes | Yes | Yes | No |
| Workspace admin | Yes | Yes | Yes | Yes | Yes | Yes |

## Issue workflow

The initial project workflow is configurable through a `workflowState` field and stored transition events. BugForge exposes five visible lanes rather than copying a legacy state machine: **Intake**, **Triage**, **In progress**, **Verify**, and **Done**. Resolution metadata is required when a work item enters Done, while duplicate links are stored as relationships rather than by overwriting the original report.

| State | Purpose | Entry policy | Exit policy |
| --- | --- | --- | --- |
| Intake | New report awaiting assessment | Reporter or higher | Triage role or higher |
| Triage | Scope, severity, owner, and milestone are confirmed | Triage role or higher | Triage role or higher |
| In progress | Work has an accountable assignee | Triage role or higher | Assignee, triage, or admin |
| Verify | Resolution needs validation | Assignee, triage, or admin | Triage, admin, or verifier role |
| Done | Resolved, closed, or marked duplicate | Triage role or higher | Reopen requires triage role or higher |

## Human-reviewed AI assistance

The simple Manus 1.6 experience is represented by a compact `gpt-5-mini` structured-response implementation because the live platform catalog does not expose a model identifier named `Manus 1.6`. The UI labels all output as **AI draft — review before applying**. The service returns a compact JSON object containing a concise summary, suggested severity, suggested labels, candidate duplicate references, reproducible steps, confidence, and limitations. It never mutates the issue directly. A human accepts individual fields or dismisses the complete draft, and that action is added to the activity history.

## Evidence files

Attachment bytes are placed in managed storage, while the database keeps only a project-scoped attachment record containing object key, URL, filename, content type, size, issue reference, and uploader. The server validates project membership and the allowed type before accepting an upload reference. Attachment cards present file metadata and do not expose arbitrary external URLs as trusted content.

## Experience structure

The authenticated workspace uses persistent navigation for **Overview**, **Issues**, **Boards**, **Analytics**, and **Notifications**. The overview condenses release readiness, personal work, triage debt, and priority signals. Issue lists centralize discovery; the issue desk pairs evidence, discussion, and AI draft review in one place. A Memphis visual system makes hierarchy explicit without weakening contrast, keyboard focus, or responsive layouts.
