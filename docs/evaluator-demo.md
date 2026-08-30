# Evaluator demo workspace

This is a **synthetic demonstration plan**, not customer data. It is designed to make the existing BugForge workflows visible during judging without inserting records into the production Supabase database. The source fixture is [`evaluator-demo-dataset.json`](evaluator-demo-dataset.json); it contains eight fictional issues across all five lifecycle states, one release blocker, collaboration labels, Storage/security topics, analytics topics, and an AI-review example.

## Demonstration dataset

| Scenario | Example records | What the evaluator should observe |
| --- | --- | --- |
| Intake and triage | `WEB-101`, `WEB-108` | New reports appear in Intake with severity, priority, labels, and a clear next action. |
| Ownership and active work | `WEB-103` | A critical release blocker is visible in In progress and contributes to release attention. |
| Verification | `WEB-104` | A private-Storage issue can move to Verify and demonstrate evidence handling. |
| Resolution and links | `WEB-105`, `WEB-106` | Done items demonstrate resolution, duplicate/related context, and completed-work analytics. |
| Personalization and accessibility | `WEB-102` | Project accent and keyboard-oriented settings are relevant to a real workflow rather than isolated decoration. |
| Human-reviewed intelligence | `WEB-107` | The AI draft is shown as a recommendation that requires explicit review before application. |

## Recommended live walkthrough

The JSON file is a **staging/evaluator fixture**, not an automatic seed command. If a non-production workspace is prepared from it, identify the **synthetic demo** label in the workspace/project context and never present the records as real customer activity.

1. Open the authenticated staging workspace populated from this fixture.
2. Open the Overview and point out the project selector, Quick find, New issue action, and status summary.
3. Use Issues to open `WEB-101`, review the structured report fields, then assign it and move it from Intake to Triage.
4. Open Workboard and show the five lanes: Intake, Triage, In progress, Verify, and Done. Move one authorized record to the next state and point out that the server owns the transition check.
5. Open `WEB-103` to show a release blocker and explain how it appears in Overview and Insights.
6. Open an issue with a collaboration label, add a comment, watcher, or related link, and show the resulting activity or Inbox notification.
7. Open an AI recommendation on `WEB-107`. Review the draft, explain why it is not automatic, and only apply it if the evaluator wants to see the explicit human gate.
8. Open Insights and connect open issues, severity mix, release attention, and aging lanes to the records the evaluator just saw.
9. Open Personalize to show project accent, theme, motion, ordering, and private image controls.

## Data safety boundary

The JSON fixture is documentation and staging input only. It is not a production seed command, does not contain credentials, and must not be inserted into the owner’s live database without an explicit environment-specific migration plan. The screenshots in the README intentionally show empty values, while this fixture exists to explain how a populated demonstration should be prepared.
