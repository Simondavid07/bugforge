import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRoles = ["user", "admin"] as const;
export const workspaceRoles = ["admin", "member", "viewer"] as const;
export const projectRoles = ["viewer", "reporter", "member", "triage", "admin"] as const;
export const milestoneStatuses = ["planned", "active", "released", "archived"] as const;
export const issueSeverities = ["blocker", "critical", "major", "minor", "trivial"] as const;
export const issuePriorities = ["urgent", "high", "medium", "low", "none"] as const;
export const issueStatuses = ["intake", "triage", "in_progress", "verify", "done"] as const;
export const issueResolutions = ["fixed", "duplicate", "wont_fix", "invalid", "works_as_intended"] as const;
export const issueLinkTypes = ["relates_to", "duplicates", "blocked_by", "blocks"] as const;
export const notificationTypes = ["mention", "assignment", "watcher", "status_change", "system"] as const;
export const recommendationStates = ["pending_review", "applied", "dismissed"] as const;

type UserRole = (typeof userRoles)[number];
type WorkspaceRole = (typeof workspaceRoles)[number];
type ProjectRole = (typeof projectRoles)[number];
type MilestoneStatus = (typeof milestoneStatuses)[number];
type IssueSeverity = (typeof issueSeverities)[number];
type IssuePriority = (typeof issuePriorities)[number];
type IssueStatus = (typeof issueStatuses)[number];
type IssueResolution = (typeof issueResolutions)[number];
type IssueLinkType = (typeof issueLinkTypes)[number];
type NotificationType = (typeof notificationTypes)[number];
type RecommendationState = (typeof recommendationStates)[number];

const createdAt = () => timestamp("createdAt", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).$type<UserRole>().default("user").notNull(),
  avatarKey: varchar("avatarKey", { length: 500 }),
  avatarUrl: varchar("avatarUrl", { length: 750 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [uniqueIndex("workspace_slug_unique").on(table.slug)]);

export const workspaceMembers = pgTable("workspaceMembers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 16 }).$type<WorkspaceRole>().default("member").notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId),
  index("workspace_member_user_idx").on(table.userId),
]);

export const projects = pgTable("projects", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  workspaceId: integer("workspaceId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  key: varchar("key", { length: 12 }).notNull(),
  description: text("description"),
  accentColor: varchar("accentColor", { length: 7 }).notNull().default("#A55343"),
  logoKey: varchar("logoKey", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 750 }),
  workflow: jsonb("workflow").$type<string[]>().notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("workspace_project_key_unique").on(table.workspaceId, table.key),
  index("project_workspace_idx").on(table.workspaceId),
]);

export const projectMembers = pgTable("projectMembers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 16 }).$type<ProjectRole>().default("member").notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("project_member_unique").on(table.projectId, table.userId),
  index("project_member_user_idx").on(table.userId),
]);

export const milestones = pgTable("milestones", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  targetDate: timestamp("targetDate", { withTimezone: true }),
  status: varchar("status", { length: 16 }).$type<MilestoneStatus>().default("planned").notNull(),
  createdAt: createdAt(),
}, table => [index("milestone_project_idx").on(table.projectId)]);

export const components = pgTable("components", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  ownerId: integer("ownerId"),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("component_project_name_unique").on(table.projectId, table.name),
  index("component_project_idx").on(table.projectId),
]);

export const labels = pgTable("labels", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  name: varchar("name", { length: 60 }).notNull(),
  color: varchar("color", { length: 12 }).notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("label_project_name_unique").on(table.projectId, table.name),
  index("label_project_idx").on(table.projectId),
]);

export const issues = pgTable("issues", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  number: integer("number").notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  description: text("description"),
  expectedResult: text("expectedResult"),
  actualResult: text("actualResult"),
  reproducibleSteps: text("reproducibleSteps"),
  environment: text("environment"),
  severity: varchar("severity", { length: 16 }).$type<IssueSeverity>().default("major").notNull(),
  priority: varchar("priority", { length: 16 }).$type<IssuePriority>().default("medium").notNull(),
  status: varchar("status", { length: 16 }).$type<IssueStatus>().default("intake").notNull(),
  resolution: varchar("resolution", { length: 24 }).$type<IssueResolution>(),
  reporterId: integer("reporterId").notNull(),
  assigneeId: integer("assigneeId"),
  componentId: integer("componentId"),
  milestoneId: integer("milestoneId"),
  dueAt: timestamp("dueAt", { withTimezone: true }),
  isReleaseBlocker: boolean("isReleaseBlocker").default(false).notNull(),
  triagedAt: timestamp("triagedAt", { withTimezone: true }),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("issue_project_number_unique").on(table.projectId, table.number),
  index("issue_project_status_idx").on(table.projectId, table.status),
  index("issue_project_severity_idx").on(table.projectId, table.severity),
  index("issue_assignee_idx").on(table.assigneeId),
]);

