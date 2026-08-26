import { describe, expect, it } from "vitest";
import { resolveDatabaseConnectionString } from "./db";

describe("resolveDatabaseConnectionString", () => {
  it("prefers the dedicated Supabase server secret", () => {
    expect(
      resolveDatabaseConnectionString({
        SUPABASE_DATABASE_URL: "postgresql://supabase-pooler",
        DATABASE_URL: "postgresql://fallback",
      }),
    ).toBe("postgresql://supabase-pooler");
  });

  it("falls back to a conventional server-only database URL", () => {
    expect(
      resolveDatabaseConnectionString({ DATABASE_URL: "postgresql://fallback" }),
    ).toBe("postgresql://fallback");
  });
});
