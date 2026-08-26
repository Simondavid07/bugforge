import { describe, expect, it } from "vitest";
import { savedSearchIssuePath } from "./CommandPalette";

describe("savedSearchIssuePath", () => {
  it("preserves a saved query and structured issue filters in the navigation path", () => {
    expect(savedSearchIssuePath({ id: "release", name: "Release attention", query: "checkout error", status: "triage", severity: "critical" })).toBe("/issues?q=checkout+error&status=triage&severity=critical");
  });

  it("returns the unfiltered issue explorer for an empty saved search", () => {
    expect(savedSearchIssuePath({ id: "all", name: "All issues", query: "" })).toBe("/issues");
  });
});
