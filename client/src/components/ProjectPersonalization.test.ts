import { describe, expect, it, vi } from "vitest";
import {
  applyProjectAccent,
  normalizeProjectAccent,
} from "./ProjectPersonalization";

describe("applyProjectAccent", () => {
  it("applies a refreshed project accent to the workspace styling variable", () => {
    const setProperty = vi.fn();
    const root = { style: { setProperty } } as unknown as HTMLElement;
    expect(applyProjectAccent("#75937E", root)).toBe(true);
    expect(setProperty).toHaveBeenCalledWith("--project-accent", "#75937E");
  });

  it("leaves the current workspace style unchanged when no active project exists", () => {
    const setProperty = vi.fn();
    const root = { style: { setProperty } } as unknown as HTMLElement;
    expect(applyProjectAccent(null, root)).toBe(false);
    expect(setProperty).not.toHaveBeenCalled();
  });

  it("normalizes a valid custom color while rejecting malformed accent values", () => {
    expect(normalizeProjectAccent("#75937e")).toBe("#75937E");
    expect(normalizeProjectAccent("sage")).toBeNull();
    expect(normalizeProjectAccent("#75937E00")).toBeNull();
  });
});
