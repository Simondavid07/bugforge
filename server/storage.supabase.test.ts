import { afterEach, describe, expect, it } from "vitest";
import { storageDelete, storageGetSignedUrl, storagePut } from "./storage.js";

const configured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const runWhenConfigured = configured ? it : it.skip;

describe("private Supabase Storage adapter", () => {
  const keys: string[] = [];

  afterEach(async () => {
    await Promise.all(keys.splice(0).map(storageDelete));
  });

  runWhenConfigured("uploads, signs, reads, and deletes a bounded private object", async () => {
    const stored = await storagePut(
      "bugforge/verification/storage-roundtrip.txt",
      "BugForge private storage verification",
      "text/plain",
    );
    keys.push(stored.key);
    expect(stored.url).toMatch(/^supabase-storage:\/\/bugforge-private\//);

    const signedUrl = await storageGetSignedUrl(stored.key);
    expect(signedUrl).toContain("/storage/v1/object/sign/bugforge-private/");
    const response = await fetch(signedUrl);
    expect(response.ok).toBe(true);
    await expect(response.text()).resolves.toBe("BugForge private storage verification");
  }, 20_000);
});
