# Database and migration guide

## Database boundary

BugForge’s external production runtime uses the dedicated Supabase PostgreSQL project created for BugForge. The separate Lock Note project, `clonefest-2`, is outside this application and must not be modified. The original managed MySQL/TiDB deployment and database remain available as rollback.

## Runtime access

The server uses the password-bearing `SUPABASE_DATABASE_URL` transaction-pooler connection through `pg` and Drizzle’s PostgreSQL core. The browser does not receive the connection string and does not query the database directly. `server/db.ts` owns reusable queries and returns raw domain rows to the tRPC layer.

## Schema-first workflow

1. Update `drizzle/schema.ts` and, when appropriate, `drizzle/relations.ts`.
2. Run `pnpm db:generate` and inspect the generated SQL.
3. Apply the reviewed migration through the approved database migration path.
4. Verify table structure, indexes, constraints, triggers, and RLS state.
5. Add or update query helpers and tRPC contracts.
6. Add focused tests for authorization, persistence, and failure behavior.
7. Run `pnpm check`, `pnpm test`, `pnpm build:vercel`, and `pnpm build:managed`.

Manual records under `drizzle/manual/` document explicitly applied integration changes such as GitHub identity fields and the private Storage bucket configuration. They are records of migration intent, not a substitute for reviewing the live schema.

## Data migration principles

Migrate only the BugForge schema and authorized BugForge rows. Preserve timestamps and relationships, verify row counts and representative integrity after migration, and retain the source database until application and operational verification is complete. Never use the Lock Note project as a staging area for BugForge data.

## RLS and application authorization

RLS is enabled on public BugForge tables as defense in depth, and the timestamp trigger search path is hardened. The application still performs explicit membership and role checks in the server because RLS alone does not express all workflow permissions or replace the authorization model.

## Destructive-change policy

Database data is not assumed recoverable. Do not drop tables, truncate records, reset a production database, or reverse the migration as an incident shortcut. First capture the failure, use the managed deployment as application rollback, and prepare a reviewed forward migration or recovery plan.

## Verification evidence

The PostgreSQL runtime was parity-checked against the migrated BugForge data, the connection health test passed, the Vercel system health endpoint reported a connected database, and the authenticated workspace loaded from the external deployment. The managed database remains intentionally untouched as rollback.

## References

[1]: https://supabase.com/docs/guides/database "Supabase database documentation"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase PostgreSQL RLS"
[3]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
