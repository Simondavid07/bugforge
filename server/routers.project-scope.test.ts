import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { savedSearchIssuePath } from "../client/src/components/CommandPalette";

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

  it("requires an admin and normalizes a project accent color before saving", async () => {
    const where = vi.fn(async () => undefined);
    const set = vi.fn(() => ({ where }));
    mocks.db = { update: vi.fn(() => ({ set })) };
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.project.updateAccent({ projectId: 41, accentColor: "#75937e" })).resolves.toEqual({ success: true, accentColor: "#75937E" });
    expect(mocks.requireProjectRole).toHaveBeenCalledWith(9, 41, "admin");
    expect(set).toHaveBeenCalledWith({ accentColor: "#75937E" });
  });

  it("persists a complete personalization preference set for the signed-in user", async () => {
    const onDuplicateKeyUpdate = vi.fn(async () => undefined);
    mocks.db = { insert: vi.fn(() => ({ values: vi.fn(() => ({ onDuplicateKeyUpdate })) })) };
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.personalization.updatePreferences({ sidebarOrder: ["/", "/issues", "/boards", "/analytics", "/notifications"], projectOrder: [41, 12], savedSearches: [{ id: "critical", name: "Critical work", query: "auth", severity: "critical" }] })).resolves.toMatchObject({ success: true });
    expect(onDuplicateKeyUpdate).toHaveBeenCalledOnce();
  });

  it("returns persisted saved searches with their structured filters for command navigation", async () => {
    const persisted = { sidebarOrder: ["/issues", "/", "/boards", "/analytics", "/notifications"], projectOrder: [41], savedSearches: [{ id: "release-risk", name: "Release risks", query: "checkout", status: "triage", severity: "critical" }] };
    const preferenceLimit = vi.fn(async () => [persisted]);
    const userLimit = vi.fn(async () => [{ avatarUrl: "/manus-storage/member.png" }]);
    const preferenceWhere = vi.fn(() => ({ limit: preferenceLimit }));
    const userWhere = vi.fn(() => ({ limit: userLimit }));
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: preferenceWhere })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: userWhere })) });
    mocks.db = { select };
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.personalization.get()).resolves.toEqual({ ...persisted, avatarUrl: "/manus-storage/member.png" });
    expect(preferenceLimit).toHaveBeenCalledOnce();
    expect(userLimit).toHaveBeenCalledOnce();
  });

  it("carries a saved search from preference save through retrieval into issue-filter navigation", async () => {
    let stored: { sidebarOrder: string[]; projectOrder: number[]; savedSearches: Array<{ id: string; name: string; query: string; status?: "intake" | "triage" | "in_progress" | "verify" | "done"; severity?: "blocker" | "critical" | "major" | "minor" | "trivial" }> } | undefined;
    const onDuplicateKeyUpdate = vi.fn(async (update: { set: typeof stored }) => { stored = update.set!; });
    mocks.db = { insert: vi.fn(() => ({ values: vi.fn(() => ({ onDuplicateKeyUpdate })) })) };
    const caller = appRouter.createCaller(authenticatedContext());
    await caller.personalization.updatePreferences({ sidebarOrder: ["/", "/issues", "/boards", "/analytics", "/notifications"], projectOrder: [41], savedSearches: [{ id: "release-risk", name: "Release risks", query: "checkout", status: "triage", severity: "critical" }] });
    const preferenceLimit = vi.fn(async () => [stored]);
    mocks.db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: preferenceLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ avatarUrl: null }]) })) })) }),
    };
    const retrieved = await caller.personalization.get();
    expect(savedSearchIssuePath(retrieved.savedSearches[0])).toBe("/issues?q=checkout&status=triage&severity=critical");
  });

  it("requires project administration before accepting a project-logo upload", async () => {
    mocks.db = {};
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.personalization.uploadImage({ target: "project_logo", projectId: 41, fileName: "mark.png", contentType: "image/png", dataUrl: "data:image/png;base64," })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.requireProjectRole).toHaveBeenCalledWith(9, 41, "admin");
  });
});
