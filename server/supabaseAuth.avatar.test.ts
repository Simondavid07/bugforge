import { afterEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./db.js", () => dbMock);
vi.mock("./_core/env.js", () => ({
  ENV: {
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "test-publishable-key",
  },
}));

import { authenticateRequest } from "./_core/supabaseAuth.js";

const persistedUser = {
  id: 1,
  openId: "github:test-user-id",
  name: "Existing member",
  email: "member@example.com",
  loginMethod: "github",
  role: "user" as const,
  avatarKey: "bugforge/user-1/avatar/custom-avatar.png",
  avatarUrl: "supabase-storage://bugforge-private/bugforge/user-1/avatar/custom-avatar.png",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Supabase GitHub profile synchronization", () => {
  it("does not overwrite an existing user-selected private avatar marker", async () => {
    dbMock.getUserByOpenId.mockResolvedValue(persistedUser);
    dbMock.upsertUser.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "test-user-id",
          email: "member@example.com",
          email_confirmed_at: "2026-08-27T00:00:00.000Z",
          user_metadata: {
            full_name: "Existing member",
            avatar_url: "https://avatars.githubusercontent.com/u/test-user-id",
          },
          identities: [{ provider: "github" }],
        }),
      }),
    );

    const result = await authenticateRequest({
      headers: { authorization: "Bearer test-access-token" },
    });

    expect(result).toEqual(persistedUser);
    expect(dbMock.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: persistedUser.openId,
        name: "Existing member",
        loginMethod: "github",
      }),
    );
    expect(dbMock.upsertUser.mock.calls[0]?.[0]).not.toHaveProperty("avatarUrl");
  });
});
