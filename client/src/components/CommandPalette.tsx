import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { useActiveProject } from "@/hooks/useActiveProject";
import { trpc } from "@/lib/trpc";
import { BarChart3, Bell, Command, FileSearch, Home, KanbanSquare, ListTodo, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const routes = [
  { label: "Overview", path: "/", icon: Home },
  { label: "Issues", path: "/issues", icon: ListTodo },
  { label: "Workboard", path: "/boards", icon: KanbanSquare },
  { label: "Insights", path: "/analytics", icon: BarChart3 },
  { label: "Inbox", path: "/notifications", icon: Bell },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data, projectId, activeProject, chooseProject } = useActiveProject();
  const issueQuery = trpc.issues.list.useQuery({ projectId: projectId ?? 0, pageSize: 12 }, { enabled: Boolean(projectId) });
  const go = (path: string) => { setOpen(false); setLocation(path); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(value => !value); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <CommandDialog open={open} onOpenChange={setOpen} title="Navigate BugForge" description="Jump to pages, projects, and recent issues." className="command-palette border-[#D8CDC0] bg-[#FFFCF7] text-[#1E1A18] dark:border-[#4A433D] dark:bg-[#211F1D] dark:text-[#F4EEE6]">
    <CommandInput placeholder="Search pages, projects, or issues…" />
    <CommandList>
      <CommandEmpty>No matching destination.</CommandEmpty>
      <CommandGroup heading="Navigate">
        {routes.map(route => <CommandItem key={route.path} value={`go ${route.label}`} onSelect={() => go(route.path)}><route.icon /><span>{route.label}</span>{route.path === "/issues" && <CommandShortcut>G I</CommandShortcut>}</CommandItem>)}
        <CommandItem value="new issue" onSelect={() => go("/issues")}><Plus /><span>Create a new issue</span></CommandItem>
      </CommandGroup>
      <CommandGroup heading="Projects">
        {(data?.projects ?? []).map(project => <CommandItem key={project.id} value={`${project.key} ${project.name}`} onSelect={() => { chooseProject(project.id); go("/"); }}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.accentColor }} /><span>{project.key} · {project.name}</span>{activeProject?.id === project.id && <CommandShortcut>Active</CommandShortcut>}</CommandItem>)}
      </CommandGroup>
      {issueQuery.data?.items?.length ? <CommandGroup heading="Recent issues">
        {issueQuery.data.items.map(issue => <CommandItem key={issue.id} value={`issue ${issue.number} ${issue.title}`} onSelect={() => go(`/issues/${issue.id}`)}><FileSearch /><span className="truncate">#{issue.number} · {issue.title}</span></CommandItem>)}
      </CommandGroup> : null}
    </CommandList>
  </CommandDialog>;
}
