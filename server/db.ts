import { and, desc, eq, inArray, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  aiRecommendations,
  attachments,
  comments,
  components,
  InsertUser,
  issueActivity,
  issueLabels,
  issueLinks,
  issueWatchers,
  issues,
  labels,
  milestones,
  notifications,
  projectMembers,
  projects,
  savedViews,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema.js";
import * as schema from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export type ProjectRole = "viewer" | "reporter" | "member" | "triage" | "admin";
export type WorkspaceRole = "admin" | "member" | "viewer";

const roleRank: Record<ProjectRole, number> = {
  viewer: 0,
  reporter: 1,
  member: 2,
  triage: 3,
  admin: 4,
};

export function resolveDatabaseConnectionString(
  runtimeEnv: NodeJS.ProcessEnv = process.env,
) {
  return runtimeEnv.SUPABASE_DATABASE_URL || runtimeEnv.DATABASE_URL || ENV.databaseUrl;
}

export function roleCan(role: ProjectRole, minimum: ProjectRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "workspace";
}

export async function getDb() {
  const connectionString = resolveDatabaseConnectionString();
  if (!_db && connectionString) {
    try {
      _pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: process.env.VERCEL ? 1 : 5,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
      });
      _db = drizzle(_pool, { schema });
    } catch (error) {
      console.warn("[Database] Failed to initialize Supabase PostgreSQL:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Dedicated Supabase PostgreSQL database unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function requiredId(row: { id: number } | undefined, operation: string) {
  if (!row?.id) throw new Error(`${operation} did not return an identifier`);
  return row.id;
}

export async function createWorkspaceWithProject(input: {
  userId: number;
  workspaceName: string;
  projectName: string;
  projectKey: string;
}) {
  const db = await requireDb();
  const baseSlug = normalizeSlug(input.workspaceName);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  const [workspace] = await db.insert(workspaces).values({
    name: input.workspaceName.trim(),
    slug,
    createdById: input.userId,
  }).returning({ id: workspaces.id });
  const workspaceId = requiredId(workspace, "Workspace creation");
  await db.insert(workspaceMembers).values({ workspaceId, userId: input.userId, role: "admin" });

  const [project] = await db.insert(projects).values({
    workspaceId,
    name: input.projectName.trim(),
    key: input.projectKey.trim().toUpperCase(),
    workflow: ["intake", "triage", "in_progress", "verify", "done"],
    createdById: input.userId,
  }).returning({ id: projects.id });
  const projectId = requiredId(project, "Project creation");
  await db.insert(projectMembers).values({ projectId, userId: input.userId, role: "admin" });
  return { workspaceId, projectId, slug };
}

export async function getMembership(userId: number, projectId: number) {
  const db = await requireDb();
  const project = (await db.select().from(projects).where(eq(projects.id, projectId)).limit(1))[0];
  if (!project) return null;
  const [projectMember, workspaceMember] = await Promise.all([
    db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))).limit(1),
    db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, project.workspaceId), eq(workspaceMembers.userId, userId))).limit(1),
  ]);
  const role: ProjectRole | null = workspaceMember[0]?.role === "admin" ? "admin" : (projectMember[0]?.role ?? null);
  return role ? { project, role, workspaceRole: workspaceMember[0]?.role ?? null } : null;
}

export async function requireProjectRole(userId: number, projectId: number, minimum: ProjectRole = "viewer") {
  const membership = await getMembership(userId, projectId);
  if (!membership || !roleCan(membership.role, minimum)) throw new Error("You do not have permission to access this project.");
  return membership;
}