export const issueLabels = pgTable("issueLabels", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  labelId: integer("labelId").notNull(),
}, table => [uniqueIndex("issue_label_unique").on(table.issueId, table.labelId)]);

export const issueLinks = pgTable("issueLinks", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  linkedIssueId: integer("linkedIssueId").notNull(),
  type: varchar("type", { length: 16 }).$type<IssueLinkType>().notNull(),
  createdById: integer("createdById").notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("issue_link_unique").on(table.issueId, table.linkedIssueId, table.type),
  index("issue_link_issue_idx").on(table.issueId),
]);

export const issueActivity = pgTable("issueActivity", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  actorId: integer("actorId"),
  type: varchar("type", { length: 80 }).notNull(),
  message: text("message"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
}, table => [index("issue_activity_issue_idx").on(table.issueId)]);

export const comments = pgTable("comments", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  authorId: integer("authorId").notNull(),
  parentId: integer("parentId"),
  body: text("body").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [index("comment_issue_idx").on(table.issueId)]);

export const issueWatchers = pgTable("issueWatchers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: createdAt(),
}, table => [
  uniqueIndex("issue_watcher_unique").on(table.issueId, table.userId),
  index("issue_watcher_user_idx").on(table.userId),
]);

export const attachments = pgTable("attachments", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  uploadedById: integer("uploadedById").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 750 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 160 }).notNull(),
  sizeBytes: integer("sizeBytes").notNull(),
  createdAt: createdAt(),
}, table => [index("attachment_issue_idx").on(table.issueId)]);

export const savedViews = pgTable("savedViews", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  projectId: integer("projectId").notNull(),
  ownerId: integer("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, table => [
  uniqueIndex("saved_view_owner_name_unique").on(table.projectId, table.ownerId, table.name),
  index("saved_view_project_idx").on(table.projectId),
]);

export const userPreferences = pgTable("userPreferences", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  sidebarOrder: jsonb("sidebarOrder").$type<string[]>().notNull(),
  projectOrder: jsonb("projectOrder").$type<number[]>().notNull(),
  savedSearches: jsonb("savedSearches").$type<Array<{ id: string; name: string; query: string; status?: IssueStatus; severity?: IssueSeverity }>>().notNull(),
  updatedAt: updatedAt(),
}, table => [uniqueIndex("user_preferences_user_unique").on(table.userId)]);

export const notifications = pgTable("notifications", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  workspaceId: integer("workspaceId").notNull(),
  projectId: integer("projectId"),
  issueId: integer("issueId"),
  type: varchar("type", { length: 24 }).$type<NotificationType>().notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body"),
  readAt: timestamp("readAt", { withTimezone: true }),
  createdAt: createdAt(),
}, table => [
  index("notification_user_read_idx").on(table.userId, table.readAt),
  index("notification_issue_idx").on(table.issueId),
]);

export const aiRecommendations = pgTable("aiRecommendations", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  issueId: integer("issueId").notNull(),
  requestedById: integer("requestedById").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  summary: text("summary").notNull(),
  suggestedSeverity: varchar("suggestedSeverity", { length: 20 }),
  suggestedLabels: jsonb("suggestedLabels").$type<string[]>().notNull(),
  duplicateCandidates: jsonb("duplicateCandidates").$type<Array<{ issueId: number; reason: string }>>().notNull(),
  reproducibleSteps: text("reproducibleSteps").notNull(),
  caveats: text("caveats").notNull(),
  confidence: integer("confidence").notNull(),
  state: varchar("state", { length: 24 }).$type<RecommendationState>().default("pending_review").notNull(),
  reviewedById: integer("reviewedById"),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  createdAt: createdAt(),
}, table => [index("ai_recommendation_issue_idx").on(table.issueId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Issue = typeof issues.$inferSelect;
