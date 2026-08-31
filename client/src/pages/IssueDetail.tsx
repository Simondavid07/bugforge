import { useAuth } from "@/_core/hooks/useAuth";
import { useCorrespondenceSurface } from "@/hooks/useCorrespondenceSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockerGraph } from "@/components/BlockerGraph";
import {
  initials,
  relativeTime,
  severityMeta,
  statusMeta,
} from "@/lib/bugforge";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  Eye,
  FileText,
  GitBranch,
  GitCommit,
  Link2,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Reply,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/json",
  "application/pdf",
] as const;
type LinkType = "relates_to" | "duplicates" | "blocked_by" | "blocks";
const panel =
  "rounded-[24px] border border-white/10 bg-white/[.045] shadow-[0_18px_52px_rgba(0,0,0,.2)]";

export default function IssueDetail() {
  useCorrespondenceSurface("issue-desk");
  const [, params] = useRoute("/issues/:id");
  const issueId = Number(params?.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const detail = trpc.issues.get.useQuery(
    { issueId },
    { enabled: Number.isFinite(issueId) && issueId > 0 }
  );

  const refresh = () =>
    Promise.all([
      utils.issues.get.invalidate({ issueId }),
      utils.issues.list.invalidate(),
      utils.issues.dependencyGraph.invalidate(),
      utils.project.overview.invalidate(),
    ]);

  const comment = trpc.issues.addComment.useMutation({ onSuccess: refresh });
  const watch = trpc.issues.toggleWatch.useMutation({ onSuccess: refresh });
  const transition = trpc.issues.transition.useMutation({ onSuccess: refresh });
  const analyze = trpc.ai.analyzeIssue.useMutation({ onSuccess: refresh });
  const applyAi = trpc.ai.applyRecommendation.useMutation({ onSuccess: refresh });
  const dismissAi = trpc.ai.dismissRecommendation.useMutation({
    onSuccess: refresh,
  });
  const upload = trpc.attachments.upload.useMutation({ onSuccess: refresh });
  const link = trpc.issues.link.useMutation({
    onSuccess: refresh,
    onError: err => toast.error(err.message),
  });

  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [resolution, setResolution] = useState("fixed");
  const [linkedIssueNumber, setLinkedIssueNumber] = useState("");
  const [linkType, setLinkType] = useState<LinkType>("relates_to");
  const [showGraph, setShowGraph] = useState(false);

  if (detail.isLoading) return <LoadingDesk />;
  if (detail.error || !detail.data)
    return (
      <UnavailableDesk
        message={detail.error?.message}
        onBack={() => setLocation("/issues")}
      />
    );

  const {
    issue,
    labels,
    comments,
    watchers,
    attachments,
    activity,
    recommendations,
    links,
    members,
  } = detail.data;

  const watching = watchers.some(watcher => watcher.userId === user?.id);
  const currentStatus = status || issue.status;

  const scmCommits = activity.filter(
    event => event.type === "scm.commit_linked"
  );

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentBody.trim()) return;
    await comment.mutateAsync({
      issueId,
      body: commentBody,
      parentId: replyTo,
    });
    setCommentBody("");
    setReplyTo(null);
    toast.success(replyTo ? "Reply posted" : "Comment posted");
  };

  const submitTransition = async () => {
    await transition.mutateAsync({
      issueId,
      status: currentStatus as keyof typeof statusMeta,
      resolution:
        currentStatus === "done"
          ? (resolution as
              | "fixed"
              | "duplicate"
              | "wont_fix"
              | "invalid"
              | "works_as_intended")
          : undefined,
    });
    setStatus("");
    toast.success("Workflow updated");
  };

  const submitLink = async (event: FormEvent) => {
    event.preventDefault();
    const number = Number(linkedIssueNumber);
    if (!number) return;
    await link.mutateAsync({ issueId, linkedIssueNumber: number, type: linkType });
    setLinkedIssueNumber("");
    toast.success("Issue link added");
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number]))
      return toast.error(
        "Use PNG, JPG, WebP, TXT, JSON, or PDF evidence only."
      );
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Evidence files must be 5 MB or smaller.");
    const dataUrl = await readFile(file);
    await upload.mutateAsync({
      issueId,
      fileName: file.name,
      contentType: file.type as (typeof allowedTypes)[number],
      dataUrl,
    });
    toast.success("Evidence attached");
    event.target.value = "";
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLocation("/issues")}
          className="group flex items-center gap-2 text-xs font-medium text-white/45 transition-colors hover:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[.04] group-hover:bg-white/[.1]">
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
          Back to issue explorer
        </button>

        <Button
          onClick={() => setShowGraph(!showGraph)}
          variant="outline"
          className="h-8 rounded-xl border-white/15 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
        >
          <GitBranch className="mr-1.5 h-3.5 w-3.5 text-[#FF7164]" />
          {showGraph ? "Hide Dependency Graph" : "View Dependency Graph"}
        </Button>
      </div>

      {/* Optional In-Place Dependency & Blocker Graph */}
      {showGraph && (
        <div className="animate-in fade-in duration-200">
          <BlockerGraph
            projectId={issue.projectId}
            highlightIssueId={issue.id}
          />
        </div>
      )}

      {/* Issue Header Banner */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_87%_18%,rgba(255,118,104,.2),transparent_25%),linear-gradient(120deg,rgba(166,128,255,.12),rgba(255,255,255,.035))] p-7 shadow-[0_26px_80px_rgba(0,0,0,.27)] md:p-9">
        <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-black/15 px-2 py-1 font-mono text-[10px] text-white/60">
                #{issue.number}
              </span>
              <Badge
                className={`rounded-full border-0 px-2.5 py-1 text-[10px] ${statusMeta[issue.status].className}`}
              >
                {statusMeta[issue.status].label}
              </Badge>
              <Badge
                className={`rounded-full border-0 px-2.5 py-1 text-[10px] ${severityMeta[issue.severity].className}`}
              >
                {severityMeta[issue.severity].label}
              </Badge>
              {issue.isReleaseBlocker && (
                <Badge className="rounded-full border-0 bg-[#ff7668] px-2.5 py-1 text-[10px] text-[#171827] font-bold">
                  🚨 RELEASE BLOCKER
                </Badge>
              )}
            </div>
            <h1 className="display-heading mt-5 text-4xl leading-[.94] text-white md:text-6xl">
              {issue.title}
            </h1>
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-white/60">
              {issue.description || "No report context has been added yet."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {labels.map(label => (
                <span
                  key={label.id}
                  style={{ backgroundColor: label.color }}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[#171827] shadow-sm"
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap content-start gap-2 xl:w-48 xl:flex-col">
            <Button
              onClick={() => watch.mutate({ issueId })}
              disabled={watch.isPending}
              className="h-10 rounded-xl border border-white/10 bg-white/[.08] text-white hover:bg-white/[.14]"
            >
              <Eye className="mr-2 h-4 w-4 text-[#ffbc4f]" />
              {watching ? "Watching" : "Watch issue"}
            </Button>
            <Button
              onClick={() => analyze.mutate({ issueId })}
              disabled={analyze.isPending}
              className="h-10 rounded-xl bg-[#a680ff] text-[#171827] shadow-[0_10px_25px_rgba(166,128,255,.22)] hover:bg-[#c0a7ff]"
            >
              {analyze.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 h-4 w-4" />
              )}
              AI review draft
            </Button>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-5">
          {/* Reproduction Kit */}
          <article className={`${panel} p-6`}>
            <p className="eyebrow text-white/40">Reproduction kit</p>
            <h2 className="display-heading mt-2 text-2xl text-white">
              Context before conversation.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Expected" value={issue.expectedResult} />
              <Field label="Actual" value={issue.actualResult} />
              <Field label="Environment" value={issue.environment} />
              <Field
                label="Due date"
                value={
                  issue.dueAt
                    ? new Date(issue.dueAt).toLocaleDateString()
                    : "Not scheduled"
                }
              />
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="eyebrow text-white/40">Reproducible steps</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/65">
                {issue.reproducibleSteps || "No steps have been documented yet."}
              </p>
            </div>
          </article>

          {/* SCM Commits & Traceability Panel */}
          {scmCommits.length > 0 && (
            <article className={`${panel} p-6 border-[#3ECF8E]/30 bg-[#3ECF8E]/5`}>
              <div className="flex items-center justify-between border-b border-white/[.08] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-[#3ECF8E]" />
                  <h3 className="font-bold text-lg text-white">
                    GitHub SCM Traceability ({scmCommits.length})
                  </h3>
                </div>
                <Badge className="bg-[#3ECF8E]/20 text-[#3ECF8E] border-0 text-[10px] font-bold">
                  Verified Commits
                </Badge>
              </div>
              <div className="space-y-2.5">
                {scmCommits.map(c => {
                  const meta = c.metadata as {
                    shortSha?: string;
                    url?: string;
                    author?: string;
                    message?: string;
                    isFix?: boolean;
                  };
                  return (
                    <div
                      key={c.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#3ECF8E]">
                            [{meta.shortSha ?? "commit"}]
                          </span>
                          <span className="font-medium text-white/85">
                            {meta.author ?? "Committer"}
                          </span>
                          {meta.isFix && (
                            <span className="rounded-full bg-[#FF7164]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#FF7164]">
                              FIX
                            </span>
                          )}
                        </div>
                        <p className="text-white/70 line-clamp-2">
                          {meta.message ?? c.message}
                        </p>
                      </div>
                      {meta.url && (
                        <a
                          href={meta.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/15"
                        >
                          View Commit
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          )}

          {/* Comments & Discussion */}
          <CommentThread
            comments={comments}
            members={members}
            body={commentBody}
            setBody={setCommentBody}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            pending={comment.isPending}
            onSubmit={submitComment}
          />
        </div>

        {/* Sidebar Controls */}
        <aside className="space-y-5">
          <WorkflowPanel
            status={currentStatus}
            setStatus={setStatus}
            resolution={resolution}
            setResolution={setResolution}
            originalStatus={issue.status}
            pending={transition.isPending}
            onSubmit={submitTransition}
          />
          <EvidencePanel
            attachments={attachments}
            onFile={onFile}
            uploading={upload.isPending}
          />
          <AiPanel
            recommendations={recommendations}
            applying={applyAi.isPending}
            dismissing={dismissAi.isPending}
            onApply={(id, applySummary, applySeverity, applySteps) =>
              applyAi.mutate({
                recommendationId: id,
                applySummary,
                applySeverity,
                applySteps,
              })
            }
            onDismiss={id => dismissAi.mutate({ recommendationId: id })}
          />
          <LinkPanel
            links={links}
            number={linkedIssueNumber}
            setNumber={setLinkedIssueNumber}
            type={linkType}
            setType={setLinkType}
            pending={link.isPending}
            onSubmit={submitLink}
          />
          <article className={`${panel} p-6`}>
            <p className="eyebrow text-white/40">Activity history</p>
            <div className="mt-5 space-y-4">
              {activity.slice(0, 8).map(event => (
                <div key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#56e6be] shadow-[0_0_10px_#56e6be]" />
                  <div>
                    <p className="text-xs font-medium text-white/80">
                      {event.message}
                    </p>
                    <p className="mt-1 text-[10px] text-white/35">
                      {relativeTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function LoadingDesk() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="h-6 w-32 animate-pulse rounded-full bg-[#E1E5DB]" />
      <div className="h-64 animate-pulse rounded-[28px] border border-[#E1E5DB] bg-white" />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="h-96 animate-pulse rounded-[24px] bg-[#F1F2EA]" />
        <div className="h-96 animate-pulse rounded-[24px] bg-[#F1F2EA]" />
      </div>
    </div>
  );
}

function UnavailableDesk({
  message,
  onBack,
}: {
  message?: string;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-[#E1E5DB] bg-white p-9 text-center shadow-[0_18px_48px_rgba(27,60,45,.08)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD8D2] text-[#B8423A]">
        <Link2 className="h-5 w-5" />
      </div>
      <p className="eyebrow mt-6 text-[#718079]">Issue desk unavailable</p>
      <h1 className="display-heading mt-3 text-3xl text-[#19352D]">
        This signal is out of reach.
      </h1>
      <p className="mt-4 text-sm leading-6 text-[#718079]">
        {message ??
          "The issue may have moved, been removed, or require a different project permission."}
      </p>
      <Button
        onClick={onBack}
        className="mt-7 rounded-xl bg-[#18342C] text-white hover:bg-[#264B40]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to explorer
      </Button>
    </div>
  );
}

function WorkflowPanel({
  status,
  setStatus,
  resolution,
  setResolution,
  originalStatus,
  pending,
  onSubmit,
}: {
  status: string;
  setStatus: (value: string) => void;
  resolution: string;
  setResolution: (value: string) => void;
  originalStatus: string;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-[#ffbc4f]/15 bg-[#ffbc4f]/10 p-6 shadow-[0_18px_52px_rgba(0,0,0,.2)]">
      <p className="eyebrow text-amber-200/70">Workflow move</p>
      <h2 className="display-heading mt-2 text-2xl text-white">
        Move with intent.
      </h2>
      <select
        value={status}
        onChange={event => setStatus(event.target.value)}
        className="mt-5 h-11 w-full border-white/10 bg-black/15 px-3 text-sm font-medium text-white"
      >
        {Object.entries(statusMeta).map(([value, item]) => (
          <option key={value} value={value}>
            {item.label}
          </option>
        ))}
      </select>
      {status === "done" && (
        <select
          value={resolution}
          onChange={event => setResolution(event.target.value)}
          className="mt-2 h-11 w-full border-white/10 bg-black/15 px-3 text-sm font-medium text-white"
        >
          <option value="fixed">Fixed</option>
          <option value="duplicate">Duplicate</option>
          <option value="wont_fix">Won't fix</option>
          <option value="invalid">Invalid</option>
          <option value="works_as_intended">Works as intended</option>
        </select>
      )}
      <Button
        onClick={onSubmit}
        disabled={pending || status === originalStatus}
        className="mt-4 h-10 w-full rounded-xl bg-[#ffbc4f] font-semibold text-[#171827] hover:bg-[#ffcd73]"
      >
        {pending ? "Updating…" : "Confirm workflow move"}
      </Button>
    </article>
  );
}

function CommentThread({
  comments,
  members,
  body,
  setBody,
  replyTo,
  setReplyTo,
  pending,
  onSubmit,
}: {
  comments: Array<{
    id: number;
    body: string;
    parentId: number | null;
    createdAt: Date;
    authorName: string | null;
  }>;
  members: Array<{ id: number; name: string | null }>;
  body: string;
  setBody: (value: string) => void;
  replyTo: number | null;
  setReplyTo: (value: number | null) => void;
  pending: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  const byParent = useMemo(
    () =>
      new Map<number | null, typeof comments>(
        [
          ...Array.from(new Set(comments.map(item => item.parentId))),
          null,
        ].map(parentId => [
          parentId,
          comments.filter(item => item.parentId === parentId),
        ])
      ),
    [comments]
  );

  const renderComments = (parentId: number | null, depth = 0): React.ReactNode =>
    (byParent.get(parentId) ?? []).map(item => (
      <div
        key={item.id}
        className={`border-t border-white/[.07] p-5 ${
          depth ? "ml-4 border-l-2 border-l-[#a680ff]/50 bg-black/[.08] md:ml-9" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7668]/15 text-[10px] font-bold text-[#ff9388]">
            {initials(item.authorName)}
          </span>
          <p className="text-xs font-semibold text-white/85">
            {item.authorName ?? "Workspace member"}
          </p>
          <span className="text-[10px] text-white/35">
            {relativeTime(item.createdAt)}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">
          {item.body}
        </p>
        <button
          type="button"
          onClick={() => setReplyTo(item.id)}
          className="mt-3 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200/80 hover:text-white"
        >
          <Reply className="h-3 w-3" />
          Reply
        </button>
        {renderComments(item.id, depth + 1)}
      </div>
    ));

  return (
    <article className={panel}>
      <div className="flex items-center justify-between border-b border-white/[.08] p-6">
        <div>
          <p className="eyebrow text-white/40">Collaboration</p>
          <h2 className="display-heading mt-2 text-2xl text-white">
            Threaded discussion
          </h2>
        </div>
        <MessageCircle className="h-5 w-5 text-[#a680ff]" />
      </div>
      <div>
        {comments.length ? (
          renderComments(null)
        ) : (
          <div className="p-7 text-sm leading-6 text-white/50">
            No discussion yet. Add a verification note, context, or a clear next
            decision.
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-white/[.08] p-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="comment" className="text-xs font-medium text-white/75">
            {replyTo ? "Reply to thread" : "Add a comment"}
          </Label>
          {replyTo && (
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-[10px] font-semibold text-[#ff9388] hover:text-white"
            >
              Cancel reply
            </button>
          )}
        </div>
        <Textarea
          id="comment"
          value={body}
          onChange={event => setBody(event.target.value)}
          placeholder="Share a verification note or use an explicit member mention."
          className="mt-3 min-h-28 border-white/10 bg-black/15 text-white placeholder:text-white/25"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-white/35">
            Mention
          </span>
          {members.map(member => (
            <button
              type="button"
              key={member.id}
              onClick={() =>
                setBody(`${body}${body ? " " : ""}@member-${member.id}`)
              }
              className="rounded-lg border border-white/10 bg-white/[.05] px-2 py-1 text-[10px] font-medium text-white/65 hover:bg-white/[.1]"
            >
              {member.name ?? `Member ${member.id}`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/35">
          Mentions resolve only to listed project members.
        </p>
        <div className="mt-4 flex justify-end">
          <Button
            disabled={pending || !body.trim()}
            className="rounded-xl bg-[#ff7668] text-[#171827] hover:bg-[#ff9388]"
          >
            {pending ? "Posting…" : `Post ${replyTo ? "reply" : "comment"}`}
          </Button>
        </div>
      </form>
    </article>
  );
}

function EvidencePanel({
  attachments,
  onFile,
  uploading,
}: {
  attachments: Array<{
    id: number;
    fileName: string;
    storageUrl: string;
    contentType: string;
    sizeBytes: number;
  }>;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  return (
    <article className={`${panel} p-6`}>
      <p className="eyebrow text-white/40">Secure evidence</p>
      <h2 className="display-heading mt-2 text-2xl text-white">Attach proof.</h2>
      <p className="mt-3 text-xs leading-5 text-white/50">
        PNG, JPG, WebP, TXT, JSON, and PDF. Each file is validated and
        project-scoped.
      </p>
      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#56e6be]/20 bg-[#56e6be]/10 px-3 py-2.5 text-xs font-semibold text-[#a1f2da] transition hover:bg-[#56e6be]/15">
        <Paperclip className="h-4 w-4" />
        {uploading ? "Uploading…" : "Add evidence"}
        <input
          type="file"
          disabled={uploading}
          accept=".png,.jpg,.jpeg,.webp,.txt,.json,.pdf"
          className="sr-only"
          onChange={onFile}
        />
      </label>
      <div className="mt-4 space-y-2">
        {attachments.length ? (
          attachments.map(file => (
            <a
              href={file.storageUrl}
              target="_blank"
              rel="noreferrer"
              key={file.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/15 p-3 text-xs font-medium text-white/70 hover:bg-white/[.07]"
            >
              <FileText className="h-4 w-4 text-[#56e6be]" />
              <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
              <span className="text-[9px] text-white/35">
                {Math.ceil(file.sizeBytes / 1024)} KB
              </span>
            </a>
          ))
        ) : (
          <p className="mt-4 text-xs text-white/35">No evidence files attached.</p>
        )}
      </div>
    </article>
  );
}

function AiPanel({
  recommendations,
  applying,
  dismissing,
  onApply,
  onDismiss,
}: {
  recommendations: Array<{
    id: number;
    summary: string;
    suggestedSeverity: string | null;
    suggestedLabels: unknown;
    duplicateCandidates: unknown;
    reproducibleSteps: string;
    caveats: string;
    confidence: number;
    state: "pending_review" | "applied" | "dismissed";
  }>;
  applying: boolean;
  dismissing: boolean;
  onApply: (
    id: number,
    applySummary: boolean,
    applySeverity: boolean,
    applySteps: boolean
  ) => void;
  onDismiss: (id: number) => void;
}) {
  const pending = recommendations.find(item => item.state === "pending_review");
  const [summary, setSummary] = useState(true);
  const [severity, setSeverity] = useState(false);
  const [steps, setSteps] = useState(true);

  if (!pending)
    return (
      <article className="rounded-[24px] border border-violet-200/15 bg-[#a680ff]/10 p-6 shadow-[0_18px_52px_rgba(0,0,0,.2)]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a680ff]/20 text-[#d0bcff]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="eyebrow text-violet-200/60">AI review draft</p>
            <h2 className="display-heading mt-1 text-xl text-white">
              Human review required
            </h2>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/55">
          Ask for a compact AI draft when you want a sharper summary or test
          plan. It never changes the issue by itself.
        </p>
      </article>
    );

  return (
    <article className="rounded-[24px] border border-violet-200/15 bg-[#a680ff]/10 p-6 shadow-[0_18px_52px_rgba(0,0,0,.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-violet-200/60">AI draft · review first</p>
          <h2 className="display-heading mt-2 text-xl text-white">
            Recommendation ready
          </h2>
        </div>
        <Bot className="h-5 w-5 text-[#d0bcff]" />
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-white/80">
        {pending.summary}
      </p>
      <div className="mt-5 space-y-2 border-y border-white/10 py-4 text-xs text-white/70">
        <ReviewOption
          id="summary"
          checked={summary}
          onChange={setSummary}
          label="Apply concise summary"
        />
        <ReviewOption
          id="severity"
          checked={severity}
          onChange={setSeverity}
          label={`Apply severity: ${pending.suggestedSeverity ?? "not suggested"}`}
        />
        <ReviewOption
          id="steps"
          checked={steps}
          onChange={setSteps}
          label="Apply reproducible steps"
        />
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-white/40">
        Draft steps
      </p>
      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/65">
        {pending.reproducibleSteps}
      </p>
      <p className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3 text-[11px] leading-4 text-white/55">
        <strong className="text-white/75">Caveat:</strong> {pending.caveats}
      </p>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-violet-200/60">
        Confidence {pending.confidence}% · draft only
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          onClick={() => onApply(pending.id, summary, severity, steps)}
          disabled={applying}
          className="rounded-xl bg-[#a680ff] text-xs font-semibold text-[#171827] hover:bg-[#c0a7ff]"
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Apply selected
        </Button>
        <Button
          onClick={() => onDismiss(pending.id)}
          disabled={dismissing}
          className="rounded-xl border border-white/10 bg-white/[.06] text-xs text-white hover:bg-white/[.12]"
        >
          Dismiss
        </Button>
      </div>
    </article>
  );
}

function LinkPanel({
  links,
  number,
  setNumber,
  type,
  setType,
  pending,
  onSubmit,
}: {
  links: Array<{
    id: number;
    type: string;
    issue: { number: number; title: string } | null;
  }>;
  number: string;
  setNumber: (value: string) => void;
  type: LinkType;
  setType: (value: LinkType) => void;
  pending: boolean;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <article className={`${panel} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-white/40">Issue links</p>
          <h2 className="display-heading mt-2 text-xl text-white">
            Related signal
          </h2>
        </div>
        <Link2 className="h-5 w-5 text-[#ffbc4f]" />
      </div>
      <div className="mt-4 space-y-2">
        {links.length ? (
          links.map(item => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-black/15 p-3 text-xs text-white/70"
            >
              <span className="font-mono text-[#ffbc4f]">
                #{item.issue?.number ?? "?"}
              </span>{" "}
              {item.issue?.title ?? "Linked issue"}
              <span className="mt-1 block text-[10px] uppercase text-white/35">
                {item.type.replaceAll("_", " ")}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs leading-5 text-white/35">
            No related, duplicate, or dependency links recorded.
          </p>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <Input
          value={number}
          onChange={event => setNumber(event.target.value)}
          type="number"
          min="1"
          placeholder="Issue #"
          className="h-10 border-white/10 bg-black/15 text-white"
        />
        <select
          value={type}
          onChange={event => setType(event.target.value as LinkType)}
          className="rounded-xl border border-white/10 bg-black/15 px-2 text-xs text-white"
        >
          <option value="relates_to">Relates</option>
          <option value="duplicates">Duplicate</option>
          <option value="blocked_by">Blocked by</option>
          <option value="blocks">Blocks</option>
        </select>
        <Button
          disabled={pending || !number}
          type="submit"
          className="col-span-2 rounded-xl border border-white/10 bg-white/[.07] text-white hover:bg-white/[.12]"
        >
          Link issue
        </Button>
      </form>
    </article>
  );
}

function ReviewOption({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onChange(Boolean(value))}
        className="border-white/30 bg-white/10"
      />
      <span>{label}</span>
    </label>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="eyebrow text-white/35">{label}</p>
      <p className="mt-2 text-sm font-medium text-white/75">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Could not read the selected evidence file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
