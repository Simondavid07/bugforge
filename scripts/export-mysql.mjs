import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const tables = [
  "users",
  "workspaces",
  "workspaceMembers",
  "projects",
  "projectMembers",
  "milestones",
  "components",
  "labels",
  "issues",
  "issueLabels",
  "issueLinks",
  "issueActivity",
  "comments",
  "issueWatchers",
  "attachments",
  "savedViews",
  "userPreferences",
  "notifications",
  "aiRecommendations",
];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to export BugForge data.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const snapshot = {
  exportedAt: new Date().toISOString(),
  tables: {},
};

for (const table of tables) {
  const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id ASC`);
  snapshot.tables[table] = rows;
}

await connection.end();

const outputDirectory = "/home/ubuntu/bugforge-migration";
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(
  path.join(outputDirectory, "mysql-export.json"),
  JSON.stringify(snapshot, null, 2),
  "utf-8",
);

const counts = Object.fromEntries(
  Object.entries(snapshot.tables).map(([table, rows]) => [table, rows.length]),
);
console.log(JSON.stringify({ outputDirectory, counts }, null, 2));
