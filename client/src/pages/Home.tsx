import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveProject } from "@/hooks/useActiveProject";
import { humanize, relativeTime, severityMeta, statusMeta } from "@/lib/bugforge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleGauge, Clock3, FolderPlus, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { data: workspaceData, isLoading: workspaceLoading, projectId, activeProject, chooseProject, refetch: refetchWorkspaces } = useActiveProject();
  const overview = trpc.project.overview.useQuery({ projectId: projectId ?? 0 }, { enabled: Boolean(projectId) });
  const [location, setLocation] = useLocation();

  if (workspaceLoading) return <OverviewLoading />;
  if (!workspaceData?.projects.length) return <PremiumWorkspaceSetup onCreated={async id => { await refetchWorkspaces(); chooseProject(id); }} />;
  if (!activeProject || overview.isLoading) return <OverviewLoading />;
  if (overview.error || !overview.data) return <ErrorPanel message={overview.error?.message ?? "We could not load your project pulse."} />;

  const { project, stats, assigned, milestones } = overview.data;
  const readiness = Math.max(0, Math.min(100, 100 - stats.blockers * 18 - stats.untriaged * 4 - stats.overdue * 6));
  const activeMilestone = milestones.find(milestone => milestone.status === "active") ?? milestones[0];
  const metrics = [
    { label: "Open signal", value: stats.open, hint: `${stats.total} total records`, tone: "peach" },
    { label: "Needs triage", value: stats.untriaged, hint: "Keep intake moving", tone: "yellow" },
    { label: "Release blockers", value: stats.blockers, hint: stats.blockers ? "Escalate before ship" : "All clear today", tone: "lilac" },
    { label: "14d throughput", value: stats.throughput, hint: "Closed in the last sprint", tone: "mint" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="relative overflow-hidden border-[3px] border-black bg-white p-5 shadow-[7px_7px_0_#000] md:p-7">
        <span className="memphis-shape absolute right-16 top-7 h-8 w-8 rotate-45 border-2 border-black bg-[#ffe66d]" />
        <span className="memphis-shape absolute bottom-[-18px] right-[34%] h-16 w-16 rounded-full border-2 border-black bg-[#9de7d3]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">{project.key} · Issue intelligence hub</p>
            <h1 className="display-heading mt-2 text-4xl leading-[.9] sm:text-5xl">Good morning, {user?.name?.split(" ")[0] ?? "builder"}.<br /><span className="text-[#ef563e]">Here is the real signal.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-black/65">Navigate the work that matters, remove release friction, and keep every AI draft in human hands.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Choose active project" value={projectId ?? ""} onChange={event => chooseProject(Number(event.target.value))} className="h-10 max-w-[190px] border-2 border-black bg-[#fffdf8] px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black">
              {workspaceData.projects.map(item => <option key={item.id} value={item.id}>{item.key} — {item.name}</option>)}
            </select>
            <Button onClick={() => setLocation("/issues")} className="rounded-none border-2 border-black bg-[#ef563e] text-black shadow-[4px_4px_0_#000] hover:bg-[#ef563e]/85">Open explorer <ArrowUpRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => <article key={metric.label} className={`metric-card metric-${metric.tone}`}><p className="eyebrow text-black/60">{metric.label}</p><p className="display-heading mt-3 text-5xl">{metric.value}</p><p className="mt-4 text-xs font-semibold text-black/65">{metric.hint}</p><span className="absolute bottom-4 right-4 h-3 w-3 rotate-45 border-2 border-black bg-white" /></article>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="border-[3px] border-black bg-white shadow-[6px_6px_0_#000]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-black p-5"><div><p className="eyebrow">Your next moves</p><h2 className="display-heading mt-1 text-2xl">Focused work queue</h2></div><Button variant="outline" onClick={() => setLocation("/boards")} className="rounded-none border-2 border-black bg-[#ffe66d] font-bold hover:bg-[#ffe66d]/80">View board</Button></div>
          <div className="divide-y-2 divide-black/10">
            {assigned.length ? assigned.map(issue => <button key={issue.id} onClick={() => setLocation(`/issues/${issue.id}`)} className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-left transition-colors hover:bg-[#fff4ef]"><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-[#d9c8ff] text-xs font-extrabold">#{issue.number}</span><span className="min-w-0"><span className="block truncate text-sm font-bold group-hover:underline">{issue.title}</span><span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-black/55"><Badge className={`rounded-none border border-black/70 px-1.5 py-0 text-[10px] ${statusMeta[issue.status].className}`}>{statusMeta[issue.status].label}</Badge>{issue.dueAt ? `Due ${new Date(issue.dueAt).toLocaleDateString()}` : "No due date"}</span></span><ArrowUpRight className="h-4 w-4" /></button>) : <EmptyLine icon={CircleGauge} title="Your queue is clear" text="Assign an issue or create a report to begin." action="Browse issues" onAction={() => setLocation("/issues")} />}
          </div>
        </div>
        <div className="relative overflow-hidden border-[3px] border-black bg-[#9de7d3] p-6 shadow-[6px_6px_0_#000]">
          <span className="absolute right-[-18px] top-[-22px] h-20 w-20 rounded-full border-[3px] border-black bg-[#ffe66d]" /><span className="absolute bottom-4 right-7 text-6xl font-black leading-none">!</span>
          <div className="relative z-10"><p className="eyebrow">Release radar</p><h2 className="display-heading mt-2 max-w-[280px] text-3xl leading-[.92]">{activeMilestone ? activeMilestone.name : "No active release"}</h2><div className="mt-7 flex items-end gap-5"><div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-black bg-white"><div className="absolute inset-2 rounded-full border-[8px] border-[#ef563e]" /><div className="relative text-center"><p className="display-heading text-2xl">{readiness}%</p><p className="text-[9px] font-bold uppercase">ready</p></div></div><div className="pb-2 text-sm font-semibold leading-5"><p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{stats.blockers} blocker{stats.blockers === 1 ? "" : "s"}</p><p className="mt-2 flex items-center gap-2"><Clock3 className="h-4 w-4" />{stats.overdue} overdue</p></div></div><p className="mt-6 border-t-2 border-black/25 pt-4 text-xs font-semibold leading-5">Readiness is a visible signal, not a promise. Resolve blockers and triage incoming reports before shipping.</p></div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0_#000]"><div className="flex items-center justify-between"><div><p className="eyebrow">Severity pulse</p><h2 className="display-heading mt-1 text-2xl">What is hurting?</h2></div><Radar className="h-6 w-6" /></div><div className="mt-6 space-y-3">{stats.bySeverity.map(item => <div key={item.name} className="grid grid-cols-[72px_1fr_28px] items-center gap-3 text-xs font-bold"><span>{humanize(item.name)}</span><div className="h-3 overflow-hidden border-2 border-black bg-[#fff4ef]"><div className={`h-full ${severityMeta[item.name as keyof typeof severityMeta].className}`} style={{ width: `${Math.max(3, stats.total ? (item.value / stats.total) * 100 : 0)}%` }} /></div><span className="text-right">{item.value}</span></div>)}</div></div>
        <div className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0_#000]"><div className="flex items-center justify-between"><div><p className="eyebrow">Aging signal</p><h2 className="display-heading mt-1 text-2xl">Do not let it fossilize.</h2></div><ShieldCheck className="h-6 w-6" /></div><div className="mt-7 grid grid-cols-3 gap-3">{stats.aging.map(bucket => <div key={bucket.days} className="border-2 border-black bg-[#d9c8ff] p-3 text-center"><p className="display-heading text-3xl">{bucket.value}</p><p className="mt-1 text-[10px] font-bold uppercase">Over {bucket.days}d</p></div>)}</div><p className="mt-5 text-xs font-medium text-black/60">Use saved views to make issue age part of triage, not an end-of-release surprise.</p></div>
      </section>
    </div>
  );
}

function PremiumWorkspaceSetup({ onCreated }: { onCreated: (projectId: number) => Promise<void> }) {
  const create = trpc.workspace.create.useMutation();
  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); const result = await create.mutateAsync({ workspaceName, projectName, projectKey }); await onCreated(result.projectId); };
  return <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_.95fr]"><section className="relative min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_88%_15%,rgba(255,118,104,.32),transparent_25%),linear-gradient(145deg,#282b46,#171a30_58%,#101224)] p-8 shadow-[0_30px_80px_rgba(0,0,0,.32)] md:p-10"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" /><div className="relative z-10 flex h-full flex-col"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff7668] text-[#151625] shadow-[0_12px_30px_rgba(255,118,104,.28)]"><FolderPlus className="h-6 w-6" /></div><div className="mt-auto"><p className="eyebrow text-white/45">Initialize your forge</p><h1 className="display-heading mt-4 max-w-lg text-5xl leading-[.92] text-white md:text-6xl">Turn every bug into a <span className="text-[#ff9388]">clear next move.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-white/60">Create a secure workspace for structured reports, intentional triage, collaborative evidence, and release confidence.</p><div className="mt-8 flex items-center gap-5 text-xs text-white/45"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#56e6be] shadow-[0_0_12px_#56e6be]" />Private by design</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#b08cff] shadow-[0_0_12px_#b08cff]" />AI review first</span></div></div></div></section><form onSubmit={submit} className="rounded-[28px] border border-white/10 bg-white/[.055] p-7 shadow-[0_30px_80px_rgba(0,0,0,.25)] backdrop-blur-xl md:p-9"><p className="eyebrow text-white/40">Workspace setup</p><h2 className="display-heading mt-3 text-3xl text-white">Start with a mission.</h2><p className="mt-3 text-sm leading-6 text-white/50">You can create projects, invite your team, and tune the workflow next.</p><div className="mt-8 space-y-5"><div className="space-y-2"><Label htmlFor="workspaceName" className="text-sm font-medium text-white/80">Workspace name</Label><Input id="workspaceName" value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} placeholder="Orbit Labs" className="h-11 rounded-xl border-white/10 bg-black/20 text-white placeholder:text-white/25" required /></div><div className="space-y-2"><Label htmlFor="projectName" className="text-sm font-medium text-white/80">First project</Label><Input id="projectName" value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Web Console" className="h-11 rounded-xl border-white/10 bg-black/20 text-white placeholder:text-white/25" required /></div><div className="space-y-2"><Label htmlFor="projectKey" className="text-sm font-medium text-white/80">Project key</Label><Input id="projectKey" value={projectKey} onChange={event => setProjectKey(event.target.value.toUpperCase())} placeholder="WEB" className="h-11 rounded-xl border-white/10 bg-black/20 uppercase text-white placeholder:text-white/25" maxLength={11} required /></div></div>{create.error && <p className="mt-5 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-xs font-medium text-red-200">{create.error.message}</p>}<Button disabled={create.isPending} className="mt-8 h-12 w-full rounded-xl bg-[#ff7668] text-sm font-bold text-[#171827] shadow-[0_12px_30px_rgba(255,118,104,.24)] hover:bg-[#ff9388]">{create.isPending ? "Creating your workspace..." : "Create secure workspace"}<ArrowUpRight className="ml-1 h-4 w-4" /></Button><p className="mt-4 text-center text-[11px] text-white/35">Your first project starts in a private workspace boundary.</p></form></div>;
}

function WorkspaceSetup({ onCreated }: { onCreated: (projectId: number) => Promise<void> }) {
  const create = trpc.workspace.create.useMutation();
  const [workspaceName, setWorkspaceName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); const result = await create.mutateAsync({ workspaceName, projectName, projectKey }); await onCreated(result.projectId); };
  return <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.9fr_1.1fr]"><section className="relative overflow-hidden border-[3px] border-black bg-[#ffe66d] p-7 shadow-[7px_7px_0_#000]"><span className="absolute right-7 top-8 h-12 w-12 rotate-45 border-[3px] border-black bg-[#d9c8ff]" /><FolderPlus className="h-9 w-9" /><p className="eyebrow mt-8">First move</p><h1 className="display-heading mt-2 text-4xl leading-[.9]">Create a home for your bug signal.</h1><p className="mt-5 max-w-sm text-sm font-medium leading-6">Workspaces provide a secure boundary. Projects keep the issue workflow relevant to the people actually shipping it.</p></section><form onSubmit={submit} className="border-[3px] border-black bg-white p-7 shadow-[7px_7px_0_#000]"><p className="eyebrow">Start your workspace</p><h2 className="display-heading mt-2 text-3xl">Name the mission.</h2><div className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="workspaceName" className="font-bold">Workspace name</Label><Input id="workspaceName" value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} placeholder="Orbit Labs" className="rounded-none border-2 border-black" required /></div><div className="space-y-2"><Label htmlFor="projectName" className="font-bold">First project</Label><Input id="projectName" value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Web Console" className="rounded-none border-2 border-black" required /></div><div className="space-y-2"><Label htmlFor="projectKey" className="font-bold">Project key</Label><Input id="projectKey" value={projectKey} onChange={event => setProjectKey(event.target.value.toUpperCase())} placeholder="WEB" className="rounded-none border-2 border-black uppercase" maxLength={11} required /></div></div>{create.error && <p className="mt-4 border-2 border-black bg-[#ffe9df] p-2 text-xs font-bold">{create.error.message}</p>}<Button disabled={create.isPending} className="mt-7 w-full rounded-none border-2 border-black bg-black text-white shadow-[4px_4px_0_#9de7d3] hover:bg-black/85">{create.isPending ? "Creating..." : "Create secure workspace"}<ArrowUpRight className="ml-1 h-4 w-4" /></Button></form></div>;
}

function EmptyLine({ icon: Icon, title, text, action, onAction }: { icon: typeof CircleGauge; title: string; text: string; action: string; onAction: () => void }) { return <div className="flex items-center gap-3 p-5"><Icon className="h-6 w-6" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{title}</p><p className="text-xs text-black/60">{text}</p></div><Button variant="outline" onClick={onAction} className="rounded-none border-2 border-black text-xs">{action}</Button></div>; }
function OverviewLoading() { return <div className="space-y-6"><Skeleton className="h-48 rounded-none border-2 border-black bg-white/60" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-none border-2 border-black bg-white/60" />)}</div><Skeleton className="h-72 rounded-none border-2 border-black bg-white/60" /></div>; }
function ErrorPanel({ message }: { message: string }) { return <div className="border-[3px] border-black bg-[#ffe66d] p-7 shadow-[6px_6px_0_#000]"><p className="eyebrow">Signal interrupted</p><h1 className="display-heading mt-2 text-3xl">We could not load the pulse.</h1><p className="mt-3 text-sm font-medium">{message}</p></div>; }
