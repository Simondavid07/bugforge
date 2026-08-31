import { and, asc, desc, eq, inArray, max, or } from "drizzle-orm";
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
import { resolveStorageUrl } from "./storage.js";

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
  runtimeEnv: NodeJS.ProcessEnv = process.env
) {
  return (
    runtimeEnv.SUPABASE_DATABASE_URL ||
    runtimeEnv.DATABASE_URL ||
    ENV.databaseUrl
  );
}

export function resolveDatabaseConnectionSource(
  runtimeEnv: NodeJS.ProcessEnv = process.env
) {
  if (runtimeEnv.SUPABASE_DATABASE_URL) return "SUPABASE_DATABASE_URL";
  if (runtimeEnv.DATABASE_URL) return "DATABASE_URL";
  return ENV.databaseUrl ? "ENV.databaseUrl" : "missing";
}

export function roleCan(role: ProjectRole, minimum: ProjectRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function normalizeSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "workspace"
  );
}

export async function getDb() {
  const connectionString = resolveDatabaseConnectionString();
  if (!_db && connectionString) {
    try {
      if (process.env.VERCEL) {
        console.info(
          `[Database] Initializing PostgreSQL pool from ${resolveDatabaseConnectionSource()}`
        );
      }
      _pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: process.env.VERCEL ? 1 : 5,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
      });
      _db = drizzle(_pool, { schema });
    } catch (error) {
      console.warn(
        "[Database] Failed to initialize Supabase PostgreSQL:",
        error
      );
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

export async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new Error("Dedicated Supabase PostgreSQL database unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of [
    "name",
    "email",
    "loginMethod",
    "avatarKey",
    "avatarUrl",
  ] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role =
    user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
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
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: input.workspaceName.trim(),
      slug,
      createdById: input.userId,
    })
    .returning({ id: workspaces.id });
  const workspaceId = requiredId(workspace, "Workspace creation");
  await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId: input.userId, role: "admin" });

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: input.projectName.trim(),
      key: input.projectKey.trim().toUpperCase(),
      workflow: ["intake", "triage", "in_progress", "verify", "done"],
      createdById: input.userId,
    })
    .returning({ id: projects.id });
  const projectId = requiredId(project, "Project creation");
  await db
    .insert(projectMembers)
    .values({ projectId, userId: input.userId, role: "admin" });
  return { workspaceId, projectId, slug };
}

export async function deleteWorkspace(
  workspaceId: number,
  dbOverride?: ReturnType<typeof drizzle<typeof schema>> | null
) {
  const db = dbOverride === undefined ? await getDb() : dbOverride;
  if (!db) throw new Error("database unavailable");
  return db.transaction(async tx => {
    const projectRows = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
    const projectIds = projectRows.map(row => row.id);
    const issueRows = projectIds.length
      ? await tx
          .select({ id: issues.id })
          .from(issues)
          .where(inArray(issues.projectId, projectIds))
      : [];
    const issueIds = issueRows.map(row => row.id);
    if (issueIds.length) {
      await tx
        .delete(issueActivity)
        .where(inArray(issueActivity.issueId, issueIds));
      await tx.delete(comments).where(inArray(comments.issueId, issueIds));
      await tx
        .delete(issueWatchers)
        .where(inArray(issueWatchers.issueId, issueIds));
      await tx
        .delete(attachments)
        .where(inArray(attachments.issueId, issueIds));
      await tx
        .delete(issueLabels)
        .where(inArray(issueLabels.issueId, issueIds));
      await tx
        .delete(issueLinks)
        .where(
          or(
            inArray(issueLinks.issueId, issueIds),
            inArray(issueLinks.linkedIssueId, issueIds)
          )
        );
      await tx
        .delete(aiRecommendations)
        .where(inArray(aiRecommendations.issueId, issueIds));
      await tx.delete(issues).where(inArray(issues.id, issueIds));
    }
    if (projectIds.length) {
      await tx
        .delete(savedViews)
        .where(inArray(savedViews.projectId, projectIds));
      await tx
        .delete(milestones)
        .where(inArray(milestones.projectId, projectIds));
      await tx
        .delete(components)
        .where(inArray(components.projectId, projectIds));
      await tx.delete(labels).where(inArray(labels.projectId, projectIds));
      await tx
        .delete(projectMembers)
        .where(inArray(projectMembers.projectId, projectIds));
      await tx.delete(projects).where(inArray(projects.id, projectIds));
    }
    await tx
      .delete(notifications)
      .where(eq(notifications.workspaceId, workspaceId));
    await tx
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return { success: true, workspaceId } as const;
  });
}

