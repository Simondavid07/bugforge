import { Client } from "pg";
import { describe, expect, it } from "vitest";

const hasSupabaseConnection = Boolean(process.env.SUPABASE_DATABASE_URL);

describe("dedicated Supabase connection", () => {
  it.runIf(hasSupabaseConnection)("executes a lightweight PostgreSQL health query with the configured server secret", async () => {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    expect(connectionString).toMatch(/^postgres(?:ql)?:\/\//);

    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      const result = await client.query<{ health: number }>("SELECT 1 AS health");
      expect(result.rows[0]?.health).toBe(1);
    } finally {
      await client.end();
    }
  }, 15_000);
});
