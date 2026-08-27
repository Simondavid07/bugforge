import { ENV } from "./_core/env.js";

const SUPABASE_STORAGE_URL_PREFIX = "supabase-storage://";
const SIGNED_URL_TTL_SECONDS = 15 * 60;

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function getSupabaseStorageConfig() {
  const serviceRoleKey = ENV.supabaseServiceRoleKey;
  if (!serviceRoleKey) {
    throw new Error(
      "Storage config missing: set SUPABASE_SERVICE_ROLE_KEY for external storage.",
    );
  }
  return {
    projectUrl: ENV.supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
    bucket: ENV.supabaseStorageBucket,
  };
}

function encodeObjectKey(key: string): string {
  return normalizeKey(key)
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

function storageMarker(bucket: string, key: string): string {
  return `${SUPABASE_STORAGE_URL_PREFIX}${bucket}/${normalizeKey(key)}`;
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith(SUPABASE_STORAGE_URL_PREFIX));
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { projectUrl, serviceRoleKey, bucket } = getSupabaseStorageConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const objectPath = encodeObjectKey(key);
  const body = typeof data === "string" ? data : Buffer.from(data);
  const response = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body,
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase Storage upload failed (${response.status}).`);
  }
  return { key, url: storageMarker(bucket, key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: storageMarker(ENV.supabaseStorageBucket, key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { projectUrl, serviceRoleKey, bucket } = getSupabaseStorageConfig();
  const key = normalizeKey(relKey);
  const response = await fetch(
    `${projectUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase Storage signed URL failed (${response.status}).`);
  }
  const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedUrl = payload.signedURL ?? payload.signedUrl;
  if (!signedUrl) throw new Error("Supabase Storage returned no signed URL.");
  return new URL(
    signedUrl.replace(/^\/+/, ""),
    `${projectUrl}/storage/v1/`,
  ).toString();
}

export async function resolveStorageUrl(
  key: string,
  storedUrl: string | null | undefined,
): Promise<string | null> {
  if (!storedUrl) return null;
  return isSupabaseStorageUrl(storedUrl)
    ? storageGetSignedUrl(key)
    : storedUrl;
}

export async function storageDelete(relKey: string): Promise<void> {
  const { projectUrl, serviceRoleKey, bucket } = getSupabaseStorageConfig();
  const response = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectKey(relKey)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Supabase Storage deletion failed (${response.status}).`);
  }
}
