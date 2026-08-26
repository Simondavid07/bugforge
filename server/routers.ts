import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  aiRecommendations,
  attachments,
  comments,
  components,
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
  userPreferences,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema.js";
import {
  countProjectStats,
  createWorkspaceWithProject,
  deleteWorkspace,
  fetchIssueDetail,
  getDb,
  getNextIssueNumber,
  issueEnums,
  notifyIssueWatchers,
  recordActivity,
  requireDb,
  requireProjectRole,
  roleCan,
} from "./db.js";
import { invokeLLM, listLLMModels } from "./_core/llm.js";
import { storagePut } from "./storage.js";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";

const projectIdInput = z.object({ projectId: z.number().int().positive() });
const issueIdInput = z.object({ issueId: z.number().int().positive() });
const issueCreateInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(4).max(250),
  description: z.string().trim().max(20_000).optional(),
  expectedResult: z.string().trim().max(10_000).optional(),
  actualResult: z.string().trim().max(10_000).optional(),
  reproducibleSteps: z.string().trim().max(10_000).optional(),
  environment: z.string().trim().max(4_000).optional(),
  severity: z.enum(issueEnums.severity).default("major"),
  priority: z.enum(issueEnums.priority).default("medium"),
  componentId: z.number().int().positive().nullable().optional(),
  milestoneId: z.number().int().positive().nullable().optional(),
  labelIds: z.array(z.number().int().positive()).max(12).default([]),
  isReleaseBlocker: z.boolean().default(false),
});

function toTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  const message =
    error instanceof Error ? error.message : "Request could not be completed.";
  const code = message.includes("permission")
    ? "FORBIDDEN"
    : message.includes("not found")
      ? "NOT_FOUND"
      : "BAD_REQUEST";
  throw new TRPCError({ code, message });
}

async function access(
  userId: number,
  projectId: number,
  minimum: "viewer" | "reporter" | "member" | "triage" | "admin" = "viewer"
) {
  try {
    return await requireProjectRole(userId, projectId, minimum);
  } catch (error) {
    return toTrpcError(error);
  }
}

async function projectForIssue(
  userId: number,
  issueId: number,
  minimum: "viewer" | "reporter" | "member" | "triage" | "admin" = "viewer"
) {
  const db = await requireDb();
  const issue = (
    await db.select().from(issues).where(eq(issues.id, issueId)).limit(1)
  )[0];
  if (!issue)
    throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found." });
  await access(userId, issue.projectId, minimum);
  return issue;
}

const recommendationSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "bugforge_issue_recommendation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        suggestedSeverity: { type: "string", enum: [...issueEnums.severity] },
        suggestedLabels: { type: "array", items: { type: "string" } },
        duplicateCandidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issueId: { type: "integer" },
              reason: { type: "string" },
            },
            required: ["issueId", "reason"],
            additionalProperties: false,
          },
        },
        reproducibleSteps: { type: "string" },
        caveats: { type: "string" },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: [
        "summary",
        "suggestedSeverity",
        "suggestedLabels",
        "duplicateCandidates",
        "reproducibleSteps",
        "caveats",
        "confidence",
      ],
      additionalProperties: false,
    },
  },
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),

  workspace: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { workspaces: [], projects: [] };
      const memberships = await db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          role: workspaceMembers.role,
          name: workspaces.name,
          slug: workspaces.slug,
        })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(eq(workspaceMembers.userId, ctx.user.id));
      const adminWorkspaceIds = memberships
        .filter(row => row.role === "admin")
        .map(row => row.workspaceId);
      const directProjects = await db
        .select({ project: projects })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, ctx.user.id));
      const adminProjects = adminWorkspaceIds.length
        ? await db
            .select()
            .from(projects)
            .where(inArray(projects.workspaceId, adminWorkspaceIds))
        : [];
      const projectRows = [
        ...directProjects.map(row => row.project),
        ...adminProjects,
      ]
        .filter(
          (project, index, all) =>
            all.findIndex(other => other.id === project.id) === index
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      return { workspaces: memberships, projects: projectRows };
    }),
    create: protectedProcedure
      .input(
        z.object({
          workspaceName: z.string().trim().min(2).max(120),
          projectName: z.string().trim().min(2).max(120),
          projectKey: z
            .string()
            .trim()
            .regex(/^[A-Za-z][A-Za-z0-9_-]{1,10}$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await createWorkspaceWithProject({
            userId: ctx.user.id,
            ...input,
          });
        } catch (error) {
          return toTrpcError(error);
        }
      }),
    delete: protectedProcedure
      .input(
        z.object({
          workspaceId: z.number().int().positive(),
          confirmation: z.string().trim().min(1).max(120),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const membership = (
          await db
            .select({ role: workspaceMembers.role, name: workspaces.name })
            .from(workspaceMembers)
            .innerJoin(
              workspaces,
              eq(workspaceMembers.workspaceId, workspaces.id)
            )
            .where(
              and(
                eq(workspaceMembers.workspaceId, input.workspaceId),
                eq(workspaceMembers.userId, ctx.user.id)
              )
            )
            .limit(1)
        )[0];
        if (!membership || membership.role !== "admin")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only workspace admins can delete a workspace.",
          });
        if (input.confirmation !== membership.name)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Type the workspace name exactly to confirm deletion.",
          });
        try {
          return await deleteWorkspace(input.workspaceId);
        } catch (error) {
          return toTrpcError(error);
        }
      }),
  }),

  project: router({
    overview: protectedProcedure
      .input(projectIdInput)
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const membership = await access(ctx.user.id, input.projectId);
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);
        if (!project)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        const [
          stats,
          memberRows,
          milestoneRows,
          labelRows,
          componentRows,
          assignedRows,
        ] = await Promise.all([
          countProjectStats(ctx.user.id, input.projectId),
          db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: projectMembers.role,
            })
            .from(projectMembers)
            .innerJoin(users, eq(projectMembers.userId, users.id))
            .where(eq(projectMembers.projectId, input.projectId)),
          db
            .select()
            .from(milestones)
            .where(eq(milestones.projectId, input.projectId))
            .orderBy(asc(milestones.targetDate)),
          db
            .select()
            .from(labels)
            .where(eq(labels.projectId, input.projectId))
            .orderBy(asc(labels.name)),
          db
            .select()
            .from(components)
            .where(eq(components.projectId, input.projectId))
            .orderBy(asc(components.name)),
          db
            .select()
            .from(issues)
            .where(
              and(
                eq(issues.projectId, input.projectId),
                eq(issues.assigneeId, ctx.user.id)
              )
            )
            .orderBy(desc(issues.updatedAt))
            .limit(8),
        ]);
        return {
          project,
          membership,
          stats,
          members: memberRows,
          milestones: milestoneRows,
          labels: labelRows,
          components: componentRows,
          assigned: assignedRows,
        };
      }),
    addMember: protectedProcedure
      .input(
        z.object({
          projectId: z.number().int().positive(),
          userId: z.number().int().positive(),
          role: z.enum(["viewer", "reporter", "member", "triage", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId, "admin");
        await db
          .insert(projectMembers)
          .values({
            projectId: input.projectId,
            userId: input.userId,
            role: input.role,
          })
          .onConflictDoUpdate({
            target: [projectMembers.projectId, projectMembers.userId],
            set: { role: input.role },
          });
        return { success: true };
      }),
    updateWorkflow: protectedProcedure
      .input(
        z.object({
          projectId: z.number().int().positive(),
          workflow: z.array(z.enum(issueEnums.status)).min(3).max(5),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId, "admin");
        const workflow = Array.from(new Set(input.workflow));
        if (!workflow.includes("intake") || !workflow.includes("done"))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A workflow must include Intake and Done.",
          });
        await db
          .update(projects)
          .set({ workflow })
          .where(eq(projects.id, input.projectId));
        return { success: true, workflow };
      }),
    updateAccent: protectedProcedure
      .input(
        z.object({
          projectId: z.number().int().positive(),
          accentColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color."),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId, "admin");
        const accentColor = input.accentColor.toUpperCase();
        await db
          .update(projects)
          .set({ accentColor })
          .where(eq(projects.id, input.projectId));
        return { success: true, accentColor };
      }),
  }),

  issues: router({
    list: protectedProcedure
      .input(
        projectIdInput.extend({
          query: z.string().trim().max(100).optional(),
          status: z.enum(issueEnums.status).optional(),
          severity: z.enum(issueEnums.severity).optional(),
          assignee: z.number().int().positive().optional(),
          sort: z
            .enum(["updated", "created", "priority", "severity"])
            .default("updated"),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(5).max(100).default(25),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId);
        const rows = await db
          .select({ issue: issues, reporterName: users.name })
          .from(issues)
          .innerJoin(users, eq(issues.reporterId, users.id))
          .where(eq(issues.projectId, input.projectId))
          .orderBy(
            input.sort === "created"
              ? desc(issues.createdAt)
              : desc(issues.updatedAt)
          );
        const query = input.query?.toLowerCase();
        const filtered = rows.filter(
          row =>
            (!query ||
              row.issue.title.toLowerCase().includes(query) ||
              (row.issue.description ?? "").toLowerCase().includes(query)) &&
            (!input.status || row.issue.status === input.status) &&
            (!input.severity || row.issue.severity === input.severity) &&
            (!input.assignee || row.issue.assigneeId === input.assignee)
        );
        const severityOrder = {
          blocker: 0,
          critical: 1,
          major: 2,
          minor: 3,
          trivial: 4,
        } as const;
        const priorityOrder = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
          none: 4,
        } as const;
        filtered.sort((a, b) =>
          input.sort === "severity"
            ? severityOrder[a.issue.severity] - severityOrder[b.issue.severity]
            : input.sort === "priority"
              ? priorityOrder[a.issue.priority] -
                priorityOrder[b.issue.priority]
              : input.sort === "created"
                ? b.issue.createdAt.getTime() - a.issue.createdAt.getTime()
                : b.issue.updatedAt.getTime() - a.issue.updatedAt.getTime()
        );
        const total = filtered.length;
        const pageCount = Math.max(1, Math.ceil(total / input.pageSize));
        const page = Math.min(input.page, pageCount);
        const paged = filtered.slice(
          (page - 1) * input.pageSize,
          page * input.pageSize
        );
        const issueIds = paged.map(row => row.issue.id);
        const labelRows = issueIds.length
          ? await db
              .select({
                issueId: issueLabels.issueId,
                id: labels.id,
                name: labels.name,
                color: labels.color,
              })
              .from(issueLabels)
              .innerJoin(labels, eq(issueLabels.labelId, labels.id))
              .where(inArray(issueLabels.issueId, issueIds))
          : [];
        return {
          items: paged.map(row => ({
            ...row.issue,
            reporterName: row.reporterName,
            labels: labelRows
              .filter(label => label.issueId === row.issue.id)
              .map(({ id, name, color }) => ({ id, name, color })),
          })),
          total,
          page,
          pageCount,
          pageSize: input.pageSize,
        };
      }),
    board: protectedProcedure
      .input(projectIdInput)
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId);
        return db
          .select()
          .from(issues)
          .where(eq(issues.projectId, input.projectId))
          .orderBy(desc(issues.updatedAt));
      }),
    get: protectedProcedure
      .input(issueIdInput)
      .query(async ({ ctx, input }) => {
        try {
          const detail = await fetchIssueDetail(ctx.user.id, input.issueId);
          if (!detail)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Issue not found.",
            });
          return detail;
        } catch (error) {
          return toTrpcError(error);
        }
      }),
    create: protectedProcedure
      .input(issueCreateInput)
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId, "reporter");
        const number = await getNextIssueNumber(input.projectId);
        const [createdIssue] = await db
          .insert(issues)
          .values({
            projectId: input.projectId,
            number,
            title: input.title,
            description: input.description ?? null,
            expectedResult: input.expectedResult ?? null,
            actualResult: input.actualResult ?? null,
            reproducibleSteps: input.reproducibleSteps ?? null,
            environment: input.environment ?? null,
            severity: input.severity,
            priority: input.priority,
            componentId: input.componentId ?? null,
            milestoneId: input.milestoneId ?? null,
            reporterId: ctx.user.id,
            isReleaseBlocker: input.isReleaseBlocker,
          })
          .returning({ id: issues.id });
        if (!createdIssue)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Issue creation did not return an identifier.",
          });
        const issueId = createdIssue.id;
        if (input.labelIds.length)
          await db
            .insert(issueLabels)
            .values(input.labelIds.map(labelId => ({ issueId, labelId })));
        await recordActivity({
          issueId,
          actorId: ctx.user.id,
          type: "issue.created",
          message: `Created ${number}: ${input.title}`,
        });
        return { issueId, number };
      }),
    update: protectedProcedure
      .input(
        z.object({
          issueId: z.number().int().positive(),
          title: z.string().trim().min(4).max(250).optional(),
          description: z.string().trim().max(20_000).nullable().optional(),
          reproducibleSteps: z
            .string()
            .trim()
            .max(10_000)
            .nullable()
            .optional(),
          environment: z.string().trim().max(4_000).nullable().optional(),
          severity: z.enum(issueEnums.severity).optional(),
          priority: z.enum(issueEnums.priority).optional(),
          assigneeId: z.number().int().positive().nullable().optional(),
          componentId: z.number().int().positive().nullable().optional(),
          milestoneId: z.number().int().positive().nullable().optional(),
          dueAt: z.date().nullable().optional(),
          isReleaseBlocker: z.boolean().optional(),
          labelIds: z.array(z.number().int().positive()).max(12).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "member"
        );
        const { issueId, labelIds, ...changes } = input;
        if (
          (changes.assigneeId !== undefined ||
            changes.componentId !== undefined ||
            changes.milestoneId !== undefined ||
            changes.isReleaseBlocker !== undefined) &&
          !(await access(ctx.user.id, issue.projectId, "triage"))
        )
          return;
        await db.update(issues).set(changes).where(eq(issues.id, issueId));
        if (labelIds) {
          await db.delete(issueLabels).where(eq(issueLabels.issueId, issueId));
          if (labelIds.length)
            await db
              .insert(issueLabels)
              .values(labelIds.map(labelId => ({ issueId, labelId })));
        }
        await recordActivity({
          issueId,
          actorId: ctx.user.id,
          type: "issue.updated",
          message: "Updated issue details",
        });
        if (changes.assigneeId && changes.assigneeId !== issue.assigneeId)
          await notifyIssueWatchers({
            issueId,
            actorId: ctx.user.id,
            type: "assignment",
            title: "Issue assignment changed",
            body: issue.title,
            recipientIds: [changes.assigneeId],
          });
        return { success: true };
      }),
    transition: protectedProcedure
      .input(
        z.object({
          issueId: z.number().int().positive(),
          status: z.enum(issueEnums.status),
          resolution: z.enum(issueEnums.resolution).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "triage"
        );
        if (input.status === "done" && !input.resolution)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A resolution is required before closing an issue.",
          });
        await db
          .update(issues)
          .set({
            status: input.status,
            resolution:
              input.status === "done" ? (input.resolution ?? null) : null,
            triagedAt: input.status === "triage" ? new Date() : issue.triagedAt,
            resolvedAt: input.status === "done" ? new Date() : null,
          })
          .where(eq(issues.id, issue.id));
        await recordActivity({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "issue.transitioned",
          message: `Moved from ${issue.status} to ${input.status}`,
          metadata: {
            from: issue.status,
            to: input.status,
            resolution: input.resolution ?? null,
          },
        });
        await notifyIssueWatchers({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "status_change",
          title: `Status changed to ${input.status.replace("_", " ")}`,
          body: issue.title,
        });
        return { success: true };
      }),
    addComment: protectedProcedure
      .input(
        z.object({
          issueId: z.number().int().positive(),
          body: z.string().trim().min(1).max(10_000),
          parentId: z.number().int().positive().nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "reporter"
        );
        await db
          .insert(comments)
          .values({
            issueId: input.issueId,
            authorId: ctx.user.id,
            body: input.body,
            parentId: input.parentId ?? null,
          });
        await recordActivity({
          issueId: input.issueId,
          actorId: ctx.user.id,
          type: "comment.created",
          message: "Added a comment",
        });
        const mentionedIds = Array.from(
          input.body.matchAll(/@member-(\d+)/g)
        ).map(match => Number(match[1]));
        if (mentionedIds.length) {
          const members = await db
            .select({ userId: projectMembers.userId })
            .from(projectMembers)
            .where(eq(projectMembers.projectId, issue.projectId));
          const allowedIds = members.map(member => member.userId);
          const recipients = mentionedIds.filter(id => allowedIds.includes(id));
          await notifyIssueWatchers({
            issueId: issue.id,
            actorId: ctx.user.id,
            type: "mention",
            title: "You were mentioned in a comment",
            body: issue.title,
            recipientIds: recipients,
          });
        }
        return { success: true };
      }),
    toggleWatch: protectedProcedure
      .input(issueIdInput)
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(ctx.user.id, input.issueId);
        const existing = await db
          .select()
          .from(issueWatchers)
          .where(
            and(
              eq(issueWatchers.issueId, input.issueId),
              eq(issueWatchers.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (existing[0]) {
          await db
            .delete(issueWatchers)
            .where(eq(issueWatchers.id, existing[0].id));
          return { watching: false };
        }
        await db
          .insert(issueWatchers)
          .values({ issueId: input.issueId, userId: ctx.user.id });
        await recordActivity({
          issueId: input.issueId,
          actorId: ctx.user.id,
          type: "watcher.added",
          message: "Started watching this issue",
        });
        await notifyIssueWatchers({
          issueId: input.issueId,
          actorId: ctx.user.id,
          type: "watcher",
          title: "A watcher joined this issue",
          body: issue.title,
          recipientIds: [
            issue.reporterId,
            ...(issue.assigneeId ? [issue.assigneeId] : []),
          ],
        });
        return { watching: true };
      }),
    link: protectedProcedure
      .input(
        z.object({
          issueId: z.number().int().positive(),
          linkedIssueNumber: z.number().int().positive(),
          type: z.enum(["relates_to", "duplicates", "blocked_by", "blocks"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "member"
        );
        const linked = (
          await db
            .select()
            .from(issues)
            .where(
              and(
                eq(issues.projectId, issue.projectId),
                eq(issues.number, input.linkedIssueNumber)
              )
            )
            .limit(1)
        )[0];
        if (!linked)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No issue with that number exists in this project.",
          });
        if (linked.id === issue.id)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "An issue cannot link to itself.",
          });
        await db
          .insert(issueLinks)
          .values({
            issueId: input.issueId,
            linkedIssueId: linked.id,
            type: input.type,
            createdById: ctx.user.id,
          })
          .onConflictDoUpdate({
            target: [
              issueLinks.issueId,
              issueLinks.linkedIssueId,
              issueLinks.type,
            ],
            set: { type: input.type },
          });
        await recordActivity({
          issueId: input.issueId,
          actorId: ctx.user.id,
          type: "issue.linked",
          message: `Linked issue #${linked.number} as ${input.type}`,
        });
        return { success: true };
      }),
  }),

  views: router({
    list: protectedProcedure
      .input(projectIdInput)
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId);
        return db
          .select()
          .from(savedViews)
          .where(
            and(
              eq(savedViews.projectId, input.projectId),
              eq(savedViews.ownerId, ctx.user.id)
            )
          )
          .orderBy(asc(savedViews.name));
      }),
    save: protectedProcedure
      .input(
        z.object({
          projectId: z.number().int().positive(),
          name: z.string().trim().min(2).max(80),
          filters: z.record(z.string(), z.unknown()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await access(ctx.user.id, input.projectId);
        await db
          .insert(savedViews)
          .values({
            projectId: input.projectId,
            ownerId: ctx.user.id,
            name: input.name,
            filters: input.filters,
          })
          .onConflictDoUpdate({
            target: [savedViews.projectId, savedViews.ownerId, savedViews.name],
            set: { filters: input.filters },
          });
        return { success: true };
      }),
  }),

  personalization: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      const existing = (
        await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1)
      )[0];
      const user = (
        await db
          .select({ avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1)
      )[0];
      return {
        ...(existing ?? {
          sidebarOrder: [
            "/",
            "/issues",
            "/boards",
            "/analytics",
            "/notifications",
          ],
          projectOrder: [],
          savedSearches: [],
        }),
        avatarUrl: user?.avatarUrl ?? null,
      };
    }),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          sidebarOrder: z
            .array(
              z.enum([
                "/",
                "/issues",
                "/boards",
                "/analytics",
                "/notifications",
              ])
            )
            .length(5),
          projectOrder: z.array(z.number().int().positive()).max(100),
          savedSearches: z
            .array(
              z.object({
                id: z.string().min(1).max(80),
                name: z.string().trim().min(2).max(80),
                query: z.string().trim().max(100),
                status: z.enum(issueEnums.status).optional(),
                severity: z.enum(issueEnums.severity).optional(),
              })
            )
            .max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const sidebarOrder = Array.from(new Set(input.sidebarOrder));
        if (sidebarOrder.length !== 5)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Sidebar order must contain each workspace view once.",
          });
        await db
          .insert(userPreferences)
          .values({ userId: ctx.user.id, ...input, sidebarOrder })
          .onConflictDoUpdate({
            target: userPreferences.userId,
            set: { ...input, sidebarOrder },
          });
        return { success: true, ...input, sidebarOrder };
      }),
    uploadImage: protectedProcedure
      .input(
        z.object({
          target: z.enum(["avatar", "project_logo"]),
          projectId: z.number().int().positive().optional(),
          fileName: z.string().trim().min(1).max(255),
          contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
          dataUrl: z.string().min(1).max(3_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        if (input.target === "project_logo" && !input.projectId)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a project for its logo.",
          });
        if (input.target === "project_logo")
          await access(ctx.user.id, input.projectId!, "admin");
        const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match || match[1] !== input.contentType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The image data does not match its declared type.",
          });
        const bytes = Buffer.from(match[2], "base64");
        if (!bytes.length || bytes.length > 2 * 1024 * 1024)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Images must be 2 MB or smaller.",
          });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const key =
          input.target === "avatar"
            ? `bugforge/user-${ctx.user.id}/avatar/${Date.now()}-${safeName}`
            : `bugforge/project-${input.projectId}/branding/${Date.now()}-${safeName}`;
        const stored = await storagePut(key, bytes, input.contentType);
        if (input.target === "avatar")
          await db
            .update(users)
            .set({ avatarKey: stored.key, avatarUrl: stored.url })
            .where(eq(users.id, ctx.user.id));
        else
          await db
            .update(projects)
            .set({ logoKey: stored.key, logoUrl: stored.url })
            .where(eq(projects.id, input.projectId!));
        return { success: true, key: stored.key, url: stored.url };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(40);
    }),
    markRead: protectedProcedure
      .input(
        z.object({ ids: z.array(z.number().int().positive()).min(1).max(50) })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, ctx.user.id),
              inArray(notifications.id, input.ids)
            )
          );
        return { success: true };
      }),
  }),

  attachments: router({
    upload: protectedProcedure
      .input(
        z.object({
          issueId: z.number().int().positive(),
          fileName: z.string().trim().min(1).max(255),
          contentType: z.enum([
            "image/png",
            "image/jpeg",
            "image/webp",
            "text/plain",
            "application/json",
            "application/pdf",
          ]),
          dataUrl: z.string().min(1).max(7_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "reporter"
        );
        const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match || match[1] !== input.contentType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid file data.",
          });
        const bytes = Buffer.from(match[2], "base64");
        if (!bytes.length || bytes.length > 5 * 1024 * 1024)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Evidence files must be 5 MB or smaller.",
          });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const objectKey = `bugforge/project-${issue.projectId}/issue-${issue.id}/${Date.now()}-${safeName}`;
        const stored = await storagePut(objectKey, bytes, input.contentType);
        const [attachment] = await db
          .insert(attachments)
          .values({
            issueId: issue.id,
            uploadedById: ctx.user.id,
            storageKey: stored.key,
            storageUrl: stored.url,
            fileName: safeName,
            contentType: input.contentType,
            sizeBytes: bytes.length,
          })
          .returning({ id: attachments.id });
        if (!attachment)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Attachment creation did not return an identifier.",
          });
        const attachmentId = attachment.id;
        await recordActivity({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "attachment.added",
          message: `Added evidence: ${safeName}`,
          metadata: {
            attachmentId,
            contentType: input.contentType,
            sizeBytes: bytes.length,
          },
        });
        return { attachmentId, fileName: safeName, storageUrl: stored.url };
      }),
  }),

  ai: router({
    analyzeIssue: protectedProcedure
      .input(issueIdInput)
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const issue = await projectForIssue(
          ctx.user.id,
          input.issueId,
          "member"
        );
        const [project, projectLabels, candidates, catalog] = await Promise.all(
          [
            db
              .select()
              .from(projects)
              .where(eq(projects.id, issue.projectId))
              .limit(1),
            db
              .select({ name: labels.name })
              .from(labels)
              .where(eq(labels.projectId, issue.projectId)),
            db
              .select({
                id: issues.id,
                number: issues.number,
                title: issues.title,
                description: issues.description,
              })
              .from(issues)
              .where(eq(issues.projectId, issue.projectId))
              .orderBy(desc(issues.updatedAt))
              .limit(25),
            listLLMModels(),
          ]
        );
        const model =
          catalog.data.find(item => item.id === "gpt-5-mini")?.id ??
          catalog.data[0]?.id;
        if (!model)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "No AI model is currently available.",
          });
        const candidateText = candidates
          .filter(candidate => candidate.id !== issue.id)
          .map(
            candidate =>
              `#${candidate.number} (id ${candidate.id}): ${candidate.title}\n${candidate.description ?? ""}`
          )
          .join("\n---\n");
        const prompt = `Project: ${project[0]?.name ?? "Unknown"}\nKnown labels: ${projectLabels.map(label => label.name).join(", ") || "none"}\n\nIssue #${issue.number}: ${issue.title}\nDescription: ${issue.description ?? "Not provided"}\nExpected: ${issue.expectedResult ?? "Not provided"}\nActual: ${issue.actualResult ?? "Not provided"}\nCurrent steps: ${issue.reproducibleSteps ?? "Not provided"}\nEnvironment: ${issue.environment ?? "Not provided"}\n\nPossible prior issues:\n${candidateText || "None"}`;
        const response = await invokeLLM({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are BugForge’s compact issue-analysis assistant. Return concise recommendations only. Do not claim certainty, do not invent evidence, and treat every output as a draft for human review. Suggest at most five existing label names. Duplicate candidate IDs must come only from the supplied prior issues.",
            },
            { role: "user", content: prompt },
          ],
          response_format: recommendationSchema,
        });
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string")
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "The AI assistant did not return a recommendation.",
          });
        const draft = JSON.parse(content) as {
          summary: string;
          suggestedSeverity: string;
          suggestedLabels: string[];
          duplicateCandidates: Array<{ issueId: number; reason: string }>;
          reproducibleSteps: string;
          caveats: string;
          confidence: number;
        };
        const [recommendation] = await db
          .insert(aiRecommendations)
          .values({
            issueId: issue.id,
            requestedById: ctx.user.id,
            model,
            summary: draft.summary,
            suggestedSeverity: draft.suggestedSeverity,
            suggestedLabels: draft.suggestedLabels,
            duplicateCandidates: draft.duplicateCandidates,
            reproducibleSteps: draft.reproducibleSteps,
            caveats: draft.caveats,
            confidence: draft.confidence,
          })
          .returning({ id: aiRecommendations.id });
        if (!recommendation)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Recommendation creation did not return an identifier.",
          });
        const recommendationId = recommendation.id;
        await recordActivity({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "ai.recommendation_created",
          message: "Generated an AI draft for human review",
          metadata: { recommendationId, model },
        });
        return {
          recommendationId,
          draft: { ...draft, state: "pending_review", model },
        };
      }),
    applyRecommendation: protectedProcedure
      .input(
        z.object({
          recommendationId: z.number().int().positive(),
          applySummary: z.boolean().default(true),
          applySeverity: z.boolean().default(false),
          applySteps: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const recommendation = (
          await db
            .select()
            .from(aiRecommendations)
            .where(eq(aiRecommendations.id, input.recommendationId))
            .limit(1)
        )[0];
        if (!recommendation)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "AI draft not found.",
          });
        const issue = await projectForIssue(
          ctx.user.id,
          recommendation.issueId,
          "member"
        );
        if (recommendation.state !== "pending_review")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This AI draft has already been reviewed.",
          });
        const changes: Partial<typeof issues.$inferInsert> = {};
        if (input.applySummary) changes.description = recommendation.summary;
        if (
          input.applySeverity &&
          issueEnums.severity.includes(
            recommendation.suggestedSeverity as (typeof issueEnums.severity)[number]
          )
        )
          changes.severity =
            recommendation.suggestedSeverity as (typeof issueEnums.severity)[number];
        if (input.applySteps)
          changes.reproducibleSteps = recommendation.reproducibleSteps;
        if (Object.keys(changes).length)
          await db.update(issues).set(changes).where(eq(issues.id, issue.id));
        await db
          .update(aiRecommendations)
          .set({
            state: "applied",
            reviewedById: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(aiRecommendations.id, recommendation.id));
        await recordActivity({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "ai.recommendation_applied",
          message: "Reviewed and applied selected AI draft fields",
          metadata: { recommendationId: recommendation.id, applied: input },
        });
        return { success: true };
      }),
    dismissRecommendation: protectedProcedure
      .input(z.object({ recommendationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const recommendation = (
          await db
            .select()
            .from(aiRecommendations)
            .where(eq(aiRecommendations.id, input.recommendationId))
            .limit(1)
        )[0];
        if (!recommendation)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "AI draft not found.",
          });
        const issue = await projectForIssue(
          ctx.user.id,
          recommendation.issueId,
          "member"
        );
        await db
          .update(aiRecommendations)
          .set({
            state: "dismissed",
            reviewedById: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(aiRecommendations.id, recommendation.id));
        await recordActivity({
          issueId: issue.id,
          actorId: ctx.user.id,
          type: "ai.recommendation_dismissed",
          message: "Dismissed an AI draft",
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
