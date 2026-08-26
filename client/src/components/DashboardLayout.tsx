import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import { Activity, Bell, Bug, ChartNoAxesCombined, CircleDotDashed, LayoutDashboard, LogOut, Moon, PanelLeft, Plus, Rows3, Sparkles, Sun } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { initials } from "@/lib/bugforge";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Rows3, label: "Issue explorer", path: "/issues" },
  { icon: CircleDotDashed, label: "Workboards", path: "/boards" },
  { icon: ChartNoAxesCombined, label: "Insights", path: "/analytics" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

const SIDEBAR_WIDTH_KEY = "bugforge-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 224;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? DEFAULT_WIDTH));
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <SignInGate />;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function SignInGate() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#ffe9df] px-5 text-black">
      <span className="memphis-shape absolute left-[10%] top-[12%] h-14 w-14 rounded-full bg-[#9de7d3]" />
      <span className="memphis-shape absolute bottom-[12%] right-[12%] h-16 w-16 rotate-12 bg-[#d9c8ff]" />
      <div className="relative z-10 max-w-md border-[3px] border-black bg-white p-8 shadow-[8px_8px_0_#000]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-black bg-[#ffe66d]"><Bug className="h-6 w-6" /></div>
        <p className="eyebrow mb-3">BugForge workspace</p>
        <h1 className="display-heading text-4xl leading-[.92]">Ship with fewer surprises.</h1>
        <p className="mt-5 text-sm leading-6 text-black/70">Sign in to report issues, run focused triage, and turn release readiness into an everyday habit.</p>
        <Button onClick={() => startLogin()} className="mt-7 w-full border-[2px] border-black bg-black text-white shadow-[4px_4px_0_#ffaf7a] hover:bg-black/85">Enter BugForge</Button>
      </div>
    </div>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (value: number) => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const active = menuItems.find(item => item.path === location) ?? menuItems[0];

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
    }
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-[3px] border-black bg-[#fffdf8]">
          <SidebarHeader className="h-[84px] border-b-[3px] border-black px-3 py-3">
            <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
              <button onClick={() => setLocation("/")} aria-label="Go to BugForge overview" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-[#ffe66d] shadow-[3px_3px_0_#000] transition-transform active:scale-95"><Bug className="h-5 w-5" /></button>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="display-heading text-xl leading-none">BUGFORGE</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em]">Issue intelligence</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4">
            <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.16em] text-black/45 group-data-[collapsible=icon]:hidden">Navigate</div>
            <SidebarMenu className="gap-1">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={active.path === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-none border-2 border-transparent px-3 font-semibold data-[active=true]:border-black data-[active=true]:bg-[#d9c8ff] data-[active=true]:shadow-[3px_3px_0_#000] hover:bg-[#ffe9df]">
                    <item.icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="mx-2 my-5 border-t-2 border-dashed border-black/25" />
            <div className="rounded-none border-2 border-black bg-[#9de7d3] p-3 group-data-[collapsible=icon]:hidden">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold"><Sparkles className="h-3.5 w-3.5" /> AI draft mode</div>
              <p className="text-[11px] leading-4 text-black/70">Every suggestion waits for a human decision.</p>
            </div>
          </SidebarContent>
          <SidebarFooter className="border-t-[3px] border-black p-3">
            <button onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} className="mb-3 flex h-9 w-full items-center gap-2 border-2 border-black bg-[#ffe66d] px-2 text-xs font-bold shadow-[2px_2px_0_#000] group-data-[collapsible=icon]:justify-center">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}<span className="group-data-[collapsible=icon]:hidden">{theme === "light" ? "Night forge" : "Day forge"}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-none px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-black group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-9 w-9 shrink-0 rounded-none border-2 border-black bg-[#ffaf7a]"><AvatarFallback className="rounded-none bg-[#ffaf7a] text-xs font-extrabold text-black">{initials(user?.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-bold">{user?.name ?? "Workspace member"}</p><p className="truncate text-[10px] text-black/55">Signed in</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none border-2 border-black">
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-none font-medium text-red-700 focus:bg-[#ffe9df] focus:text-red-700"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div aria-hidden className="absolute right-0 top-0 z-50 hidden h-full w-1 cursor-col-resize hover:bg-black/25 md:block" onMouseDown={() => setIsResizing(true)} />
      </div>
      <SidebarInset className="min-w-0 bg-[#ffe9df]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b-[3px] border-black bg-[#ffe9df]/90 px-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3"><SidebarTrigger className="rounded-none border-2 border-black bg-white md:hidden" /><div><p className="eyebrow text-black/55">Forge console</p><p className="display-heading text-lg leading-none">{active.label}</p></div></div>
          <Button size="sm" onClick={() => setLocation("/issues")} className="rounded-none border-2 border-black bg-black text-white shadow-[3px_3px_0_#ffe66d] hover:bg-black/85"><Plus className="mr-1 h-4 w-4" />Report issue</Button>
        </header>
        <main className="relative min-h-[calc(100vh-72px)] p-4 md:p-7">{children}</main>
      </SidebarInset>
    </>
  );
}
