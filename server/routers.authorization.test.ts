import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("BugForge protected procedures", () => {
  it("rejects workspace setup when the caller is not authenticated", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.workspace.create({ workspaceName: "Orbit", projectName: "Console", projectKey: "CON" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects project issue discovery when the caller is not authenticated", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.issues.list({ projectId: 1, page: 1, pageSize: 20, sort: "updated" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
