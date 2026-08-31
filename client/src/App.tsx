import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import { lazy, Suspense, type ComponentType, type ElementType } from "react";
import { Route, Switch } from "wouter";

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await factory();
      sessionStorage.removeItem("bugforge_chunk_retry");
      return component;
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes("dynamically imported module") ||
        error?.message?.includes("Loading chunk") ||
        error?.name === "ChunkLoadError";

      if (isChunkError && !sessionStorage.getItem("bugforge_chunk_retry")) {
        sessionStorage.setItem("bugforge_chunk_retry", "true");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem("bugforge_chunk_retry");
      throw error;
    }
  });
}

const Home = lazyWithRetry(() => import("@/pages/Home"));
const IssueExplorer = lazyWithRetry(() => import("@/pages/IssueExplorer"));
const IssueDetail = lazyWithRetry(() => import("@/pages/IssueDetail"));
const Boards = lazyWithRetry(() => import("@/pages/Boards"));
const Analytics = lazyWithRetry(() => import("@/pages/Analytics"));
const Notifications = lazyWithRetry(() => import("@/pages/Notifications"));
const CommandPalette = lazyWithRetry(() => import("@/components/CommandPalette"));
const ProjectPersonalization = lazyWithRetry(
  () => import("@/components/ProjectPersonalization")
);

function CorrespondenceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="correspondence-route">
      <div className="correspondence-rule" aria-hidden="true" />
      {children}
    </div>
  );
}
function WorkspaceRoute({ component: Component }: { component: ElementType }) {
  return (
    <DashboardLayout>
      <CorrespondenceFrame>
        <Suspense
          fallback={
            <div className="grid min-h-[45vh] place-items-center text-sm text-[#665D56] dark:text-[#C9BEB4]">
              Opening your workspace…
            </div>
          }
        >
          <Component />
        </Suspense>
      </CorrespondenceFrame>
    </DashboardLayout>
  );
}
function Router() {
  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={() => <WorkspaceRoute component={Home} />} />
      <Route
        path="/issues"
        component={() => <WorkspaceRoute component={IssueExplorer} />}
      />
      <Route
        path="/issues/:id"
        component={() => <WorkspaceRoute component={IssueDetail} />}
      />
      <Route
        path="/boards"
        component={() => <WorkspaceRoute component={Boards} />}
      />
      <Route
        path="/analytics"
        component={() => <WorkspaceRoute component={Analytics} />}
      />
      <Route
        path="/notifications"
        component={() => <WorkspaceRoute component={Notifications} />}
      />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors />
          <Router />
          <Suspense fallback={null}>
            <CommandPalette />
            <ProjectPersonalization />
          </Suspense>
          <div
            id="personalization-announcer"
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
