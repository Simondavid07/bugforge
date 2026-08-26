import { useEffect } from "react";

/** Marks the currently rendered workspace route with its correspondence surface identity. */
export function useCorrespondenceSurface(surface: "overview" | "issues" | "workboard" | "insights" | "inbox" | "issue-desk") {
  useEffect(() => {
    const route = document.querySelector<HTMLElement>(".correspondence-route");
    if (!route) return;
    route.dataset.correspondence = surface;
    return () => { delete route.dataset.correspondence; };
  }, [surface]);
}
