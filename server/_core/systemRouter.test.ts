import { describe, expect, it, vi } from "vitest";

vi.mock("../db.js", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db.js";
import { systemRouter } from "./systemRouter";

const caller = systemRouter.createCaller({
  req: { headers: {} },
  res: {},
  user: null,
});

describe("systemRouter.health", () => {
  it("reports the database as connected after a successful lightweight query", async () => {
    vi.mocked(getDb).mockResolvedValue({ execute: vi.fn().mockResolvedValue([]) } as any);

    await expect(caller.health({ timestamp: Date.now() })).resolves.toEqual({
      ok: true,
      database: "connected",
    });
  });

  it("does not expose infrastructure details when the database is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);

    await expect(caller.health({ timestamp: Date.now() })).resolves.toEqual({
      ok: false,
      database: "unavailable",
    });
  });
});
