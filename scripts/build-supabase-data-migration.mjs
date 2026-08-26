import fs from "node:fs/promises";

const sourcePath = "/home/ubuntu/bugforge-migration/mysql-export.json";
const outputPath = "/home/ubuntu/bugforge-migration/supabase-data-migration.json";
const snapshot = JSON.parse(await fs.readFile(sourcePath, "utf-8"));

const tableOrder = [
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

const jsonColumns = new Set([
  "workflow",
  "metadata",
  "filters",
  "sidebarOrder",
  "projectOrder",
  "savedSearches",
  "suggestedLabels",
  "duplicateCandidates",
]);

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteText(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function valueSql(column, value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (jsonColumns.has(column)) {
    const json = typeof value === "string" ? value : JSON.stringify(value);
    return `${quoteText(json)}::jsonb`;
  }
  if (value instanceof Date) return quoteText(value.toISOString());
  return quoteText(String(value));
}

const statements = [];
for (const table of tableOrder) {
  const rows = snapshot.tables[table] ?? [];
  if (rows.length === 0) continue;
  const columns = Object.keys(rows[0]);
  const values = rows.map((row) => `(${columns.map((column) => valueSql(column, row[column])).join(", ")})`);
  statements.push(
    `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES\n${values.join(",\n")}\nON CONFLICT DO NOTHING;`,
  );
}

for (const table of tableOrder) {
  const rows = snapshot.tables[table] ?? [];
  if (rows.length === 0) continue;
  statements.push(
    `SELECT setval(pg_get_serial_sequence('${quoteIdentifier(table)}', 'id'), COALESCE((SELECT MAX("id") FROM ${quoteIdentifier(table)}), 1), true);`,
  );
}

const payload = {
  project_id: "zznvjtdspjampmztrunx",
  name: "bugforge_authorized_mysql_data",
  query: statements.join("\n\n"),
};

await fs.writeFile(outputPath, JSON.stringify(payload), "utf-8");
console.log(JSON.stringify({ outputPath, tableCount: statements.length }, null, 2));
