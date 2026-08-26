import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { trpc } from "@/lib/trpc";
import { Check, ChevronDown, ChevronUp, GripVertical, ImageUp, Palette, SlidersHorizontal, UserRound } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";

const accents = ["#A55343", "#75937E", "#C9A46A", "#88689A", "#537F9B", "#B66F73"];
const defaultSidebar = ["/", "/issues", "/boards", "/analytics", "/notifications"];
const sidebarLabels: Record<string, string> = { "/": "Overview", "/issues": "Issues", "/boards": "Workboard", "/analytics": "Insights", "/notifications": "Inbox" };
type MotionLevel = "still" | "soft" | "expressive";

export function applyProjectAccent(accentColor: string | null | undefined, root: Pick<HTMLElement, "style">) {
  if (!accentColor) return false;
  root.style.setProperty("--project-accent", accentColor);
  return true;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function ProjectPersonalization() {
  const { data: workspace, projectId, activeProject } = useActiveProject();
  const preferences = trpc.personalization.get.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const updatePreferences = trpc.personalization.updatePreferences.useMutation({ onSuccess: () => utils.personalization.get.invalidate() });
  const updateAccent = trpc.project.updateAccent.useMutation({ onSuccess: async () => { await Promise.all([utils.workspace.mine.invalidate(), utils.project.overview.invalidate()]); } });
  const upload = trpc.personalization.uploadImage.useMutation({ onSuccess: async () => { await Promise.all([utils.workspace.mine.invalidate(), utils.personalization.get.invalidate()]); } });
  const [motion, setMotion] = useState<MotionLevel>(() => (localStorage.getItem("bugforge-motion") as MotionLevel) || "soft");
  const [dragged, setDragged] = useState<string | null>(null);
  const sidebarOrder = preferences.data?.sidebarOrder ?? defaultSidebar;
  const projectOrder = preferences.data?.projectOrder ?? [];
  const orderedProjects = useMemo(() => [...(workspace?.projects ?? [])].sort((a, b) => {
    const ai = projectOrder.indexOf(a.id);
    const bi = projectOrder.indexOf(b.id);
    return (ai < 0 ? 99_999 : ai) - (bi < 0 ? 99_999 : bi);
  }), [workspace?.projects, projectOrder]);
  const accent = activeProject?.accentColor ?? "#A55343";

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
    localStorage.setItem("bugforge-motion", motion);
  }, [motion]);
  useEffect(() => { applyProjectAccent(activeProject?.accentColor, document.documentElement); }, [activeProject?.accentColor]);
  useEffect(() => {
    const menu = document.querySelector<HTMLElement>("[data-slot='sidebar-menu']");
    if (!menu) return;
    const items = Array.from(menu.querySelectorAll<HTMLElement>("[data-slot='sidebar-menu-item']"));
    const byPath = new Map(items.map(item => {
      const text = item.textContent?.trim() ?? "";
      const path = Object.entries(sidebarLabels).find(([, label]) => text.includes(label))?.[0];
      return [path, item] as const;
    }));
    sidebarOrder.forEach(path => {
      const item = byPath.get(path);
      if (item) menu.appendChild(item);
    });
  }, [sidebarOrder]);

  const persist = (nextSidebar: string[] = sidebarOrder, nextProjects: number[] = projectOrder) => updatePreferences.mutate({
    sidebarOrder: nextSidebar as ["/", "/issues", "/boards", "/analytics", "/notifications"],
    projectOrder: nextProjects,
    savedSearches: (preferences.data?.savedSearches ?? []).map(search => ({
      ...search,
      status: search.status as "intake" | "triage" | "in_progress" | "verify" | "done" | undefined,
      severity: search.severity as "blocker" | "critical" | "major" | "minor" | "trivial" | undefined,
    })),
  });
  const reorder = (items: string[], source: string, target: string) => {
    const from = items.indexOf(source);
    const to = items.indexOf(target);
    if (from < 0 || to < 0 || from === to) return items;
    const next = [...items];
    next.splice(from, 1);
    next.splice(to, 0, source);
    return next;
  };
  const announce = (message: string) => {
    const announcer = document.getElementById("personalization-announcer");
    if (announcer) announcer.textContent = message;
  };
  const moveSidebar = (path: string, direction: -1 | 1) => {
    const current = sidebarOrder.indexOf(path);
    const next = current + direction;
    const label = sidebarLabels[path];
    if (next < 0 || next >= sidebarOrder.length) return announce(`${label} is already at the ${direction < 0 ? "top" : "bottom"}.`);
    const order = [...sidebarOrder];
    [order[current], order[next]] = [order[next], order[current]];
    persist(order);
    announce(`Moved ${label} to position ${next + 1} of ${order.length}.`);
  };
  const moveProject = (id: number, direction: -1 | 1) => {
    const current = orderedProjects.findIndex(project => project.id === id);
    const next = current + direction;
    const project = orderedProjects[current];
    if (!project) return;
    if (next < 0 || next >= orderedProjects.length) return announce(`${project.name} is already at the ${direction < 0 ? "top" : "bottom"}.`);
    const order = orderedProjects.map(item => item.id);
    [order[current], order[next]] = [order[next], order[current]];
    persist(sidebarOrder, order);
    announce(`Moved ${project.name} to position ${next + 1} of ${order.length}.`);
  };
  const dropSidebar = (event: DragEvent<HTMLButtonElement>, target: string) => {
    event.preventDefault();
    if (!dragged) return;
    persist(reorder(sidebarOrder, dragged, target));
    setDragged(null);
  };
  const dropProject = (event: DragEvent<HTMLButtonElement>, target: number) => {
    event.preventDefault();
    if (!dragged) return;
    const current = orderedProjects.map(project => project.id);
    persist(sidebarOrder, reorder(current.map(String), dragged, String(target)).map(Number));
    setDragged(null);
  };
  const onUpload = async (event: ChangeEvent<HTMLInputElement>, target: "avatar" | "project_logo") => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) return;
    const dataUrl = await fileToDataUrl(file);
    upload.mutate({ target, ...(target === "project_logo" && projectId ? { projectId } : {}), fileName: file.name, contentType: file.type as "image/png" | "image/jpeg" | "image/webp", dataUrl });
    event.target.value = "";
  };
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".project-personalization");
    if (!root) return;
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[draggable]");
      if (!button) return;
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? -1 : 1;
      const path = button.dataset.sidebarPath;
      const id = button.dataset.projectId;
      if (path) return moveSidebar(path, direction);
      if (id) moveProject(Number(id), direction);
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [sidebarOrder, orderedProjects, persist]);

  return (
    <details className="project-personalization fixed bottom-5 right-5 z-30 group">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-[#D8CDC0] bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#1E1A18] shadow-[0_10px_30px_rgba(73,52,38,.12)] dark:border-[#4A433D] dark:bg-[#211F1D] dark:text-[#F4EEE6]">
        <SlidersHorizontal className="h-4 w-4" />Personalize
      </summary>
      <div className="mt-3 max-h-[75vh] w-80 overflow-y-auto rounded-2xl border border-[#D8CDC0] bg-[#FFFCF7] p-4 shadow-[0_18px_45px_rgba(73,52,38,.18)] dark:border-[#4A433D] dark:bg-[#211F1D]">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow">Make this yours</p><p className="mt-1 text-xs text-[#665D56] dark:text-[#C9BEB4]">Personalize appearance, order, and pace.</p></div>
          <Palette className="h-4 w-4 text-[#A55343]" />
        </div>
        <div className="mt-5 space-y-2">
          <p className="eyebrow">Images</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#D8CDC0] p-3 text-xs dark:border-[#4A433D]">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#EFE5D7] dark:bg-[#2A2623]">{preferences.data?.avatarUrl ? <img src={preferences.data.avatarUrl} alt="Your avatar" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}</span>
            <span className="flex-1"><span className="block font-semibold">Your avatar</span><span className="mt-0.5 block text-[#665D56] dark:text-[#C9BEB4]">PNG, JPG, or WebP · 2 MB</span></span>
            <ImageUp className="h-4 w-4" /><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onUpload(event, "avatar")} />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#D8CDC0] p-3 text-xs dark:border-[#4A433D]">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#EFE5D7] dark:bg-[#2A2623]">{activeProject?.logoUrl ? <img src={activeProject.logoUrl} alt="Project logo" className="h-full w-full object-cover" /> : <Palette className="h-4 w-4" />}</span>
            <span className="flex-1"><span className="block font-semibold">Project logo</span><span className="mt-0.5 block text-[#665D56] dark:text-[#C9BEB4]">Admins can update this mark</span></span>
            <ImageUp className="h-4 w-4" /><input disabled={!projectId} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onUpload(event, "project_logo")} />
          </label>
          {upload.error && <p className="text-xs text-[#A55343]">{upload.error.message}</p>}
        </div>
        <div className="mt-5 border-t border-[#D8CDC0] pt-4 dark:border-[#4A433D]">
          <p className="eyebrow">Project accent</p>
          {!projectId ? <p className="mt-1 text-[11px] text-[#665D56] dark:text-[#C9BEB4]">Create or choose a project first; its accent controls will then unlock here.</p> : <p className="mt-1 text-[11px] text-[#665D56] dark:text-[#C9BEB4]">Applies to {activeProject?.name ?? "this project"}. Project admins can update its mark.</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {accents.map(color => <button key={color} disabled={!projectId || updateAccent.isPending} aria-label={`Use ${color} as project accent`} onClick={() => projectId && updateAccent.mutate({ projectId, accentColor: color })} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent ring-offset-2 transition hover:scale-110 disabled:opacity-50" style={{ backgroundColor: color, ...(accent === color ? { borderColor: "#1E1A18" } : {}) }}>{accent === color && <Check className="h-4 w-4 text-white" />}</button>)}
          </div>
          {updateAccent.error && <p role="alert" className="mt-2 text-xs text-[#A55343]">{updateAccent.error.message}</p>}
        </div>
        <div className="mt-5 border-t border-[#D8CDC0] pt-4 dark:border-[#4A433D]">
          <p className="eyebrow">Arrange your flow</p>
          <p className="mt-1 text-[11px] text-[#665D56] dark:text-[#C9BEB4]">Drag to reorder, use Alt + ↑ / ↓, or the move buttons.</p>
          <div className="mt-2 space-y-1">
            {sidebarOrder.map((path, index) => <div key={path} className="flex items-center gap-1 rounded-lg hover:bg-[#EFE5D7] dark:hover:bg-[#2A2623]">
              <button data-sidebar-path={path} draggable onDragStart={() => setDragged(path)} onDragOver={event => event.preventDefault()} onDrop={event => dropSidebar(event, path)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A55343]" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"><GripVertical className="h-3.5 w-3.5 shrink-0 text-[#8A978F]" />{sidebarLabels[path]}</button>
              <button type="button" aria-label={`Move ${sidebarLabels[path]} up`} title={`Move ${sidebarLabels[path]} up`} disabled={index === 0} onClick={() => moveSidebar(path, -1)} className="rounded-md p-1 text-[#665D56] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#C9BEB4] dark:hover:bg-[#3A3530]"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label={`Move ${sidebarLabels[path]} down`} title={`Move ${sidebarLabels[path]} down`} disabled={index === sidebarOrder.length - 1} onClick={() => moveSidebar(path, 1)} className="rounded-md p-1 text-[#665D56] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#C9BEB4] dark:hover:bg-[#3A3530]"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>)}
          </div>
          <p className="mt-3 text-[11px] text-[#665D56] dark:text-[#C9BEB4]">Project order also changes Cmd/Ctrl+K results.</p>
          <div className="mt-2 space-y-1">
            {orderedProjects.map((project, index) => <div key={project.id} className="flex items-center gap-1 rounded-lg hover:bg-[#EFE5D7] dark:hover:bg-[#2A2623]">
              <button data-project-id={project.id} draggable onDragStart={() => setDragged(String(project.id))} onDragOver={event => event.preventDefault()} onDrop={event => dropProject(event, project.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A55343]" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"><GripVertical className="h-3.5 w-3.5 shrink-0 text-[#8A978F]" /><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.accentColor }} />{project.key} · {project.name}</button>
              <button type="button" aria-label={`Move ${project.name} up`} title={`Move ${project.name} up`} disabled={index === 0} onClick={() => moveProject(project.id, -1)} className="rounded-md p-1 text-[#665D56] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#C9BEB4] dark:hover:bg-[#3A3530]"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label={`Move ${project.name} down`} title={`Move ${project.name} down`} disabled={index === orderedProjects.length - 1} onClick={() => moveProject(project.id, 1)} className="rounded-md p-1 text-[#665D56] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#C9BEB4] dark:hover:bg-[#3A3530]"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>)}
          </div>
        </div>
        <div className="mt-5 border-t border-[#D8CDC0] pt-4 dark:border-[#4A433D]">
          <p className="eyebrow">Tune feel</p>
          <p className="mt-1 text-[11px] text-[#665D56] dark:text-[#C9BEB4]">Still removes ambient movement. Soft is balanced. Expressive adds playful feedback.</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-[#EFE5D7] p-1 dark:bg-[#2A2623]">
            {(["still", "soft", "expressive"] as MotionLevel[]).map(level => <Button key={level} type="button" variant="ghost" onClick={() => setMotion(level)} className={`h-8 rounded-lg text-[11px] capitalize ${motion === level ? "bg-white text-[#1E1A18] shadow-sm dark:bg-[#3A3530] dark:text-[#F4EEE6]" : "text-[#665D56] dark:text-[#C9BEB4]"}`}>{level}</Button>)}
          </div>
        </div>
      </div>
    </details>
  );
}
