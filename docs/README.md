# BugForge documentation

This directory contains the detailed product, engineering, security, deployment, and evaluation records for BugForge.

| Guide                                                        | Purpose                                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [`architecture.md`](architecture.md)                         | Runtime topology, domain model, RBAC, workflow, authentication, Storage, and deployment boundaries. |
| [`visuals.md`](visuals.md)                                     | GitHub-rendered architecture, authentication, Storage, lifecycle diagrams, and source-derived chart. |
| [`api.md`](api.md)                                           | tRPC namespaces, access expectations, Storage responses, and AI draft contract.                     |
| [`setup.md`](setup.md)                                       | Prerequisites, installation, protected configuration, development loop, and safe data practices.    |
| [`github-auth.md`](github-auth.md)                           | GitHub OAuth through Supabase Auth, PKCE callback contract, and verification.                       |
| [`database-migration.md`](database-migration.md)             | PostgreSQL boundary, schema-first migrations, parity, RLS, and rollback safety.                     |
| [`storage.md`](storage.md)                                   | Private Supabase Storage flow, limits, markers, signed URLs, and authorization.                     |
| [`deployment.md`](deployment.md)                             | Vercel release procedure, environment settings, health checks, and rollback.                        |
| [`security.md`](security.md)                                 | Identity, RBAC, RLS, secrets, validation, Storage, and AI safety model.                             |
| [`testing.md`](testing.md)                                   | TypeScript, Vitest, Playwright, build, browser, and production verification.                        |
| [`troubleshooting.md`](troubleshooting.md)                   | Diagnosis for login, API, database, Storage, build, and recommendation problems.                    |
| [`demo-script.md`](demo-script.md)                           | Short evaluator walkthrough of BugForge’s core value and features.                                  |
| [`submission-ready-brief.md`](submission-ready-brief.md)     | Challenge-aligned product statement and evaluation map.                                             |
| [`integration-status.md`](integration-status.md)             | Current external integration and rollback status.                                                   |
| [`production-readiness.md`](production-readiness.md)         | Release checklist and evidence boundary.                                                            |
| [`vercel-deployment-status.md`](vercel-deployment-status.md) | Vercel project and production verification record.                                                  |

Historical design records remain in this directory to preserve the evolution of BugForge’s visual direction. The root [`README.md`](../README.md) is the recommended first read.
