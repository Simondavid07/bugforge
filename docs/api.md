# API contract

BugForge exposes its application contract through tRPC under `/api/trpc`. The browser uses the generated tRPC client rather than maintaining a parallel handwritten REST client. Procedures validate input with Zod and return typed data through the shared router.

## Namespaces

| Namespace         | Representative procedures                                                                     | Access boundary                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `auth`            | `me`, `logout`                                                                                | `me` is safe for anonymous requests; protected data requires a verified Supabase session.         |
| `workspace`       | `mine`, `create`, `delete`                                                                    | Authenticated user; deletion requires workspace administrator confirmation and server safeguards. |
| `project`         | `overview`, `addMember`, `updateWorkflow`, `updateAccent`                                     | Authenticated project/workspace membership with role thresholds.                                  |
| `issues`          | `list`, `board`, `get`, `create`, `update`, `transition`, `addComment`, `toggleWatch`, `link` | Project-scoped membership and issue-operation permissions.                                        |
| `views`           | `list`, `save`                                                                                | Authenticated user’s saved searches and filters.                                                  |
| `personalization` | `get`, `updatePreferences`, `uploadImage`                                                     | Current user plus project-admin checks for project assets and accents.                            |
| `notifications`   | `list`, `markRead`                                                                            | Current authenticated user’s in-app notification records.                                         |
| `attachments`     | `upload`                                                                                      | Authorized issue/project scope, validated type and size, private server-side Storage.             |
| `ai`              | `analyzeIssue`, `applyRecommendation`, `dismissRecommendation`                                | Project membership for analysis; explicit human review and issue-edit permission for applying.    |

## Request behavior

Requests to protected procedures must carry the current Supabase Auth access token as a Bearer header. The server builds request context by validating that token and resolving the BugForge user. Callers cannot select another user by passing a user ID in procedure input.

Project-scoped procedures resolve the project before returning records. Role checks run server-side even when the corresponding button is hidden in the interface. Failed validation or authorization should return a typed tRPC error without leaking database details or credentials.

## Storage responses

Private Storage records are represented internally by an object key and a non-public marker. Authorized reads return a short-lived signed URL; the service-role key and marker are not intended as browser-facing permanent URLs. Legacy managed-storage paths may remain readable for rollback compatibility.

## AI responses

`ai.analyzeIssue` produces a structured recommendation draft. The draft includes advisory fields such as summary, severity, labels, duplicate candidates, reproducible steps, confidence, and limitations. `applyRecommendation` and `dismissRecommendation` preserve the explicit human decision in activity history. The server never treats the model output as an automatic issue mutation.

## Adding a procedure

Define input schemas close to the procedure, reuse query helpers from `server/db.ts`, check authentication and project/workspace role before the first scoped read, handle unavailable database behavior explicitly, and add a focused test. Update this document when a new namespace or security boundary is introduced.

## References

[1]: https://trpc.io/docs "tRPC documentation"
[2]: https://supabase.com/docs/guides/auth "Supabase Auth documentation"
