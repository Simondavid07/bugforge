# 🚀 Evaluator Demo & 100-Issue Enterprise Sandbox Guide

This guide documents the synthetic demonstration dataset and 1-click evaluation capabilities built directly into **BugForge**. It allows judges to evaluate full-scale enterprise defect intelligence, blocker DAG networks, stochastic Monte Carlo forecasting, and automated AI patch synthesis without manual setup.

---

## ⚡ Instant 1-Click Access (Zero Setup)

Judges can evaluate BugForge immediately on the live production deployment:

| Method | Target Link / Trigger | Description |
|---|---|---|
| **🚀 100-Issue Sandbox** | [**`bugforge-lyart.vercel.app`**](https://bugforge-lyart.vercel.app) ➔ Click **`Launch Live Sandbox ➔`** | Instantly seeds a 100-defect enterprise dataset across all 5 lanes with blocker DAGs |
| **👑 Marcus (Admin)** | Click **`Marcus Vance (Platform Principal)`** on Login | Full platform governance: project accent customization, workspace deletion, role management |
| **🎯 Elena (Triage)** | Click **`Elena Rostova (Triage Director)`** on Login | Workflow lead: lane moves, developer assignees, AI triage draft reviews, release blockers |
| **🛠️ Devon (Staff Dev)** | Click **`Devon Wright (Staff Engineer)`** on Login | Core engineer: issue reproduction kits, AI Git Diff patch synthesis, comments, attachments |
| **🔭 Sophia (Auditor)** | Click **`Sophia Chen (Release Auditor)`** on Login | Read-only reporter: creates new defects; demonstrates server HTTP 403 rejection on restricted mutations |
| **🎲 In-App Re-Seed** | Click **`100-Issue Demo`** in Header | One-click button in the header bar to top up or re-populate 100 enterprise issues |

---

## 📊 100-Issue High-Density Dataset Structure

The synthetic enterprise generator (`seedEnterpriseDataset`) populates 100 structured defect tickets across 6 key engineering domains:

| Engineering Domain | Sample Synthetic Issues | Target Severities |
|---|---|:---:|
| **API & Core Backend** | PostgreSQL pool exhaustion under 10k RPS, JWT token expiry race conditions, tRPC batch query timeouts | `critical` / `blocker` |
| **Frontend & Studio UI** | Search modal focus drops, Theme hydration FOUC, 10k virtual list scroll jitter, CSS variable flash | `major` / `minor` |
| **Security & Auth Governance** | Presigned URL TTL compliance, Safari SameSite cookie flags, Cross-tenant project access barrier | `blocker` / `critical` |
| **SRE & Infrastructure** | Docker minification worker OOM, Serverless cold start latency spikes, DB B-tree index degradation | `critical` / `major` |
| **SCM & Git Traceability** | Webhook HMAC timing attack resilience, Multiline Git commit SHA links, Automatic status promotions | `major` / `medium` |
| **Accessibility & Standards** | Screen reader `aria-expanded` states, WCAG AA 4.5:1 contrast ratios, Modal focus loop traps | `minor` / `trivial` |

### 5-Lane Workflow Distribution

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Intake    │ ──> │    Triage    │ ──> │ In Progress  │ ──> │    Verify    │ ──> │     Done     │
│  (25 Issues) │     │  (25 Issues) │     │  (25 Issues) │     │  (15 Issues) │     │  (10 Issues) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

- **Mandatory Done Resolutions**: Closed defects are explicitly coded as `Fixed`, `Duplicate`, `Won't fix`, `Works as intended`, or `Invalid`.
- **Intricate Blocker DAG**: Generated issues automatically link dependencies, rendering a rich SVG graph with Kahn's critical path highlighting.

---

## 🧭 Step-by-Step 2-Minute Judging Walkthrough

1. **Enter Sandbox**: Open [`bugforge-lyart.vercel.app`](https://bugforge-lyart.vercel.app) and click **`Launch Live Sandbox ➔`**.
2. **Inspect Workboard (`/boards`)**: Observe the 100 defects organized across all 5 lanes with priority indicators and blocker flags.
3. **Trigger Dependency Graph**: Click **Dependency Graph** in the board header to inspect the interactive SVG DAG and pulsing red critical path.
4. **Synthesize AI Code Patch**:
   - Open issue `#101` in the Issue Desk (`/issues/101`).
   - Scroll to **Patch Studio** and click **Synthesize Code Patch**.
   - Review the generated **Unified Git Diff (`.patch`)** with syntax highlighting and copy the diff or Vitest regression test snippet.
5. **Run Monte Carlo Simulation**:
   - Open **Insights** (`/analytics`).
   - Review the **1,000-iteration Monte Carlo Forecaster** probability density bell curve with P50, P80, and P95 shipping confidence.
6. **Live System Latency Audit**:
   - Click **`⚡ Evidence Lab`** in the top header.
   - Click **Run Live Ping Test** to measure real-time PostgreSQL database (~4ms), tRPC API roundtrip (~18ms), and storage signing (~11ms).
   - Review the passing 34 automated test suites.
