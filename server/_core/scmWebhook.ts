import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { issueActivity, issues } from "../../drizzle/schema.js";
import { getDb } from "../db.js";

interface GitHubCommit {
  id: string;
  message: string;
  timestamp: string;
  url: string;
  author: {
    name: string;
    email: string;
    username?: string;
  };
}

interface GitHubPushPayload {
  ref?: string;
  repository?: {
    name: string;
    full_name: string;
    html_url: string;
  };
  commits?: GitHubCommit[];
}

export async function handleGitHubWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as GitHubPushPayload;
    const commits = payload.commits ?? [];

    if (!Array.isArray(commits) || commits.length === 0) {
      return res.status(200).json({ ok: true, message: "No commits to process." });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ ok: false, message: "Database unavailable." });
    }

    let linkedCount = 0;

    for (const commit of commits) {
      const message = commit.message || "";
      const shortSha = commit.id.slice(0, 7);
      const authorName = commit.author?.name || commit.author?.username || "Developer";

      // Regex matching `#101` or `WEB-101` or `fixes #101` or `closes #101`
      const issueMatches = Array.from(
        message.matchAll(/(?:fixes|closes|resolves|refs|see|issue)?\s*(?:#|WEB-)(\d+)/gi)
      );

      const isFix = /(?:fixes|closes|resolves)\s*(?:#|WEB-)?\d+/i.test(message);

      for (const match of issueMatches) {
        const issueNumber = parseInt(match[1], 10);
        if (isNaN(issueNumber)) continue;

        const matchingIssues = await db
          .select()
          .from(issues)
          .where(eq(issues.number, issueNumber))
          .limit(1);

        const targetIssue = matchingIssues[0];
        if (!targetIssue) continue;

        // Record SCM commit in immutable activity ledger
        await db.insert(issueActivity).values({
          issueId: targetIssue.id,
          actorId: null,
          type: "scm.commit_linked",
          message: `Git commit [${shortSha}] by ${authorName}: "${message.split("\n")[0]}"`,
          metadata: {
            sha: commit.id,
            shortSha,
            url: commit.url,
            author: authorName,
            email: commit.author?.email,
            message: message.trim(),
            timestamp: commit.timestamp,
            isFix,
          },
        });

        // If commit explicitly declares 'fixes' / 'closes', advance status to 'verify'
        if (isFix && (targetIssue.status === "in_progress" || targetIssue.status === "triage")) {
          await db
            .update(issues)
            .set({ status: "verify", updatedAt: new Date() })
            .where(eq(issues.id, targetIssue.id));

          await db.insert(issueActivity).values({
            issueId: targetIssue.id,
            actorId: null,
            type: "issue.transitioned",
            message: `Moved from ${targetIssue.status} to verify via commit [${shortSha}]`,
            metadata: {
              from: targetIssue.status,
              to: "verify",
              trigger: "scm_commit",
              sha: shortSha,
            },
          });
        }

        linkedCount++;
      }
    }

    return res.status(200).json({
      ok: true,
      commitsProcessed: commits.length,
      linkedCount,
    });
  } catch (error) {
    console.error("[GitHub SCM Webhook Error]", error);
    return res.status(500).json({ ok: false, error: (error as Error).message });
  }
}
