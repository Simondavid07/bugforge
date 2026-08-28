# BugForge demonstration script

This walkthrough is designed for a short evaluator or stakeholder demonstration. Use a seeded or authorized workspace only; do not expose credentials or create unnecessary production data.

## 1. Establish the problem

Begin with the workspace overview. Explain that BugForge turns a noisy defect report into a scoped engineering decision: capture the signal, clarify its impact, assign responsibility, collaborate around evidence, verify the result, and preserve the history.

## 2. Show discovery

Open **Issues** and demonstrate keyword search, sorting, pagination, saved searches, and quick filters. Use the Cmd/Ctrl+K command palette to jump between routes, projects, saved views, and recent issues. Explain that discovery is designed for both a single report and a growing project backlog.

## 3. Walk the lifecycle

Open **Workboard** and explain the five visible lanes: Intake, Triage, In progress, Verify, and Done. Open an issue and show severity, priority, owner, labels, component, milestone, description, reproducible steps, activity history, and status transition controls. Emphasize that transition permissions are enforced on the server.

## 4. Show collaboration

Use the issue desk to demonstrate threaded comments, mentions, watchers, related and duplicate links, and attachment metadata. Explain that the activity timeline keeps the decision history connected to the work item and notifications keep people aware without requiring an external chat system.

## 5. Show intelligence responsibly

Open the AI recommendation area only with an authorized configured runtime. Explain that the assistant produces a structured draft for summary, severity, labels, duplicate candidates, and reproducible steps. Point out the **AI draft—review before applying** language and accept/dismiss controls. BugForge never applies an AI recommendation automatically.

## 6. Show insight

Open **Insights** to demonstrate severity distribution, issue aging, throughput, triage debt, overdue work, and release-readiness signals. Clarify that these are decision-support indicators rather than guarantees about a release.

## 7. Show personalization and accessibility

Open **Personalize**. Select a project accent, confirm the current color feedback, and open the custom picker. Show navigation/project reorder controls, theme selection, and still/soft/expressive motion preferences. Mention keyboard support, visible focus states, responsive layout, and reduced-motion safeguards.

## 8. Close with the security boundary

Explain that GitHub login is mediated by Supabase Auth, server procedures enforce workspace/project RBAC, PostgreSQL stores the typed domain data, and new files use private Supabase Storage with short-lived signed reads. The managed deployment remains a rollback path, and secrets are configured outside source control.