export async function getMembership(userId: number, projectId: number) {
  const db = await requireDb();
  const project = (
    await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  )[0];
  if (!project) return null;
  const [projectMember, workspaceMember] = await Promise.all([
    db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(1),
    db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, project.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1),
  ]);
  const role: ProjectRole | null =
    workspaceMember[0]?.role === "admin"
      ? "admin"
      : (projectMember[0]?.role ?? null);
  return role
    ? { project, role, workspaceRole: workspaceMember[0]?.role ?? null }
    : null;
}

export async function requireProjectRole(
  userId: number,
  projectId: number,
  minimum: ProjectRole = "viewer"
) {
  const membership = await getMembership(userId, projectId);
  if (!membership || !roleCan(membership.role, minimum))
    throw new Error("You do not have permission to access this project.");
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
  const row = await db
    .select({ maxNumber: max(issues.number) })
    .from(issues)
    .where(eq(issues.projectId, projectId));
  return Number(row[0]?.maxNumber ?? 0) + 1;
}

export async function fetchIssueDetail(userId: number, issueId: number) {
  const db = await requireDb();
  const issue = (
    await db.select().from(issues).where(eq(issues.id, issueId)).limit(1)
  )[0];
  if (!issue) return null;
  await requireProjectRole(userId, issue.projectId);

  const [
    issueLabelRows,
    commentRows,
    watcherRows,
    attachmentRows,
    activityRows,
    recommendationRows,
    linkRows,
    memberRows,
  ] = await Promise.all([
    db
      .select({ id: labels.id, name: labels.name, color: labels.color })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(eq(issueLabels.issueId, issueId)),
    db
      .select({
        id: comments.id,
        body: comments.body,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorName: users.name,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.issueId, issueId))
      .orderBy(comments.createdAt),
    db
      .select({ userId: issueWatchers.userId, name: users.name })
      .from(issueWatchers)
      .innerJoin(users, eq(issueWatchers.userId, users.id))
      .where(eq(issueWatchers.issueId, issueId)),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.issueId, issueId))
      .orderBy(desc(attachments.createdAt)),
    db
      .select()
      .from(issueActivity)
      .where(eq(issueActivity.issueId, issueId))
      .orderBy(desc(issueActivity.createdAt)),
    db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.issueId, issueId))
      .orderBy(desc(aiRecommendations.createdAt)),
    db.select().from(issueLinks).where(eq(issueLinks.issueId, issueId)),
    db
      .select({ id: users.id, name: users.name })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, issue.projectId)),
  ]);
  const linkedIds = linkRows.map(link => link.linkedIssueId);
  const linkedIssues = linkedIds.length
    ? await db
        .select({
          id: issues.id,
          number: issues.number,
          title: issues.title,
          status: issues.status,
        })
        .from(issues)
        .where(inArray(issues.id, linkedIds))
    : [];
  const hydratedAttachments = await Promise.all(
    attachmentRows.map(async attachment => ({
      ...attachment,
      storageUrl:
        (await resolveStorageUrl(attachment.storageKey, attachment.storageUrl)) ??
        attachment.storageUrl,
    })),
  );
  return {
    issue,
    labels: issueLabelRows,
    comments: commentRows,
    watchers: watcherRows,
    attachments: hydratedAttachments,
    activity: activityRows,
    recommendations: recommendationRows,
    members: memberRows,
    links: linkRows.map(link => ({
      ...link,
      issue:
        linkedIssues.find(issueRow => issueRow.id === link.linkedIssueId) ??
        null,
    })),
  };
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
  const issue = (
    await db.select().from(issues).where(eq(issues.id, input.issueId)).limit(1)
  )[0];
  if (!issue) return;
  const project = (
    await db
      .select()
      .from(projects)
      .where(eq(projects.id, issue.projectId))
      .limit(1)
  )[0];
  if (!project) return;
  const watcherRows = input.recipientIds
    ? []
    : await db
        .select({ userId: issueWatchers.userId })
        .from(issueWatchers)
        .where(eq(issueWatchers.issueId, input.issueId));
  const recipientIds = (
    input.recipientIds ?? watcherRows.map(row => row.userId)
  ).filter(id => id !== input.actorId);
  if (!recipientIds.length) return;
  await db.insert(notifications).values(
    recipientIds.map(userId => ({
      userId,
      workspaceId: project.workspaceId,
      projectId: issue.projectId,
      issueId: issue.id,
      type: input.type,
      title: input.title,
      body: input.body,
    }))
  );
}

