# Security model

BugForge treats authentication, authorization, and data boundaries as server responsibilities. The interface may hide actions that a user cannot perform, but every protected tRPC procedure repeats the check on the server.

## Identity

End users authenticate with GitHub through Supabase Auth using a browser PKCE flow. The callback code is exchanged once by the public `/auth/callback` page. The server validates the bearer token with Supabase Auth before constructing `ctx.user`; it does not trust a client-provided user ID, role, project ID, or email claim without verification.

## Authorization

Workspace membership and project membership are resolved before scoped reads and writes. Role thresholds protect issue lifecycle transitions, comments, watchers, attachments, project settings, personalization, workspace administration, and AI draft acceptance. Workspace deletion has an explicit unavailable-database guard and is not allowed to begin a transaction when the database is unavailable.

## Database

Supabase PostgreSQL is accessed through the server-side transaction-pooler connection. RLS is enabled on public BugForge tables as defense in depth, and the timestamp trigger search path is hardened. The application uses typed Drizzle queries rather than exposing direct database credentials or unrestricted Data API operations to the browser.

## Storage

The `bugforge-private` bucket is private. Only server-side code can use the service-role key. The browser receives a signed URL only after the relevant project or user authorization has succeeded, and the URL is short-lived. Database rows store object references and metadata, not file bytes or service credentials.

## Secrets

Do not commit `.env` files, database passwords, Supabase service-role keys, GitHub client secrets, bearer tokens, or migration snapshots containing private data. Browser-safe values use the `VITE_*` prefix only when the value is intentionally public. The service-role key and database URL must remain server-only.

## Validation and abuse resistance

Zod validation constrains procedure input. Uploads have size and MIME restrictions. Search, issue, comment, mention, and relationship inputs are scoped to the authorized project. Public health output reports only a bounded status; it does not expose connection strings, query data, or stack traces.

## AI safety boundary

AI output is advisory. A recommendation is visibly labelled, stored as a draft, and cannot change issue fields until an authorized human explicitly applies it. AI suggestions can be wrong, incomplete, or unsafe; users must verify severity, labels, duplicates, reproducible steps, and any operational conclusion. BugForge does not claim that AI understands an issue or that it prevents screenshots, copying, or compromised clients.

## Threat-model notes

Private Storage does not prevent an authorized user from downloading, forwarding, or screenshotting a file. PostgreSQL RLS does not replace application-level role checks. OAuth configuration errors can produce callback failures without indicating a database problem. Operational rollback preserves the managed deployment and database so recovery does not depend on destructive migration reversal.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase Auth GitHub provider"
[2]: https://supabase.com/docs/guides/storage "Supabase Storage security and access"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase PostgreSQL RLS"
