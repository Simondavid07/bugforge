# BugForge visual documentation

These diagrams and charts are maintained as documentation artifacts. They describe the implemented boundaries rather than presenting a marketing illustration. The procedure chart is an inventory of the current router namespaces in `server/routers.ts`; it is not a usage or performance metric.

## Runtime architecture

```mermaid
flowchart LR
  B[Browser\nReact + Vite + tRPC] --> A[Supabase Auth\nGitHub OAuth + PKCE]
  B -->|Bearer token| V[Vercel Node Function\nExpress + tRPC]
  A -->|verified identity| V
  V --> R[RBAC + Zod validation]
  R --> D[Drizzle + node-postgres]
  D --> P[(Supabase PostgreSQL)]
  R --> S[Server-only Storage adapter]
  S --> T[(Private bugforge-private bucket)]
  V -. shared request app .-> M[Managed runtime\nrollback]
  M -. rollback data .-> X[(Managed MySQL/TiDB)]
```

## Issue lifecycle

```mermaid
stateDiagram-v2
  [*] --> Intake
  Intake --> Triage: classify and scope
  Triage --> InProgress: assign ownership
  InProgress --> Verify: propose resolution
  Verify --> Done: verify result
  Verify --> InProgress: needs more work
  Done --> InProgress: authorized reopen
  Triage --> Done: authorized duplicate/closure
```

Each transition is project-scoped, permission-checked on the server, and recorded in activity history. The visual lane names are **Intake**, **Triage**, **In progress**, **Verify**, and **Done**.

## Authentication sequence

```mermaid
sequenceDiagram
  participant U as User browser
  participant S as Supabase Auth
  participant G as GitHub
  participant F as BugForge API

  U->>S: signInWithOAuth(github) with PKCE
  S->>G: provider authorization
  G-->>S: provider callback
  S-->>U: redirect to /auth/callback with code
  U->>S: exchangeCodeForSession(code)
  U->>F: tRPC request with Bearer token
  F->>S: validate /auth/v1/user
  S-->>F: verified identity
  F-->>U: scoped BugForge data
```

The GitHub OAuth App callback is the Supabase Auth callback. The Vercel `/auth/callback` page is the post-auth browser route and exchanges the one-time PKCE code.

## Private Storage flow

```mermaid
flowchart TD
  U[Signed-in browser] --> Q[Authorized tRPC upload]
  Q --> V{Validate type, size, and scope}
  V -- no --> E[Typed error]
  V -- yes --> P[Server-only Supabase Storage write]
  P --> DB[(PostgreSQL metadata\nkey + supabase-storage marker)]
  DB --> R[Authorized read]
  R --> Z[15-minute signed URL]
  Z --> U
```

No browser Storage policy or service-role credential is required. Legacy managed-storage paths remain readable for compatibility with existing rollback data.

## Current tRPC procedure inventory

The following counts are derived from the named procedures in `server/routers.ts` and help readers understand the application surface. They are not claims about traffic volume or feature quality.

```mermaid
xychart-beta
  title "BugForge tRPC procedure inventory"
  x-axis ["auth", "work", "project", "issues", "views", "prefs", "notify", "files", "ai"]
  y-axis "procedures" 0 --> 10
  bar [2, 3, 4, 9, 2, 3, 2, 1, 3]
```

| Namespace | Procedure count | Primary responsibility |
| --- | ---: | --- |
| `auth` | 2 | Session-facing identity and logout. |
| `workspace` | 3 | Workspace discovery, creation, and protected deletion. |

| `project` | 4 | Overview, membership, workflow, and accent settings. |
| `issues` | 9 | Search, board, detail, mutation, comments, watches, and links. |
| `views` | 2 | Saved searches and filters. |
| `personalization` | 3 | Preferences and image uploads. |
| `notifications` | 2 | Notification list and read state. |
| `attachments` | 1 | Authorized private file upload. |
| `ai` | 3 | Analyze, apply, and dismiss human-reviewed drafts. |
| **Total** | **29** | **Typed application procedures inventoried in the primary router.** |

## References

[1]: https://mermaid.js.org/intro/ "Mermaid documentation"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[3]: https://supabase.com/docs/guides/storage "Supabase Storage documentation"