export async function countProjectStats(userId: number, projectId: number) {
  const db = await requireDb();
  await requireProjectRole(userId, projectId);
  const rows = await db
    .select()
    .from(issues)
    .where(eq(issues.projectId, projectId));
  const now = Date.now();
  const open = rows.filter(issue => issue.status !== "done");
  const done = rows.filter(issue => issue.status === "done");
  const bySeverity = ["blocker", "critical", "major", "minor", "trivial"].map(
    name => ({
      name,
      value: rows.filter(issue => issue.severity === name).length,
    })
  );
  const aging = [7, 14, 30].map(days => ({
    days,
    value: open.filter(
      issue => now - issue.createdAt.getTime() > days * 86_400_000
    ).length,
  }));
  return {
    total: rows.length,
    open: open.length,
    done: done.length,
    blockers: open.filter(
      issue => issue.isReleaseBlocker || issue.severity === "blocker"
    ).length,
    untriaged: rows.filter(issue => issue.status === "intake").length,
    overdue: open.filter(issue => issue.dueAt && issue.dueAt.getTime() < now)
      .length,
    bySeverity,
    aging,
    throughput: done.filter(
      issue =>
        issue.resolvedAt && now - issue.resolvedAt.getTime() <= 14 * 86_400_000
    ).length,
  };
}

export const issueEnums = {
  severity: ["blocker", "critical", "major", "minor", "trivial"] as const,
  priority: ["urgent", "high", "medium", "low", "none"] as const,
  status: ["intake", "triage", "in_progress", "verify", "done"] as const,
  resolution: [
    "fixed",
    "duplicate",
    "wont_fix",
    "invalid",
    "works_as_intended",
  ] as const,
};

export type DemoPersonaKey = "admin" | "triage" | "developer" | "viewer";

export const DEMO_PERSONAS: Record<
  DemoPersonaKey,
  {
    key: DemoPersonaKey;
    name: string;
    email: string;
    role: "admin" | "user";
    workspaceRole: "admin" | "member" | "viewer";
    projectRole: ProjectRole;
    title: string;
    description: string;
  }
> = {
  admin: {
    key: "admin",
    name: "Carol Danvers (Admin)",
    email: "admin@bugforge.demo",
    role: "admin",
    workspaceRole: "admin",
    projectRole: "admin",
    title: "System & Workspace Admin",
    description: "Full platform governance: workspace deletion, accent customization, member roles",
  },
  triage: {
    key: "triage",
    name: "Eve Adams (Triage Lead)",
    email: "triage@bugforge.demo",
    role: "user",
    workspaceRole: "member",
    projectRole: "triage",
    title: "Triage & Release Coordinator",
    description: "Issue lifecycle transitions, developer assignments, AI draft reviews, release blockers",
  },
  developer: {
    key: "developer",
    name: "Alice Smith (Core Developer)",
    email: "dev@bugforge.demo",
    role: "user",
    workspaceRole: "member",
    projectRole: "member",
    title: "Core Platform Engineer",
    description: "Edit issue details, reproduction steps, threaded comments, private attachments, issue links",
  },
  viewer: {
    key: "viewer",
    name: "Bob Jones (Reporter / Viewer)",
    email: "viewer@bugforge.demo",
    role: "user",
    workspaceRole: "viewer",
    projectRole: "viewer",
    title: "External Reporter / QA",
    description: "Read-only access: demonstrates server-enforced rejection on unauthorized modifications",
  },
};

