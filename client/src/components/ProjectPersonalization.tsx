import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { trpc } from "@/lib/trpc";
import { Check, Palette, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const accents = ["#A55343", "#75937E", "#C9A46A", "#88689A", "#537F9B", "#B66F73"];
type MotionLevel = "still" | "soft" | "expressive";

export default function ProjectPersonalization() {
  const { projectId, activeProject } = useActiveProject();
  const utils = trpc.useUtils();
  const updateAccent = trpc.project.updateAccent.useMutation({ onSuccess: async () => { await Promise.all([utils.workspace.mine.invalidate(), utils.project.overview.invalidate()]); } });
  const [motion, setMotion] = useState<MotionLevel>(() => (localStorage.getItem("bugforge-motion") as MotionLevel) || "soft");
  useEffect(() => { document.documentElement.dataset.motion = motion; localStorage.setItem("bugforge-motion", motion); }, [motion]);
  useEffect(() => { if (activeProject?.accentColor) document.documentElement.style.setProperty("--project-accent", activeProject.accentColor); }, [activeProject?.accentColor]);
  const accent = activeProject?.accentColor ?? "#A55343";
  return <details className="project-personalization fixed bottom-5 right-5 z-30 group"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-[#D8CDC0] bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#1E1A18] shadow-[0_10px_30px_rgba(73,52,38,.12)] dark:border-[#4A433D] dark:bg-[#211F1D] dark:text-[#F4EEE6]"><SlidersHorizontal className="h-4 w-4" />Tune feel</summary><div className="mt-3 w-72 rounded-2xl border border-[#D8CDC0] bg-[#FFFCF7] p-4 shadow-[0_18px_45px_rgba(73,52,38,.18)] dark:border-[#4A433D] dark:bg-[#211F1D]"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Project accent</p><p className="mt-1 text-xs text-[#665D56] dark:text-[#C9BEB4]">Make this project distinct.</p></div><Palette className="h-4 w-4 text-[#A55343]" /></div><div className="mt-3 flex flex-wrap gap-2">{accents.map(color => <button key={color} disabled={!projectId || updateAccent.isPending} aria-label={`Use ${color} as project accent`} onClick={() => projectId && updateAccent.mutate({ projectId, accentColor: color })} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent ring-offset-2 transition hover:scale-110 disabled:opacity-50" style={{ backgroundColor: color, ...(accent === color ? { borderColor: "#1E1A18" } : {}) }}>{accent === color && <Check className="h-4 w-4 text-white" />}</button>)}</div>{updateAccent.error && <p className="mt-2 text-xs text-[#A55343]">Admin access is required to change a project accent.</p>}<div className="mt-5 border-t border-[#D8CDC0] pt-4 dark:border-[#4A433D]"><p className="eyebrow">Motion intensity</p><div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-[#EFE5D7] p-1 dark:bg-[#2A2623]">{(["still", "soft", "expressive"] as MotionLevel[]).map(level => <Button key={level} type="button" variant="ghost" onClick={() => setMotion(level)} className={`h-8 rounded-lg text-[11px] capitalize ${motion === level ? "bg-white text-[#1E1A18] shadow-sm dark:bg-[#3A3530] dark:text-[#F4EEE6]" : "text-[#665D56] dark:text-[#C9BEB4]"}`}>{level}</Button>)}</div></div></div></details>;
}
