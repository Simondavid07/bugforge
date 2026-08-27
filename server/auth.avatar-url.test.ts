import { describe, expect, it, vi } from "vitest";

const resolveStorageUrlMock = vi.hoisted(() => vi.fn());

vi.mock("./storage.js", () => ({
  resolveStorageUrl: resolveStorageUrlMock,
  storageGetSignedUrl: vi.fn(),
  storagePut: vi.fn(),
}));

import { appRouter } from "./routers.js";
import type { TrpcContext } from "./_core/context.js";

describe("auth.me private avatar delivery", () => {
  it("returns a signed browser URL rather than a Supabase Storage marker", async () => {
    const marker = "supabase-storage://bugforge-private/bugforge/user-1/avatar/custom.png";
    const signedUrl = "https://example.supabase.co/storage/v1/object/sign/bugforge-private/custom.png?token=short-lived";
    resolveStorageUrlMock.mockResolvedValue(signedUrl);
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "github:test-user-id",
        name: "Test member",
        email: "member@example.com",
        loginMethod: "github",
        role: "user",
        avatarKey: "bugforge/user-1/avatar/custom.png",
        avatarUrl: marker,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { headers: {} },
      res: { clearCookie: vi.fn() },
    } as unknown as TrpcContext);

    const result = await caller.auth.me();

    expect(resolveStorageUrlMock).toHaveBeenCalledWith(
      "bugforge/user-1/avatar/custom.png",
      marker,
    );
    expect(result?.avatarUrl).toBe(signedUrl);
  });
});
