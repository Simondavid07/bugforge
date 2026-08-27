import { describe, expect, it } from "vitest";

const projectUrl = process.env.SUPABASE_URL ?? "https://zznvjtdspjampmztrunx.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("Supabase Storage protected configuration", () => {
  const configured = serviceRoleKey ? it : it.skip;

  configured("authorizes a read-only bucket inventory request", async () => {
    const response = await fetch(`${projectUrl}/storage/v1/bucket`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toBeInstanceOf(Array);
  });
});
