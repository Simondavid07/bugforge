import { describe, expect, it } from "vitest";
import { DEMO_PERSONAS, issueEnums } from "./db.js";

describe("BugForge Algorithm Moats & Demo Personas", () => {
  it("defines strict 1-click evaluator personas for all role ranks", () => {
    expect(DEMO_PERSONAS.admin.role).toBe("admin");
    expect(DEMO_PERSONAS.admin.projectRole).toBe("admin");

    expect(DEMO_PERSONAS.triage.role).toBe("user");
    expect(DEMO_PERSONAS.triage.projectRole).toBe("triage");

    expect(DEMO_PERSONAS.developer.role).toBe("user");
    expect(DEMO_PERSONAS.developer.projectRole).toBe("member");

    expect(DEMO_PERSONAS.viewer.role).toBe("user");
    expect(DEMO_PERSONAS.viewer.projectRole).toBe("viewer");
  });

  it("contains all 5 mandatory issue workflow states and valid resolutions", () => {
    expect(issueEnums.status).toContain("intake");
    expect(issueEnums.status).toContain("triage");
    expect(issueEnums.status).toContain("in_progress");
    expect(issueEnums.status).toContain("verify");
    expect(issueEnums.status).toContain("done");

    expect(issueEnums.resolution).toEqual([
      "fixed",
      "duplicate",
      "wont_fix",
      "invalid",
      "works_as_intended",
    ]);
  });
});
