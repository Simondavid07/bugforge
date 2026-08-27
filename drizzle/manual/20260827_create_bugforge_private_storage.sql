-- BugForge external Vercel Storage migration.
-- Objects remain private. Browser clients never receive the service-role key;
-- server-side tRPC authorization creates short-lived signed download URLs.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'bugforge-private',
  'bugforge-private',
  false,
  5242880,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'application/json',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No storage.objects policy is added intentionally. The bucket remains
-- default-deny for browser Data/Storage API calls; BugForge's protected tRPC
-- procedures perform authorization and use the server-only service-role key.
