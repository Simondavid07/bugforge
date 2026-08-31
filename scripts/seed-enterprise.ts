import { requireDb, seedEnterpriseDataset, ensureDemoPersonaUser } from "../server/db.js";
import { projects, workspaces } from "../drizzle/schema.js";

async function main() {
  console.log("Seeding 100-issue Enterprise dataset into Supabase database...");
  const db = await requireDb();

  // 1. Ensure Carol Admin exists
  const adminUser = await ensureDemoPersonaUser("admin");
  console.log("Admin user:", adminUser.name, "ID:", adminUser.id);

  // 2. Find active projects
  const allProjects = await db.select().from(projects).limit(10);
  console.log("Found projects:", allProjects.length);

  for (const prj of allProjects) {
    console.log(`Seeding 100 enterprise issues for project ${prj.key} (ID: ${prj.id})...`);
    const result = await seedEnterpriseDataset(prj.id, adminUser.id, 100);
    console.log(`Project ${prj.key}: seeded ${result.seeded} issues (Total: ${result.total})`);
  }

  console.log("✅ 100-Issue Enterprise Dataset Seeding Complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
