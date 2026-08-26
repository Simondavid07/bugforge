import { defineConfig } from "drizzle-kit";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL is required to run Drizzle commands against the dedicated PostgreSQL project");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/postgres",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