export async function seedDemoIssues(
  db: ReturnType<typeof drizzle<typeof schema>>,
  projectId: number,
  userId: number
) {
  const existing = await db
    .select({ count: max(issues.number) })
    .from(issues)
    .where(eq(issues.projectId, projectId));
  if (Number(existing[0]?.count ?? 0) > 0) return;

  const [labelA11y, labelRel, labelSec] = await Promise.all([
    db.insert(labels).values({ projectId, name: "accessibility", color: "#DCCEFF" }).returning({ id: labels.id }),
    db.insert(labels).values({ projectId, name: "release", color: "#FFD8D2" }).returning({ id: labels.id }),
    db.insert(labels).values({ projectId, name: "security", color: "#A8E6CF" }).returning({ id: labels.id }),
  ]);

  const demoItems = [
    {
      number: 101,
      title: "Keyboard focus is lost after saving a saved search",
      description: "When submitting the modal form, the focus drops to body instead of returning to the button.",
      expectedResult: "Focus returns to the trigger button.",
      actualResult: "Focus is reset to document body.",
      reproducibleSteps: "1. Open Search\n2. Save view\n3. Press Tab",
      severity: "major" as const,
      priority: "high" as const,
      status: "intake" as const,
      isReleaseBlocker: false,
    },
    {
      number: 102,
      title: "Project accent preview does not announce the selected color",
      description: "Screen readers do not receive live region updates when a new hex accent is selected.",
      expectedResult: "Live region announces 'Selected Sage Green'.",
      actualResult: "Silent update.",
      reproducibleSteps: "1. Open Personalize\n2. Click accent #75937E\n3. Inspect ARIA announcement",
      severity: "minor" as const,
      priority: "medium" as const,
      status: "triage" as const,
      isReleaseBlocker: false,
    },
    {
      number: 103,
      title: "Release blocker banner remains visible after verification",
      description: "The critical blocker banner fails to unmount after transitioning to verify state.",
      expectedResult: "Banner clears once issue passes verify.",
      actualResult: "Banner persists indefinitely.",
      reproducibleSteps: "1. Open WEB-103\n2. Move to Verify\n3. Check Overview radar",
      severity: "critical" as const,
      priority: "urgent" as const,
      status: "in_progress" as const,
      isReleaseBlocker: true,
    },
    {
      number: 104,
      title: "Attachment download should return an expiring authorized URL",
      description: "Private attachments must resolve through short-lived signed URLs with 15m TTL.",
      expectedResult: "Signed URL expires after 900 seconds.",
      actualResult: "Works as expected under Supabase Storage.",
      reproducibleSteps: "1. Upload PNG evidence\n2. Inspect storageUrl marker\n3. Verify signature TTL",
      severity: "major" as const,
      priority: "high" as const,
      status: "verify" as const,
      isReleaseBlocker: false,
    },
    {
      number: 105,
      title: "Duplicate reports should preserve the original issue link",
      description: "Closing an issue as duplicate must retain the bidirectional relation link.",
      expectedResult: "Duplicate link renders with badge.",
      actualResult: "Linked successfully.",
      reproducibleSteps: "1. Move to Done with resolution duplicate\n2. Check issue links",
      severity: "minor" as const,
      priority: "low" as const,
      status: "done" as const,
      resolution: "duplicate" as const,
      isReleaseBlocker: false,
    },
    {
      number: 106,
      title: "Insights aging lane uses the project timezone consistently",
      description: "Date calculations for aging buckets must normalize to UTC milliseconds.",
      expectedResult: "Aging buckets calculate consistently.",
      actualResult: "Normalized to UTC.",
      reproducibleSteps: "1. Open Insights\n2. Inspect 7d, 14d, 30d lanes",
      severity: "major" as const,
      priority: "medium" as const,
      status: "done" as const,
      resolution: "fixed" as const,
      isReleaseBlocker: false,
    },
    {
      number: 107,
      title: "Human-reviewed summary draft omits the environment field",
      description: "AI draft generation should advise on test steps and caveats for reproduction.",
      expectedResult: "Draft provides structured test steps.",
      actualResult: "Draft stored with pending_review.",
      reproducibleSteps: "1. Open WEB-107\n2. Click AI review draft\n3. Review draft fields",
      severity: "major" as const,
      priority: "medium" as const,
      status: "triage" as const,
      isReleaseBlocker: false,
    },
    {
      number: 108,
      title: "Watcher notification should identify the changed status",
      description: "Notifications dispatched on status_change events must include the new lane name.",
      expectedResult: "Notification title says 'Status changed to verify'.",
      actualResult: "Formatted with statusMeta.",
      reproducibleSteps: "1. Toggle watch\n2. Move issue status\n3. Check Inbox",
      severity: "minor" as const,
      priority: "low" as const,
      status: "intake" as const,
      isReleaseBlocker: false,
    },
  ];

  const createdIssues: Array<{ id: number; number: number }> = [];
  for (const item of demoItems) {
    const [created] = await db
      .insert(issues)
      .values({
        projectId,
        number: item.number,
        title: item.title,
        description: item.description,
        expectedResult: item.expectedResult,
        actualResult: item.actualResult,
        reproducibleSteps: item.reproducibleSteps,
        severity: item.severity,
        priority: item.priority,
        status: item.status,
        resolution: (item as { resolution?: (typeof issueEnums.resolution)[number] }).resolution ?? null,
        reporterId: userId,
        assigneeId: userId,
        isReleaseBlocker: item.isReleaseBlocker,
        triagedAt: item.status !== "intake" ? new Date() : null,
        resolvedAt: item.status === "done" ? new Date() : null,
      })
      .returning({ id: issues.id, number: issues.number });
    if (created) createdIssues.push(created);
  }

  if (createdIssues[2] && createdIssues[0]) {
    await db.insert(issueLinks).values({
      issueId: createdIssues[2].id,
      linkedIssueId: createdIssues[0].id,
      type: "blocks",
      createdById: userId,
    });
  }
  if (createdIssues[0] && createdIssues[3]) {
    await db.insert(issueLinks).values({
      issueId: createdIssues[0].id,
      linkedIssueId: createdIssues[3].id,
      type: "blocks",
      createdById: userId,
    });
  }

  if (createdIssues[0]) {
    await db.insert(comments).values({
      issueId: createdIssues[0].id,
      authorId: userId,
      body: "Confirmed on Safari 17.4 and Chrome 124. When pressing Enter to save, focus resets to body.",
    });
  }
}

