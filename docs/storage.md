# Private storage

BugForge uses the dedicated Supabase Storage project for new avatar, project-logo, and issue-attachment bytes. The application uses a private bucket named `bugforge-private`; no public browser Storage policy is required or intended.

## Request flow

1. The browser submits a file through an authenticated tRPC mutation.
2. The server validates MIME type, extension, and size.
3. The server resolves the active project or workspace and checks the caller’s role.
4. The server uploads bytes with the server-only Supabase service-role key.
5. PostgreSQL stores the object key and a `supabase-storage://bucket/key` marker.
6. A subsequent authorized read resolves the marker to a short-lived signed URL.

Signed URLs are generated only after the relevant project/workspace check. The service-role key is never included in client bundles, tRPC responses, logs, or database rows.

## Supported files

The production bucket is configured with a maximum object size of 5 MiB and the following allowed types: PNG, JPEG, WebP, TXT, JSON, and PDF. The application’s upload validation is the first line of defense; the bucket configuration supplies an additional storage-level restriction.

## Database representation

The database stores metadata such as the object key, filename, content type, size, issue reference, uploader, and marker URL. It does not store file bytes. New records use the private Supabase marker. Existing `/manus-storage/*` paths remain readable as a compatibility fallback for records created by the managed runtime.

## Authorization and deletion

Avatar uploads are restricted to the current user. Project logos and issue attachments are restricted by the project/workspace role required by their tRPC procedures. Deletion and replacement should remove the old object only after the new record has been safely persisted; orphan cleanup is an operational follow-up rather than a reason to weaken authorization.

Do not add a permissive `SELECT`, `INSERT`, or `UPDATE` Storage policy for convenience. If direct browser Storage access is ever introduced, it must be designed separately with object-prefix policies and an explicit threat model.

## Verification

The repository includes a real, bounded private Storage round-trip test that uploads a tiny object, requests a signed read, verifies the response, and deletes the object. Production verification used an authenticated avatar upload and confirmed that the browser received a usable signed image URL while the database retained a private marker.

## References

[1]: https://supabase.com/docs/guides/storage "Supabase Storage guide"
[2]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl "Supabase Storage signed URLs"
[3]: https://supabase.com/docs/guides/storage/uploads/standard-uploads "Supabase standard uploads"
