# BugForge

> **Modern issue intelligence for teams that need clarity, not ceremony.**

BugForge is a Bugzilla-inspired issue-tracking platform rebuilt around a calm, collaborative workspace. It turns incoming reports into structured, project-scoped work, then connects triage, delivery, verification, collaboration, analytics, and notifications in one focused experience.

The product is an independent reconstruction, not a Bugzilla clone. It keeps the core lifecycle problem — capturing, prioritizing, assigning, discussing, resolving, and learning from defects — while rethinking the interaction model with a responsive editorial interface, keyboard-first discovery, project personalization, and human-reviewed AI assistance.

[![Live Demo](https://img.shields.io/badge/Live_Demo-bugforge--lyart.vercel.app-black?logo=vercel)](https://bugforge-lyart.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-[FILL_IN_COUNT]_Passing-brightgreen?logo=vitest)](#-automated-test-suite)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%2B_Storage-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-[FILL_IN]-lightgrey)](#license-and-attribution)

---

## 📑 Table of Contents

1. [⚡ Quick Start for Judges](#-quick-start-for-judges)
2. [🧭 Worked Example — One Issue, Start to Finish](#-worked-example--one-issue-start-to-finish)
3. [🏆 What Makes BugForge Different](#-what-makes-bugforge-different)
4. [🔄 Issue Lifecycle & State Machine](#-issue-lifecycle--state-machine)
5. [🏗️ Architecture](#️-architecture)
6. [🔐 Authentication & Security](#-authentication--security)
7. [🧪 Automated Test Suite](#-automated-test-suite)
8. [💻 Local Development](#-local-development)
9. [⚙️ Environment Configuration](#️-environment-configuration)
10. [📚 Documentation Index](#-documentation-index)
11. [📄 License](#-license-and-attribution)

---

## ⚡ Quick Start for Judges

### Option 1 — Live Hosted Demo (Zero Setup)

| Resource | Link |
|---|---|
| **Live Web Application** | <https://bugforge-lyart.vercel.app> |
| **Demo login** | [FILL IN: e.g. "Continue with GitHub" using the provided judge account — see [`docs/evaluator-demo.md`](docs/evaluator-demo.md) for the exact credentials/steps] |
| **Seeded demo workspace** | [FILL IN: name of the pre-populated workspace/project a judge lands in after login — must contain real issues, comments, and activity, not an empty state. Fixture spec: [`docs/evaluator-demo.md`](docs/evaluator-demo.md)] |

> The demo workspace is pre-seeded with **[FILL IN: e.g. 40 synthetic issues across 3 projects]**, including at least one issue in every lifecycle lane, threaded comments, watchers, and one AI-recommendation example. This dataset is clearly labeled synthetic and does not represent real customer data.

### Option 2 — Run the Test Suite (No Database Required)

```
git clone https://github.com/Simondavid07/bugforge.git
cd bugforge
pnpm install
pnpm test
```

> All [FILL IN: N] tests run in ~[FILL IN: X]s. See [Automated Test Suite](#-automated-test-suite) for the full breakdown.

### Option 3 — Run Locally

```
git clone https://github.com/Simondavid07/bugforge.git
cd bugforge
pnpm install
pnpm dev
```

Then open the printed local URL. See [Local Development](#-local-development) for environment setup.

---

## 🧭 Worked Example — One Issue, Start to Finish

This is the exact path a judge should follow on the live demo to see the full product in under two minutes.

1. **Sign in** at the Overview screen → note the project switcher, Quick find (`Cmd/Ctrl+K`), and New issue button.
2. **Open `[FILL IN: e.g. BUG-142 "Signed URL expires before download completes"]`** in Issues — a real, populated issue with severity, priority, assignee, reporter, labels, and reproduction steps already filled in.
3. **Move it through the workflow**: Intake → Triage (watch the resolution/assignment fields become required) → In progress → Verify → Done. Each transition is permission-checked server-side — try an invalid jump as a lower-privileged role to see it rejected.
4. **Add a comment and a watcher**, then open the Activity tab to see the immutable history entry generated automatically.
5. **Open the linked duplicate/related issue** to see relationship tracking in action.
6. **Trigger the AI recommendation** on a fresh issue — see the structured draft (summary, severity, labels, duplicate candidates) and the explicit "Apply" step that requires human confirmation before anything is written.
7. **Switch to Workboard** to see the same issue reflected in its lifecycle lane, then **Insights** to see it contribute to severity distribution, aging, and release-readiness signals.
8. **Toggle dark/light theme and a project accent color**, then navigate the whole flow again using only the keyboard.

*(Fill in real issue IDs / screenshots or a short GIF per step once the seeded demo dataset is live — this section is the single highest-leverage addition for the "Problem Understanding" and "Demo Quality" rubric categories.)*

For the exact fixture fields and the full evaluator runbook this section is based on, see [`docs/evaluator-demo.md`](docs/evaluator-demo.md). For a shorter guided version aimed at showcasing core value, see [`docs/demo-script.md`](docs/demo-script.md).

---

## 🏆 What Makes BugForge Different

Not just visual polish — these are the mechanisms a judge can inspect and verify.

### 1. Human-in-the-loop AI triage (not autopilot)

AI recommendations are computed as structured drafts — summary, severity, label suggestions, duplicate candidates, reproduction-step cleanup — and are **never auto-applied**. [FILL IN: describe the actual mechanism — e.g. "Duplicate candidates are surfaced via `[similarity method / model / threshold]`, applied only when trigram/embedding similarity exceeds `[X]`."] This is a deliberate trust boundary, not a missing feature: every AI suggestion requires an explicit human "Apply" action, logged in the activity trail like any other change.

### 2. Server-side, project-scoped RBAC on every request

Every tRPC procedure resolves workspace/project membership and role **before** returning data or a signed Storage URL — see [`server/_core/context.ts`](server/_core/context.ts). Client-side controls are convenience only; the enforcement boundary is entirely server-side, backed by PostgreSQL RLS as defense-in-depth.

### 3. Private attachment storage with signed reads

Uploads go through the private `bugforge-private` Supabase bucket. The database stores a `supabase-storage://…` marker, never a public URL; the browser only ever receives a short-lived signed URL after the permission check passes.

### 4. [FILL IN: Release-readiness / issue-aging formula]

If there's a concrete scoring formula behind the release-readiness or aging signals in Insights, document it explicitly here the way you'd document any algorithm — inputs, weights, output range, and a worked example with real numbers. A named, inspectable formula reads as far more credible to a judge than "shows release-readiness signals."

### 5. Editorial, accessibility-first interaction design

Warm paper / deep ink visual system, keyboard-reachable command palette, and **reduced-motion-aware** animation — not bolted on, but part of the base interaction model. See [Issue Lifecycle & State Machine](#-issue-lifecycle--state-machine) and `client/src/index.css`.

---

## 🔄 Issue Lifecycle & State Machine

Five permission-aware lanes, enforced server-side on every transition:

```
INTAKE ──▶ TRIAGE ──▶ IN PROGRESS ──▶ VERIFY ──▶ DONE
   │           │             │            │
   └── requires severity/priority set before leaving Intake
               └── requires assignee before entering In Progress
                             └── requires resolution note before Verify
                                          └── requires reviewer confirmation before Done
```

| From | To | Who can transition | Requires |
|---|---|---|---|
| Intake | Triage | [FILL IN role] | Severity + priority set |
| Triage | In progress | [FILL IN role] | Assignee set |
| In progress | Verify | [FILL IN role] | Resolution note |
| Verify | Done | [FILL IN role] | Reviewer confirmation |
| Any | Any (reopen) | [FILL IN role] | [FILL IN — e.g. clears resolution note] |

Illegal transitions (e.g. skipping Triage) are rejected server-side with `[FILL IN: actual error/status code]`, matching the same rigor as the permission checks in `server/routers.ts`.

> Replace the diagram above with the real transition matrix from your codebase — this table is what turns "permission-aware transitions" from a claim into evidence a judge can check against the code.

---

## 🏗️ Architecture

BugForge is a monorepo-style TypeScript application: a React/Vite client and an Express/tRPC server, with Drizzle ORM mapping the domain model to PostgreSQL, Supabase Auth as the identity boundary, and Supabase Storage for private attachments.

```
Browser
  ├─ Supabase Auth: GitHub OAuth + PKCE session
  ├─ React 19 + Vite + Wouter
  └─ tRPC client with current Supabase bearer token
              │
              ▼
Vercel / Express serverless API
  ├─ Request context + Supabase Auth verification
  ├─ tRPC procedures + Zod validation
  ├─ Project/workspace RBAC checks
  ├─ Drizzle ORM + node-postgres
  └─ Server-only Supabase Storage signed URLs
              │
              ├─ Supabase PostgreSQL (BugForge data)
              ├─ Supabase Storage (`bugforge-private`)
              └─ Managed deployment/database (rollback only)
```

The server boundary is authorization-first: a request must be authenticated, the project resolved, and the caller's role checked before any project data or signed Storage URL is returned. Client controls improve usability but never replace server authorization.

```
bugforge/
├── client/                # React 19 + Vite SPA
│   ├── src/pages/          # IssueExplorer, IssueDetail, Workboard, Insights, ...
│   └── src/components/     # CommandPalette, ...
├── server/                 # Express + tRPC API
│   ├── _core/              # app.ts (shared Vercel/managed bootstrap), context.ts (auth+RBAC)
│   ├── routers.ts          # tRPC procedure definitions
│   └── storage.ts          # Signed URL / private storage handling
├── drizzle/                # schema.ts + generated migrations
├── shared/                 # Shared types between client and server
├── tests/e2e/               # Playwright suite
└── docs/                   # Architecture, security, deployment, evaluator docs — see docs/README.md for the full index
```

Full tRPC namespace and endpoint contract, including the AI draft response shape: [`docs/api.md`](docs/api.md).

---

## 🔐 Authentication & Security

- **Sign-in**: "Continue with GitHub" via Supabase Auth (PKCE), token exchanged once at `/auth/callback`.
- **Session**: Supabase access token forwarded as a Bearer header on every tRPC call; validated server-side on every request.
- **Authorization**: workspace/project RBAC resolved server-side before any data or signed URL is returned; PostgreSQL RLS as defense-in-depth.
- **Storage**: private `bugforge-private` bucket; server-only service-role key; browser only ever receives short-lived signed URLs.
- **Secrets**: no OAuth secrets, database passwords, or service-role keys in source control or browser-exposed env vars.

Full detail: [`docs/security.md`](docs/security.md) (identity, RBAC, RLS, secrets, validation, Storage, and AI safety model) and [`docs/github-auth.md`](docs/github-auth.md) (OAuth/PKCE callback contract and verification). If something isn't working end-to-end, check [`docs/troubleshooting.md`](docs/troubleshooting.md) before filing it as a bug.

---

## 🧪 Automated Test Suite

```
pnpm test
```

| Package / Layer | Suites | Tests | Time | Status |
|---|---|---|---|---|
| Server (tRPC procedures, RBAC, auth) | [FILL IN] | [FILL IN] | [FILL IN] | ✅ |
| Client (components, hooks) | [FILL IN] | [FILL IN] | [FILL IN] | ✅ |
| E2E (Playwright) | [FILL IN] | [FILL IN] | [FILL IN] | ✅ |
| **Total** | **[FILL IN]** | **[FILL IN]** | **[FILL IN]** | **✅ 100%** |

### What the tests prove

| Area | Assertion |
|---|---|
| Authorization | Every project procedure rejects requests lacking correct workspace/project role |
| Workspace deletion safeguards | [FILL IN — describe the actual guarded behavior] |
| Private storage | Upload → signed URL round-trip succeeds only after permission check passes |
| Personalization | Theme, accent color, and motion preference persist across sessions |
| Saved searches | [FILL IN] |
| Auth sync | Supabase session state stays consistent with server-verified identity |

> Run `pnpm test` and paste the **actual** output table above before submission — a real, current test count with pass rate is worth more to a judge than a description of test coverage areas. Full detail on TypeScript checks, Vitest, Playwright, and production verification: [`docs/testing.md`](docs/testing.md). Reproducible build/bundle/accessibility evidence: [`docs/performance-evidence.md`](docs/performance-evidence.md).

---

## 💻 Local Development

### Prerequisites

Node.js 22 (or current LTS), pnpm 10, and a PostgreSQL connection string (development or dedicated Supabase database). Never commit `.env` files, database passwords, service-role keys, OAuth secrets, or migration snapshots containing customer data.

### Install and run

```
pnpm install
pnpm dev
```

### Useful commands

| Command | Purpose |
|---|---|
| `pnpm check` | TypeScript validation, no emit |
| `pnpm test` | Full Vitest suite |
| `pnpm e2e` | Playwright suite (requires authenticated test session) |
| `pnpm build:vercel` | Build client + serverless deployment artifact |
| `pnpm build:managed` | Build managed runtime artifact (rollback) |
| `pnpm format` | Prettier formatting |
| `pnpm db:generate` | Generate Drizzle migration SQL from schema — review before applying |

Database changes are schema-first: update `drizzle/schema.ts`, generate and review SQL, apply via the approved workflow, then verify resulting tables/constraints.

Full prerequisites, protected configuration, and safe local-data practices: [`docs/setup.md`](docs/setup.md). Schema/migration boundary and rollback safety: [`docs/database-migration.md`](docs/database-migration.md).

---

## ⚙️ Environment Configuration

| Variable | Scope | Purpose |
|---|---|---|
| `SUPABASE_DATABASE_URL` | Server | Password-bearing transaction-pooler URL for PostgreSQL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Private Storage server operations and signed URLs — never exposed to the browser |
| `SUPABASE_STORAGE_BUCKET` | Server | Private bucket name (production: `bugforge-private`) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Browser-safe | Supabase Auth client config |
| `JWT_SECRET` | Server | Session/framework signing |
| `VITE_APP_TITLE` / `VITE_APP_LOGO` | Browser-safe | Branding |

GitHub OAuth provider credentials are configured in Supabase Auth, not in this repository.

---

## 📚 Documentation Index

Start here, then follow the recommended order below: [`README.md`](README.md) → [`docs/product-tour.md`](docs/product-tour.md) (interface evidence) → [`docs/evaluator-demo.md`](docs/evaluator-demo.md) (populated walkthrough plan) → [`docs/visuals.md`](docs/visuals.md) (system structure) → [`docs/architecture.md`](docs/architecture.md) (implementation detail) → [`docs/performance-evidence.md`](docs/performance-evidence.md) (measured release evidence) → the focused operational guides below.

| Document | Purpose |
|---|---|
| [`docs/visuals.md`](docs/visuals.md) | **Primary system documentation graph** — trust boundaries, request flow, auth, relational entities, RBAC decisions, issue lifecycle, private file handling, deployment rollback, API surface, and source-to-feature traceability. Start here for technical orientation. |
| [`docs/architecture.md`](docs/architecture.md) | Runtime topology, domain model, RBAC, workflow, authentication, Storage, and deployment boundaries |
| [`docs/product-tour.md`](docs/product-tour.md) | Owner-provided Overview, Workboard, and Insights screenshots with route captions and implementation traceability |
| [`docs/evaluator-demo.md`](docs/evaluator-demo.md) | Clearly labeled synthetic walkthrough dataset and evaluator runbook |
| [`docs/performance-evidence.md`](docs/performance-evidence.md) | Reproducible Vercel build, bundle, route-chunk, accessibility, and verification evidence |
| [`docs/api.md`](docs/api.md) | tRPC namespaces, access expectations, Storage responses, and AI draft contract |
| [`docs/setup.md`](docs/setup.md) | Prerequisites, installation, protected configuration, development loop, and safe data practices |
| [`docs/github-auth.md`](docs/github-auth.md) | GitHub OAuth through Supabase Auth, PKCE callback contract, and verification |
| [`docs/database-migration.md`](docs/database-migration.md) | PostgreSQL boundary, schema-first migrations, parity, RLS, and rollback safety |
| [`docs/storage.md`](docs/storage.md) | Private Supabase Storage flow, limits, markers, signed URLs, and authorization |
| [`docs/deployment.md`](docs/deployment.md) | Vercel release procedure, environment settings, health checks, and rollback |
| [`docs/security.md`](docs/security.md) | Identity, RBAC, RLS, secrets, validation, Storage, and AI safety model |
| [`docs/testing.md`](docs/testing.md) | TypeScript, Vitest, Playwright, build, browser, and production verification |
| [`docs/troubleshooting.md`](docs/troubleshooting.md) | Diagnosis for login, API, database, Storage, build, and recommendation problems |
| [`docs/demo-script.md`](docs/demo-script.md) | Short evaluator walkthrough of BugForge's core value and features |
| [`docs/submission-ready-brief.md`](docs/submission-ready-brief.md) | Challenge-aligned product statement and evaluation map |
| [`docs/integration-status.md`](docs/integration-status.md) | Current external integration and rollback status |
| [`docs/production-readiness.md`](docs/production-readiness.md) | Release checklist and evidence boundary |
| [`docs/vercel-deployment-status.md`](docs/vercel-deployment-status.md) | Vercel project and production verification record |

---

## Submission Context

BugForge addresses the challenge of reconstructing the essential developer workflow behind Bugzilla without reproducing its legacy interface. See [`docs/submission-ready-brief.md`](docs/submission-ready-brief.md) for a concise, challenge-aligned product statement and evaluation map.

---

## License and Attribution

This repository is an independent educational/product reconstruction inspired by the problem domain addressed by Bugzilla. It is not an official Bugzilla project and does not reproduce Bugzilla's UI or source implementation.

[FILL IN: actual license — Mantis uses MIT; pick and state one explicitly, since "consult the repository owner" reads as unfinished to a judge.]
