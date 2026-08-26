import fs from "node:fs/promises";

const query = await fs.readFile("scripts/supabase-postgres-schema.sql", "utf-8");
const payload = {
  project_id: "zznvjtdspjampmztrunx",
  name: "bugforge_initial_postgres_schema",
  query,
};

await fs.mkdir("/home/ubuntu/bugforge-migration", { recursive: true });
await fs.writeFile(
  "/home/ubuntu/bugforge-migration/supabase-schema-migration.json",
  JSON.stringify(payload),
  "utf-8",
);

console.log("Prepared Supabase schema migration input.");
