import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Analytics from "@/pages/Analytics";
import Boards from "@/pages/Boards";
import Home from "@/pages/Home";
import IssueDetail from "@/pages/IssueDetail";
import IssueExplorer from "@/pages/IssueExplorer";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";

function CorrespondenceFrame({ children }: { children: React.ReactNode }) { return <div className="correspondence-route"><div className="correspondence-rule" aria-hidden="true" />{children}</div>; }
function WorkspaceRoute({ component: Component }: { component: React.ComponentType }) { return <DashboardLayout><CorrespondenceFrame><Component /></CorrespondenceFrame></DashboardLayout>; }
function Router() { return <Switch><Route path="/" component={() => <WorkspaceRoute component={Home} />} /><Route path="/issues" component={() => <WorkspaceRoute component={IssueExplorer} />} /><Route path="/issues/:id" component={() => <WorkspaceRoute component={IssueDetail} />} /><Route path="/boards" component={() => <WorkspaceRoute component={Boards} />} /><Route path="/analytics" component={() => <WorkspaceRoute component={Analytics} />} /><Route path="/notifications" component={() => <WorkspaceRoute component={Notifications} />} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
