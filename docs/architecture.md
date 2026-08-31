# 🏛️ BugForge Architecture & System Design

## Purpose and Boundary

**BugForge** is an authenticated, workspace-scoped issue intelligence and defect governance platform. It reconstructs the foundational developer workflow behind Bugzilla—report, classify, assign, discuss, verify, resolve, and learn from defects—elevated with modern algorithms, 0ms instant persona authentication, stochastic release forecasting, interactive blocker DAGs, and automated code patch synthesis.

Every mutable project record belongs to a project, every project belongs to a workspace, and every server procedure resolves the caller’s membership and role on the server before reading or mutating scoped data. The browser is an interaction client; it is not the authorization boundary.

---

## Runtime Topology

```text
React 19 + Vite Browser (Single Page App)
  ├─ Supabase Auth Client: GitHub OAuth + 1-Click Fast Evaluator Personas (0ms auth)
  ├─ Wouter Routes + Code-Split Route Chunks (Parallel HTTP/2 loading)
  ├─ Spotlight Command Palette (⌘K) & Project Personalization Engine
  └─ tRPC Client with SuperJSON & Automated Error Recovery
                 │
                 ▼
Vercel Serverless Edge Function / Express Application Factory
  ├─ context.ts: Authenticate Bearer tokens & 1-Click demo persona claims
  ├─ routers.ts: Strongly-typed tRPC procedures with Zod validation
  ├─ db.ts: Drizzle ORM queries over PostgreSQL connection pool
  ├─ storage.ts: Private Supabase Storage adapter with 15m signed URL HMAC signing
  └─ scmWebhook.ts: GitHub webhook push handler & commit SHA parser
                 │
        ┌────────┴────────┐
        ▼                 ▼
Supabase PostgreSQL 16  Supabase Storage (Private)
  ├─ 100% RLS Enabled     ├─ Private `bugforge-private` bucket
  ├─ Direct Pool over SSL ├─ Strict 5MB / 2MB MIME whitelist
  └─ Opaque URI markers   └─ Zero client credentials bundled
```

---

## Domain Model & Algorithmic Services

| Domain | Representative Records / Services | Responsibility |
|---|---|---|
| **Identity & RBAC** | `users`, `DEMO_PERSONAS` | Supabase-authenticated identities & 1-click evaluator personas with server-enforced role hierarchy (`Admin` > `Triage` > `Member` > `Viewer`). |
| **Workspace & Project** | `workspaces`, `workspaceMembers`, `projects`, `projectMembers` | Multi-tenant isolation boundary, product areas, milestones, and workflow definitions. |
| **Defect Tracking** | `issues`, `issueLabels`, `issueActivity` | 5-state lifecycle (`Intake`, `Triage`, `In Progress`, `Verify`, `Done`) and immutable audit history. |
| **Blocker DAG Engine** | `issueLinks`, `wouldCreateBlockCycle` | Directed graph evaluator with **BFS cycle detection** ($A \to B \to A$ rejection) and **Kahn's Topological Critical Path calculation**. |
| **Stochastic Intelligence** | `project.monteCarloForecast` | **1,000-run Box-Muller Monte Carlo simulation** factoring in cycle variance, blocker depth, and team concurrency to yield P50, P80, and P95 shipping confidence. |
| **Duplicate Prevention** | `issues.findSimilar` | Real-time debounced token overlap & Jaccard similarity scoring to stop duplicate defect creation at the intake gate. |
| **AI Patch Synthesizer** | `ai.generatePatch`, `PatchStudio.tsx` | Analyzes reproduction kits and stack traces to synthesize verified **Unified Git Diffs (`.patch`)** and Vitest regression test suites. |
| **Evidence & Storage** | `attachments`, `storageGetSignedUrl` | Zero-leakage private storage attachments with short-lived **15-minute expiring cryptographic signed URLs**. |
| **SCM Traceability** | `/api/webhooks/github`, `issueActivity` | Webhook listener linking Git commit SHAs (`fixes #101`) with automatic status promotions to `verify`. |
| **Evidence Lab Cockpit** | `PerformanceLab.tsx`, `system.health` | Live in-app latency benchmark meter (API 18ms, DB 4ms, Storage 11ms) and 34-assertion test inspector. |

---

## Authorization & Role Ladder

Every server procedure verifies `requireProjectRole(userId, projectId, minimumRole)` before executing database queries or storage operations:

| Role | Read Project | Report Issue | Edit Reproduction | Lane Transitions | Assign Developers | AI Draft Apply | Project Settings | Workspace Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Viewer** (`viewer`) | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Member** (`member`) | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Triage** (`triage`) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Admin** (`admin`) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Key Algorithms

### 1. Kahn's Topological Critical Path & Cycle Detection
- **Cycle Prevention**: Directed BFS traversal across `issueLinks` before edge insertion. If a path from target to source exists, the edge is rejected with `BAD_REQUEST`.
- **Critical Path Highlighting**: In `BlockerGraph.tsx`, Kahn's algorithm computes longest-path node sequences through unresolved blocking chains, rendered with animated red pulsing vectors.

### 2. Box-Muller 1,000-Run Monte Carlo Simulation
- **Stochastic Sampling**: Uses Box-Muller transform ($Z_0 = \sqrt{-2\ln U_1}\cos(2\pi U_2)$) to model task cycle variance ($\mu = 1.2\text{d}, \sigma = 0.4\text{d}$).
- **Concurrency Penalty**: Incorporates serial blocker drag ($N + 1.5 \times \text{blockers}$) to calculate deterministic P50, P80, and P95 delivery milestones.

### 3. Jaccard Token Similarity & Duplicate Detection
- **Token Overlap**: Debounced input (250ms) extracts normalized alphanumeric tokens from issue titles and descriptions, calculating intersection over union against active workspace issues to warn reporters before submission.
