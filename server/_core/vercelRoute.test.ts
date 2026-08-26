import { describe, expect, it } from "vitest";
import { restoreVercelApiPath } from "./vercelRoute";

describe("restoreVercelApiPath", () => {
  it("restores the tRPC path and preserves its input query", () => {
    expect(
      restoreVercelApiPath(
        "/api/[...path]?path=trpc%2Fauth.me&batch=1&input=%7B%7D",
        "trpc/auth.me",
      ),
    ).toBe("/api/trpc/auth.me?batch=1&input=%7B%7D");
  });

  it("does not alter a request without a matched catch-all path", () => {
    expect(restoreVercelApiPath("/api/[...path]?batch=1", undefined)).toBe(
      "/api/[...path]?batch=1",
    );
  });
});
