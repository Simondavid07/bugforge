import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

const ACTIVE_PROJECT_KEY = "bugforge-active-project";

export function useActiveProject() {
  const workspaceQuery = trpc.workspace.mine.useQuery(undefined, { retry: false });
  const [projectId, setProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    const projects = workspaceQuery.data?.projects ?? [];
    if (!projects.length) return;
    const stillAvailable = projectId && projects.some(project => project.id === projectId);
    if (!stillAvailable) setProjectId(projects[0].id);
  }, [projectId, workspaceQuery.data?.projects]);

  const chooseProject = (id: number) => {
    localStorage.setItem(ACTIVE_PROJECT_KEY, String(id));
    setProjectId(id);
  };

  return {
    ...workspaceQuery,
    projectId,
    activeProject: workspaceQuery.data?.projects.find(project => project.id === projectId) ?? null,
    chooseProject,
  };
}
