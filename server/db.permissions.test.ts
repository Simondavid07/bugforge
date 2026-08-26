import { describe, expect, it } from "vitest";
import { normalizeSlug, roleCan } from "./db";

describe("BugForge project permissions", () => {
  it("allows roles to meet or exceed a required project permission", () => {
    expect(roleCan("admin", "triage")).toBe(true);
    expect(roleCan("triage", "member")).toBe(true);
    expect(roleCan("reporter", "member")).toBe(false);
    expect(roleCan("viewer", "reporter")).toBe(false);
  });

  it("creates a bounded safe workspace slug without trusting punctuation", () => {
    expect(normalizeSlug("  Orbit Labs / Web!  ")).toBe("orbit-labs-web");
    expect(normalizeSlug("***")).toBe("workspace");
    expect(normalizeSlug("x".repeat(100))).toHaveLength(72);
  });
});
