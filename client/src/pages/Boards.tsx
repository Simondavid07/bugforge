import { useAuth } from "@/_core/hooks/useAuth";
import { useCorrespondenceSurface } from "@/hooks/useCorrespondenceSurface";
import { useActiveProject } from "@/hooks/useActiveProject";
import { statusMeta } from "@/lib/bugforge";
import { trpc } from "@/lib/trpc";
import { BlockerGraph } from "@/components/BlockerGraph";
import { AlertTriangle, CircleDotDashed, Clock3, UserRound } from "lucide-react";
import { useLocation } from "wouter";

const lanes = ["intake", "triage", "in_progress", "verify", "done"] as const;

export default function Boards() {
  useCorrespondenceSurface("workboard");
  const { projectId } = useActiveProject();
  if (!projectId) return <CleanBoardEmpty />;
  return <CleanWorkboard />;
}

function CleanWorkboard() {
  const { projectId, activeProject } = useActiveProject();
  const issues = trpc.issues.board.useQuery(
    { projectId: projectId ?? 0 },
    { enabled: Boolean(projectId) }
  );
  const [, setLocation] = useLocation();
  if (!projectId) return <CleanBoardEmpty />;
  const items = issues.data ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section
        className="rounded-[28px] border border-[#E1E5DB] bg-white p-7 shadow-[0_16px_42px_rgba(27,60,45,.07)]"
        style={{
          borderTopColor: "var(--project-accent, #A55343)",
          borderTopWidth: 4,
        }}
      >
        <p className="eyebrow text-[#718079]">
          {activeProject?.key ?? "Project"} · team flow
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display-heading text-4xl">
              Work that feels in motion.
            </h1>
            <p className="mt-2 text-sm text-[#718079]">
              A friendly view of each stage, with just enough detail to decide
              what happens next.
            </p>
          </div>
          <span className="rounded-full bg-[#A8E6CF] px-3 py-1.5 font-mono text-xs text-[#19352D]">
            {items.length} signals
          </span>
        </div>
      </section>

      {/* Interactive Dependency & Critical Path Graph Cockpit */}
      <BlockerGraph projectId={projectId} />

      {/* 5-Lane Workflow Board */}
      <section className="grid gap-4 xl:grid-cols-5">
        {lanes.map((lane, index) => {
          const laneItems = items.filter(issue => issue.status === lane);
          const tones = [
            "#FFF0A8",
            "#DCCEFF",
            "#FFD8D2",
            "#A8E6CF",
            "#F1F2EA",
          ];
          return (
            <div
              key={lane}
              className="workflow-lane min-h-[380px] rounded-[22px] border border-[#E1E5DB] bg-white p-3 shadow-[0_12px_28px_rgba(27,60,45,.05)]"
            >
              <div
                className="workflow-lane-heading rounded-2xl border-l-4 p-3"
                style={{
                  backgroundColor: tones[index],
                  borderLeftColor: "var(--project-accent, #A55343)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="workflow-lane-title display-heading text-xl">
                    {statusMeta[lane].label}
                  </p>
                  <span className="workflow-lane-count flex h-7 min-w-7 items-center justify-center rounded-full text-[10px] font-bold">
                    {laneItems.length}
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {laneItems.map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => setLocation(`/issues/${issue.id}`)}
                    className="play-card w-full rounded-xl border border-[#E1E5DB] bg-[#FFFEFA] p-3 text-left hover:bg-white transition-transform hover:-translate-y-0.5"
                  >
                    <p className="font-mono text-[10px] text-[#718079]">
                      #{issue.number}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5">
                      {issue.title}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-[#718079]">
                      <span>{issue.severity}</span>
                      {issue.isReleaseBlocker && (
                        <span className="rounded-full bg-[#FF7164] px-1.5 py-0.5 text-[#19352D] font-bold">
                          BLOCKER
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!laneItems.length && (
                  <div className="rounded-xl border border-dashed border-[#D6DDD4] p-4 text-center text-xs text-[#8A978F]">
                    A pleasantly quiet lane.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function SignalCard({ icon: Icon, title, value, items, onOpen, tone }: { icon: typeof UserRound; title: string; value: number; items: Array<{ id: number; number: number; title: string }>; onOpen: (path: string) => void; tone: string }) { return <article className={`border-[3px] border-black p-4 shadow-[4px_4px_0_#000] ${tone}`}><div className="flex items-start justify-between"><div><p className="eyebrow">Focus board</p><h2 className="display-heading mt-1 text-xl">{title}</h2></div><Icon className="h-5 w-5" /></div><p className="display-heading mt-5 text-4xl">{value}</p><div className="mt-4 space-y-1">{items.length ? items.map(issue => <button key={issue.id} onClick={() => onOpen(`/issues/${issue.id}`)} className="block w-full truncate border-t-2 border-black/25 pt-1 text-left text-xs font-bold hover:underline">#{issue.number} {issue.title}</button>) : <p className="border-t-2 border-black/25 pt-2 text-xs font-medium">Nothing demanding attention.</p>}</div></article>; }
function PremiumBoardEmpty() { const lanes = ["Intake", "Triage", "Build", "Verify", "Ship"]; return <div className="mx-auto max-w-6xl"><section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#56e6be]/18 via-[#1b2038] to-[#1b2038] p-8 shadow-[0_24px_70px_rgba(0,0,0,.25)] md:p-10"><p className="eyebrow text-emerald-200/70">Team flow</p><h1 className="display-heading mt-4 max-w-2xl text-4xl leading-[.94] text-white md:text-5xl">Make progress feel visible, not buried.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/60">Your board will organize ownership, triage debt, verification, and release risk in one focused flow.</p><div className="mt-10 grid gap-3 md:grid-cols-5">{lanes.map((lane, index) => <div key={lane} className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-[#ffbc4f]" : index === 1 ? "bg-[#a680ff]" : index === 2 ? "bg-[#ff7668]" : index === 3 ? "bg-[#56e6be]" : "bg-white/50"}`} /><p className="text-sm font-semibold text-white">{lane}</p></div><div className="mt-7 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-white/25" style={{ width: `${18 + index * 14}%` }} /></div></div>)}</div></section></div>; }
function CleanBoardEmpty() { const lanes = [["Intake", "#FFF0A8"], ["Triage", "#DCCEFF"], ["Build", "#FFD8D2"], ["Verify", "#A8E6CF"], ["Ship", "#F1F2EA"]]; return <div className="mx-auto max-w-6xl"><section className="rounded-[30px] border border-[#E1E5DB] bg-white p-9 shadow-[0_18px_48px_rgba(27,60,45,.07)] md:p-10"><p className="eyebrow text-[#718079]">Team flow</p><h1 className="display-heading mt-4 max-w-2xl text-5xl leading-[.92]">Make progress easy to <span className="italic text-[#4EAB83]">feel.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#718079]">Your workboard will show exactly where attention, ownership, verification, and shipping energy are going.</p><div className="mt-10 grid gap-3 md:grid-cols-5">{lanes.map(([lane, color], index) => <div key={lane} className="play-card rounded-[22px] border border-[#E1E5DB] p-4" style={{ backgroundColor: color }}><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#19352D]" /><p className="text-sm font-semibold">{lane}</p></div><div className="mt-8 h-2 rounded-full bg-white/70"><div className="h-full rounded-full bg-[#19352D]/35" style={{ width: `${20 + index * 14}%` }} /></div></div>)}</div></section></div>; }
function BoardEmpty() { return <PremiumBoardEmpty />; }
