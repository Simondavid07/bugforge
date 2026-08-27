import { describe, expect, it } from "vitest";
import {
  aiRecommendations,
  attachments,
  comments,
  components,
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
  workspaceMembers,
  workspaces,
} from "../drizzle/schema.js";
import { deleteWorkspace } from "./db.js";

function createTransactionDouble(options?: {
  projects?: Array<{ id: number }>;
  issues?: Array<{ id: number }>;
  rejectOnDelete?: unknown;
}) {
  const deletedTables: unknown[] = [];
  const selectResults = [
    options?.projects ?? [{ id: 101 }, { id: 102 }],
    options?.issues ?? [{ id: 1001 }],
  ];
  let selectIndex = 0;
  let rolledBack = false;

  const tx = {
    select: () => {
      const result = selectResults[selectIndex++] ?? [];
      const builder = {
        from: () => builder,
        where: () => builder,
        then: (
          resolve: (value: unknown) => unknown,
          reject?: (error: unknown) => unknown
        ) => Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    },
    delete: (table: unknown) => ({
      where: async () => {
        deletedTables.push(table);
        if (options?.rejectOnDelete === table)
          throw new Error("forced delete failure");
        return { rowCount: 1 };
      },
    }),
  };

  const db = {
    transaction: async (
      callback: (transaction: typeof tx) => Promise<unknown>
    ) => {
      try {
        return await callback(tx);
      } catch (error) {
        rolledBack = true;
        throw error;
      }
    },
  };

  return { db, deletedTables, getRolledBack: () => rolledBack };
}

describe("deleteWorkspace transaction", () => {
  it("removes only records reachable from the workspace project and issue IDs", async () => {
    const fake = createTransactionDouble({
      projects: [{ id: 101 }],
      issues: [{ id: 1001 }],
    });
    await deleteWorkspace(7, fake.db as never);

    expect(fake.deletedTables).toEqual([
      issueActivity,
      comments,
      issueWatchers,
      attachments,
      issueLabels,
      issueLinks,
      aiRecommendations,
      issues,
      savedViews,
      milestones,
      components,
      labels,
      projectMembers,
      projects,
      notifications,
      workspaceMembers,
      workspaces,
    ]);
  });

  it("does not delete orphan attachment rows when no issue belongs to the workspace", async () => {
    const fake = createTransactionDouble({ projects: [], issues: [] });
    await deleteWorkspace(7, fake.db as never);

    expect(fake.deletedTables).not.toContain(attachments);
    expect(fake.deletedTables).toEqual([
      notifications,
      workspaceMembers,
      workspaces,
    ]);
  });

  it("rolls back and never deletes the parent workspace after a dependent delete fails", async () => {
    const fake = createTransactionDouble({ rejectOnDelete: attachments });
    await expect(deleteWorkspace(7, fake.db as never)).rejects.toThrow(
      "forced delete failure"
    );

    expect(fake.getRolledBack()).toBe(true);
    expect(fake.deletedTables).toEqual([
      issueActivity,
      comments,
      issueWatchers,
      attachments,
    ]);
    expect(fake.deletedTables).not.toContain(issues);
    expect(fake.deletedTables).not.toContain(workspaces);
  });

  it("does not start a transaction when the database is unavailable", async () => {
    await expect(deleteWorkspace(7, null)).rejects.toThrow("database unavailable");
  });
});