export async function ensureDemoPersonaUser(personaKey: string): Promise<typeof users.$inferSelect> {
  const db = await requireDb();
  const normalizedKey = (personaKey in DEMO_PERSONAS ? personaKey : "developer") as DemoPersonaKey;
  const persona = DEMO_PERSONAS[normalizedKey];
  const openId = `demo:${normalizedKey}`;

  await upsertUser({
    openId,
    name: persona.name,
    email: persona.email,
    loginMethod: "demo",
    role: persona.role,
  });

  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Demo persona user could not be initialized");

  const existingWorkspaces = await db.select().from(workspaces).limit(5);
  if (existingWorkspaces.length > 0) {
    for (const ws of existingWorkspaces) {
      await db
        .insert(workspaceMembers)
        .values({
          workspaceId: ws.id,
          userId: user.id,
          role: persona.workspaceRole,
        })
        .onConflictDoUpdate({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
          set: { role: persona.workspaceRole },
        });

      const wsProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, ws.id));
      for (const prj of wsProjects) {
        await db
          .insert(projectMembers)
          .values({
            projectId: prj.id,
            userId: user.id,
            role: persona.projectRole,
          })
          .onConflictDoUpdate({
            target: [projectMembers.projectId, projectMembers.userId],
            set: { role: persona.projectRole },
          });
      }
    }
  } else {
    const { projectId } = await createWorkspaceWithProject({
      userId: user.id,
      workspaceName: "Northstar Demo Workspace",
      projectName: "Web Console",
      projectKey: "WEB",
    });
    await seedDemoIssues(db, projectId, user.id);
  }

  return user;
}

export async function wouldCreateBlockCycle(
  issueId: number,
  linkedIssueId: number,
  type: "blocks" | "blocked_by" | "relates_to" | "duplicates"
): Promise<boolean> {
  if (type !== "blocks" && type !== "blocked_by") return false;
  const db = await requireDb();

  const source = type === "blocks" ? issueId : linkedIssueId;
  const target = type === "blocks" ? linkedIssueId : issueId;

  if (source === target) return true;

  const allLinks = await db
    .select({
      issueId: issueLinks.issueId,
      linkedIssueId: issueLinks.linkedIssueId,
      type: issueLinks.type,
    })
    .from(issueLinks);

  const adj = new Map<number, number[]>();
  for (const l of allLinks) {
    if (l.type === "blocks") {
      const list = adj.get(l.issueId) ?? [];
      list.push(l.linkedIssueId);
      adj.set(l.issueId, list);
    } else if (l.type === "blocked_by") {
      const list = adj.get(l.linkedIssueId) ?? [];
      list.push(l.issueId);
      adj.set(l.linkedIssueId, list);
    }
  }

  const queue = [target];
  const visited = new Set<number>([target]);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === source) return true;
    for (const next of adj.get(curr) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return false;
}

