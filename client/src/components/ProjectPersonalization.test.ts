import { describe, expect, it, vi } from "vitest";
import { applyProjectAccent } from "./ProjectPersonalization";

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
});
