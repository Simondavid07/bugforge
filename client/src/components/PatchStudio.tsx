import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode2,
  GitCommit,
  LoaderCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  issueId: number;
  issueNumber: number;
}

export function PatchStudio({ issueId, issueNumber }: Props) {
  const [copied, setCopied] = useState(false);
  const patchMutation = trpc.ai.generatePatch.useMutation({
    onSuccess: () => toast.success("AI Code Patch synthesized!"),
    onError: err => toast.error(err.message),
  });

  const data = patchMutation.data;

  const handleCopy = () => {
    if (!data?.patchDiff) return;
    navigator.clipboard.writeText(data.patchDiff);
    setCopied(true);
    toast.success("Unified diff copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data?.patchDiff) return;
    const blob = new Blob([data.patchDiff], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bugforge-fix-issue-${issueNumber}.patch`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded bugforge-fix-issue-${issueNumber}.patch`);
  };

  return (
    <article className="rounded-[24px] border border-violet-200/20 bg-gradient-to-br from-[#a680ff]/10 via-black/20 to-black/30 p-6 shadow-[0_18px_52px_rgba(0,0,0,.2)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#a680ff]/25 text-[#d0bcff]">
              <Code2 className="h-4 w-4" />
            </span>
            <div>
              <p className="eyebrow text-violet-200/70">AI Patch Studio</p>
              <h2 className="display-heading text-xl text-white">
                Automated Code Remediation
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/55">
            Synthesizes a verified Unified Git Diff based on reproduction steps and stack trace.
          </p>
        </div>

        <Button
          onClick={() => patchMutation.mutate({ issueId })}
          disabled={patchMutation.isPending}
          className="rounded-xl bg-[#a680ff] text-xs font-semibold text-[#171827] hover:bg-[#c0a7ff] shadow-[0_4px_16px_rgba(166,128,255,.3)]"
        >
          {patchMutation.isPending ? (
            <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          {data ? "Re-Synthesize Patch" : "Synthesize Code Patch"}
        </Button>
      </div>

      {data ? (
        <div className="mt-5 space-y-4 animate-in fade-in duration-300">
          {/* Target File & Explanation */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[#a680ff]" />
                <span className="font-mono text-xs font-bold text-white/90">
                  {data.targetFile}
                </span>
              </div>
              <Badge className="bg-[#a680ff]/20 text-[#d0bcff] border-0 text-[10px]">
                Unified Diff (.patch)
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              {data.explanation}
            </p>
          </div>

          {/* Syntax Highlighted Unified Diff */}
          <div className="rounded-xl border border-white/15 bg-[#0e1117] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 text-[11px]">
              <span className="font-mono text-white/40">git diff format</span>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-white/80 hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="mr-1 h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="mr-1 h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy Diff"}
                </Button>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-white/80 hover:bg-white/10"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download .patch
                </Button>
              </div>
            </div>
            <div className="p-3 font-mono text-[11px] leading-5 overflow-x-auto">
              {data.patchDiff.split("\n").map((line, idx) => {
                const isAdd = line.startsWith("+") && !line.startsWith("+++");
                const isDel = line.startsWith("-") && !line.startsWith("---");
                const isHunk = line.startsWith("@@");
                return (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 rounded ${
                      isAdd
                        ? "bg-emerald-500/15 text-emerald-300 font-medium"
                        : isDel
                        ? "bg-rose-500/15 text-rose-300 line-through"
                        : isHunk
                        ? "text-cyan-400 bg-cyan-950/20"
                        : "text-white/60"
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regression Test Snippet */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">
              Generated Vitest Regression Test
            </p>
            <pre className="font-mono text-[10px] text-emerald-400/90 whitespace-pre-wrap overflow-x-auto">
              {data.testSnippet}
            </pre>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-[#a680ff]/60 mb-2" />
          <p className="text-xs text-white/60">
            Click <strong>"Synthesize Code Patch"</strong> to generate an immediate Git Unified Diff and regression test case for this defect.
          </p>
        </div>
      )}
    </article>
  );
}
