import { boolean, index, int, json, longtext, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: longtext("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarKey: varchar("avatarKey", { length: 500 }),
  avatarUrl: varchar("avatarUrl", { length: 750 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("workspace_slug_unique").on(table.slug)]);

export const workspaceMembers = mysqlTable("workspaceMembers", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "member", "viewer"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("workspace_member_unique").on(table.workspaceId, table.userId),
  index("workspace_member_user_idx").on(table.userId),
]);

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  key: varchar("key", { length: 12 }).notNull(),
  description: longtext("description"),
  accentColor: varchar("accentColor", { length: 7 }).notNull().default("#A55343"),
  logoKey: varchar("logoKey", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 750 }),
  workflow: json("workflow").$type<string[]>().notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("workspace_project_key_unique").on(table.workspaceId, table.key),
  index("project_workspace_idx").on(table.workspaceId),
]);

export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["viewer", "reporter", "member", "triage", "admin"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("project_member_unique").on(table.projectId, table.userId),
  index("project_member_user_idx").on(table.userId),
]);

export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  targetDate: timestamp("targetDate"),
  status: mysqlEnum("status", ["planned", "active", "released", "archived"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("milestone_project_idx").on(table.projectId)]);

export const components = mysqlTable("components", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: longtext("description"),
  ownerId: int("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("component_project_name_unique").on(table.projectId, table.name),
  index("component_project_idx").on(table.projectId),
]);

export const labels = mysqlTable("labels", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 60 }).notNull(),
  color: varchar("color", { length: 12 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("label_project_name_unique").on(table.projectId, table.name),
  index("label_project_idx").on(table.projectId),
]);

export const issues = mysqlTable("issues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  number: int("number").notNull(),
  title: varchar("title", { length: 250 }).notNull(),
  description: longtext("description"),
  expectedResult: longtext("expectedResult"),
  actualResult: longtext("actualResult"),
  reproducibleSteps: longtext("reproducibleSteps"),
  environment: longtext("environment"),
  severity: mysqlEnum("severity", ["blocker", "critical", "major", "minor", "trivial"]).default("major").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "medium", "low", "none"]).default("medium").notNull(),
  status: mysqlEnum("status", ["intake", "triage", "in_progress", "verify", "done"]).default("intake").notNull(),
  resolution: mysqlEnum("resolution", ["fixed", "duplicate", "wont_fix", "invalid", "works_as_intended"]),
  reporterId: int("reporterId").notNull(),
  assigneeId: int("assigneeId"),
  componentId: int("componentId"),
  milestoneId: int("milestoneId"),
  dueAt: timestamp("dueAt"),
  isReleaseBlocker: boolean("isReleaseBlocker").default(false).notNull(),
  triagedAt: timestamp("triagedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("issue_project_number_unique").on(table.projectId, table.number),
  index("issue_project_status_idx").on(table.projectId, table.status),
  index("issue_project_severity_idx").on(table.projectId, table.severity),
  index("issue_assignee_idx").on(table.assigneeId),
]);

export const issueLabels = mysqlTable("issueLabels", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  labelId: int("labelId").notNull(),
}, table => [uniqueIndex("issue_label_unique").on(table.issueId, table.labelId)]);

export const issueLinks = mysqlTable("issueLinks", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  linkedIssueId: int("linkedIssueId").notNull(),
  type: mysqlEnum("type", ["relates_to", "duplicates", "blocked_by", "blocks"]).notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("issue_link_unique").on(table.issueId, table.linkedIssueId, table.type),
  index("issue_link_issue_idx").on(table.issueId),
]);

export const issueActivity = mysqlTable("issueActivity", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  actorId: int("actorId"),
  type: varchar("type", { length: 80 }).notNull(),
  message: longtext("message"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("issue_activity_issue_idx").on(table.issueId)]);

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  authorId: int("authorId").notNull(),
  parentId: int("parentId"),
  body: longtext("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("comment_issue_idx").on(table.issueId)]);

export const issueWatchers = mysqlTable("issueWatchers", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("issue_watcher_unique").on(table.issueId, table.userId),
  index("issue_watcher_user_idx").on(table.userId),
]);

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  uploadedById: int("uploadedById").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 750 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 160 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("attachment_issue_idx").on(table.issueId)]);

export const savedViews = mysqlTable("savedViews", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  filters: json("filters").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("saved_view_owner_name_unique").on(table.projectId, table.ownerId, table.name),
  index("saved_view_project_idx").on(table.projectId),
]);

export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sidebarOrder: json("sidebarOrder").$type<string[]>().notNull(),
  projectOrder: json("projectOrder").$type<number[]>().notNull(),
  savedSearches: json("savedSearches").$type<Array<{ id: string; name: string; query: string; status?: string; severity?: string }>>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_preferences_user_unique").on(table.userId)]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  projectId: int("projectId"),
  issueId: int("issueId"),
  type: mysqlEnum("type", ["mention", "assignment", "watcher", "status_change", "system"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: longtext("body"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("notification_user_read_idx").on(table.userId, table.readAt),
  index("notification_issue_idx").on(table.issueId),
]);

export const aiRecommendations = mysqlTable("aiRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  requestedById: int("requestedById").notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  summary: longtext("summary").notNull(),
  suggestedSeverity: varchar("suggestedSeverity", { length: 20 }),
  suggestedLabels: json("suggestedLabels").$type<string[]>().notNull(),
  duplicateCandidates: json("duplicateCandidates").$type<Array<{ issueId: number; reason: string }>>().notNull(),
  reproducibleSteps: longtext("reproducibleSteps").notNull(),
  caveats: longtext("caveats").notNull(),
  confidence: int("confidence").notNull(),
  state: mysqlEnum("state", ["pending_review", "applied", "dismissed"]).default("pending_review").notNull(),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("ai_recommendation_issue_idx").on(table.issueId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Issue = typeof issues.$inferSelect;
