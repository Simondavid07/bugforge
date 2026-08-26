import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ requireProjectRole: vi.fn(), db: {} as Record<string, unknown> }));

vi.mock("./db", () => ({
  requireDb: vi.fn(async () => mocks.db),
  getDb: vi.fn(async () => mocks.db),
  requireProjectRole: mocks.requireProjectRole,
  countProjectStats: vi.fn(),
  createWorkspaceWithProject: vi.fn(),
  fetchIssueDetail: vi.fn(),
  getNextIssueNumber: vi.fn(),
  issueEnums: { severity: ["blocker", "critical", "major", "minor", "trivial"], priority: ["urgent", "high", "medium", "low", "none"], status: ["intake", "triage", "in_progress", "verify", "done"], resolution: ["fixed", "duplicate", "wont_fix", "invalid", "works_as_intended"] },
  notifyIssueWatchers: vi.fn(),
  recordActivity: vi.fn(),
  roleCan: vi.fn(),
}));

import { appRouter } from "./routers";

function authenticatedContext(): TrpcContext {
  return {
    user: { id: 9, openId: "member-9", name: "Member", email: "member@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("BugForge project-scoped procedures", () => {
  beforeEach(() => {
    mocks.requireProjectRole.mockReset();
    mocks.requireProjectRole.mockResolvedValue({ role: "admin" });
  });

  it("requires an administrative project role before updating a workflow", async () => {
    const where = vi.fn(async () => undefined);
    mocks.db = { update: vi.fn(() => ({ set: vi.fn(() => ({ where })) })) };
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.project.updateWorkflow({ projectId: 41, workflow: ["intake", "triage", "done"] })).resolves.toMatchObject({ success: true });
    expect(mocks.requireProjectRole).toHaveBeenCalledWith(9, 41, "admin");
    expect(where).toHaveBeenCalledOnce();
  });

  it("requires an administrative project role before managing project members", async () => {
    const onDuplicateKeyUpdate = vi.fn(async () => undefined);
    mocks.db = { insert: vi.fn(() => ({ values: vi.fn(() => ({ onDuplicateKeyUpdate })) })) };
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.project.addMember({ projectId: 41, userId: 12, role: "viewer" })).resolves.toEqual({ success: true });
    expect(mocks.requireProjectRole).toHaveBeenCalledWith(9, 41, "admin");
    expect(onDuplicateKeyUpdate).toHaveBeenCalledOnce();
  });
});
