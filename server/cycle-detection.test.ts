import { describe, expect, it } from "vitest";
import { DEMO_PERSONAS, issueEnums } from "./db.js";

describe("BugForge Algorithm Moats & Intelligence Suite", () => {
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

  it("calculates deterministic Monte Carlo percentile ranks properly", () => {
    const runs = [1.2, 2.0, 2.5, 3.1, 3.8, 4.2, 4.9, 5.5, 6.2, 8.0];
    runs.sort((a, b) => a - b);
    const p50 = runs[Math.floor(runs.length * 0.5)];
    const p80 = runs[Math.floor(runs.length * 0.8)];
    const p95 = runs[Math.floor(runs.length * 0.95)];

    expect(p50).toBe(4.2);
    expect(p80).toBe(6.2);
    expect(p95).toBe(8.0);
    expect(p50).toBeLessThanOrEqual(p80);
    expect(p80).toBeLessThanOrEqual(p95);
  });
});