export async function recordActivity(input: {
  issueId: number;
  actorId: number | null;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await requireDb();
  await db.insert(issueActivity).values({
    issueId: input.issueId,
    actorId: input.actorId ?? null,
    type: input.type,
    message: input.message,
    metadata: input.metadata ?? null,
  });
}

export async function getNextIssueNumber(projectId: number) {
  const db = await requireDb();
  const row = await db.select({ maxNumber: max(issues.number) }).from(issues).where(eq(issues.projectId, projectId));
  return Number(row[0]?.maxNumber ?? 0) + 1;
}

export async function fetchIssueDetail(userId: number, issueId: number) {
  const db = await requireDb();
  const issue = (await db.select().from(issues).where(eq(issues.id, issueId)).limit(1))[0];
  if (!issue) return null;
  await requireProjectRole(userId, issue.projectId);

  const [issueLabelRows, commentRows, watcherRows, attachmentRows, activityRows, recommendationRows, linkRows, memberRows] = await Promise.all([
    db.select({ id: labels.id, name: labels.name, color: labels.color }).from(issueLabels).innerJoin(labels, eq(issueLabels.labelId, labels.id)).where(eq(issueLabels.issueId, issueId)),
    db.select({ id: comments.id, body: comments.body, parentId: comments.parentId, createdAt: comments.createdAt, authorId: users.id, authorName: users.name }).from(comments).innerJoin(users, eq(comments.authorId, users.id)).where(eq(comments.issueId, issueId)).orderBy(comments.createdAt),
    db.select({ userId: issueWatchers.userId, name: users.name }).from(issueWatchers).innerJoin(users, eq(issueWatchers.userId, users.id)).where(eq(issueWatchers.issueId, issueId)),
    db.select().from(attachments).where(eq(attachments.issueId, issueId)).orderBy(desc(attachments.createdAt)),
    db.select().from(issueActivity).where(eq(issueActivity.issueId, issueId)).orderBy(desc(issueActivity.createdAt)),
    db.select().from(aiRecommendations).where(eq(aiRecommendations.issueId, issueId)).orderBy(desc(aiRecommendations.createdAt)),
    db.select().from(issueLinks).where(eq(issueLinks.issueId, issueId)),
    db.select({ id: users.id, name: users.name }).from(projectMembers).innerJoin(users, eq(projectMembers.userId, users.id)).where(eq(projectMembers.projectId, issue.projectId)),
  ]);
  const linkedIds = linkRows.map(link => link.linkedIssueId);
  const linkedIssues = linkedIds.length ? await db.select({ id: issues.id, number: issues.number, title: issues.title, status: issues.status }).from(issues).where(inArray(issues.id, linkedIds)) : [];
  return { issue, labels: issueLabelRows, comments: commentRows, watchers: watcherRows, attachments: attachmentRows, activity: activityRows, recommendations: recommendationRows, members: memberRows, links: linkRows.map(link => ({ ...link, issue: linkedIssues.find(issueRow => issueRow.id === link.linkedIssueId) ?? null })) };
}

export async function notifyIssueWatchers(input: {
  issueId: number;
  actorId: number;
  type: "mention" | "assignment" | "watcher" | "status_change";
  title: string;
  body: string;
  recipientIds?: number[];
}) {
  const db = await requireDb();
  const issue = (await db.select().from(issues).where(eq(issues.id, input.issueId)).limit(1))[0];
  if (!issue) return;
  const project = (await db.select().from(projects).where(eq(projects.id, issue.projectId)).limit(1))[0];
  if (!project) return;
  const watcherRows = input.recipientIds ? [] : await db.select({ userId: issueWatchers.userId }).from(issueWatchers).where(eq(issueWatchers.issueId, input.issueId));
  const recipientIds = (input.recipientIds ?? watcherRows.map(row => row.userId)).filter(id => id !== input.actorId);
  if (!recipientIds.length) return;
  await db.insert(notifications).values(recipientIds.map(userId => ({
    userId,
    workspaceId: project.workspaceId,
    projectId: issue.projectId,
    issueId: issue.id,
    type: input.type,
    title: input.title,
    body: input.body,
  })));
}

export async function countProjectStats(userId: number, projectId: number) {
  const db = await requireDb();
  await requireProjectRole(userId, projectId);
  const rows = await db.select().from(issues).where(eq(issues.projectId, projectId));
  const now = Date.now();
  const open = rows.filter(issue => issue.status !== "done");
  const done = rows.filter(issue => issue.status === "done");
  const bySeverity = ["blocker", "critical", "major", "minor", "trivial"].map(name => ({ name, value: rows.filter(issue => issue.severity === name).length }));
  const aging = [7, 14, 30].map(days => ({ days, value: open.filter(issue => now - issue.createdAt.getTime() > days * 86_400_000).length }));
  return {
    total: rows.length,
    open: open.length,
    done: done.length,
    blockers: open.filter(issue => issue.isReleaseBlocker || issue.severity === "blocker").length,
    untriaged: rows.filter(issue => issue.status === "intake").length,
    overdue: open.filter(issue => issue.dueAt && issue.dueAt.getTime() < now).length,
    bySeverity,
    aging,
    throughput: done.filter(issue => issue.resolvedAt && now - issue.resolvedAt.getTime() <= 14 * 86_400_000).length,
  };
}

export const issueEnums = {
  severity: ["blocker", "critical", "major", "minor", "trivial"] as const,
  priority: ["urgent", "high", "medium", "low", "none"] as const,
  status: ["intake", "triage", "in_progress", "verify", "done"] as const,
  resolution: ["fixed", "duplicate", "wont_fix", "invalid", "works_as_intended"] as const,
};
