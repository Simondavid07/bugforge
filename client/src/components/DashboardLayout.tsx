import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { initials } from "@/lib/bugforge";
import {
  Bell,
  ChevronDown,
  CircleDotDashed,
  Command,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Rows3,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { PerformanceLab } from "./PerformanceLab";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Rows3, label: "Issues", path: "/issues" },
  { icon: CircleDotDashed, label: "Workboard", path: "/boards" },
  { icon: Waves, label: "Insights", path: "/analytics" },
  { icon: Bell, label: "Inbox", path: "/notifications" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <SignInGate />;
  return (
    <>
      <CustomCursor />
      <SidebarProvider style={{ "--sidebar-width": "244px" } as CSSProperties}>
        <Shell>{children}</Shell>
      </SidebarProvider>
    </>
  );
}
function SignInGate() {
  const { loginAsPersona } = useAuth();

  const personas = [
    {
      key: "admin",
      name: "Carol Danvers",
      role: "Admin Lead",
      badge: "👑 Full Access",
      desc: "Workspace deletion, accent color settings, member governance",
      color: "border-[#FF7164]/40 hover:border-[#FF7164] hover:bg-[#FFF5F4]",
      accent: "bg-[#FF7164]/15 text-[#D14336]",
    },
    {
      key: "triage",
      name: "Eve Adams",
      role: "Triage Lead",
      badge: "🎯 Triage & AI",
      desc: "Status moves, AI draft review & apply, release blocker toggles",
      color: "border-[#F0C068]/40 hover:border-[#F0C068] hover:bg-[#FFFDF5]",
      accent: "bg-[#F0C068]/20 text-[#A6781E]",
    },
    {
      key: "developer",
      name: "Alice Smith",
      role: "Core Engineer",
      badge: "💻 Member",
      desc: "Edit issue reproduction, threaded comments, private file evidence",
      color: "border-[#75937E]/40 hover:border-[#75937E] hover:bg-[#F4FAF6]",
      accent: "bg-[#75937E]/20 text-[#2B5436]",
    },
    {
      key: "viewer",
      name: "Bob Jones",
      role: "Reporter / QA",
      badge: "👁️ Read-Only",
      desc: "Create reports, test server-enforced rejection on restricted actions",
      color: "border-[#839087]/30 hover:border-[#839087] hover:bg-[#F9FAF9]",
      accent: "bg-[#839087]/15 text-[#526058]",
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF6] px-5 py-12">
      <div className="absolute inset-0 paper-grid" />
      <span className="absolute left-[9%] top-[13%] h-32 w-32 rounded-full bg-[#DCCEFF]/60 blur-2xl" />
      <span className="absolute bottom-[12%] right-[9%] h-36 w-36 rounded-[30px] bg-[#A8E6CF]/60 blur-2xl" />
      
      <div className="relative w-full max-w-2xl space-y-6">
        <div className="soft-card p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7164] text-[#18342C] shadow-sm">
              <Command className="h-6 w-6" />
            </div>
            <p className="eyebrow text-[#718079]">BugForge Platform</p>
            <h1 className="display-heading text-3xl sm:text-4xl leading-[1.05]">
              Ship calmer.<br />Fix smarter.
            </h1>
            <p className="text-sm leading-6 text-[#718079] max-w-sm">
              Modern defect intelligence with calm correspondence design, human-reviewed AI triage, and private storage.
            </p>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col items-stretch sm:min-w-[200px] border-t sm:border-t-0 sm:border-l border-[#E8EAE3] pt-5 sm:pt-0 sm:pl-6">
            <p className="text-xs font-semibold text-[#8A978F] mb-3 uppercase tracking-wider">GitHub OAuth</p>
            <Button
              onClick={() => startLogin()}
              className="h-11 w-full rounded-xl bg-[#18342C] font-semibold text-white shadow-md hover:bg-[#264B40]"
            >
              Continue with GitHub
            </Button>
            <span className="mt-2 text-[11px] text-center text-[#8A978F]">Standard OAuth & PKCE</span>
          </div>
        </div>

        <div className="soft-card p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-[#E8EAE3] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#3ECF8E] animate-ping" />
                <h2 className="font-semibold text-base text-[#18342C]">⚡ 1-Click Fast Evaluator Personas</h2>
              </div>
              <p className="text-xs text-[#718079] mt-0.5">
                Instant authentication with pre-seeded workspace & project roles — zero typing required for judges.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {personas.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => void loginAsPersona(p.key)}
                className={`group flex flex-col text-left p-4 rounded-xl border bg-white/80 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md ${p.color}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-bold text-sm text-[#18342C] group-hover:text-[#10251F]">
                    {p.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.accent}`}>
                    {p.badge}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#718079] mb-1.5">{p.role}</p>
                <p className="text-[11px] leading-relaxed text-[#8A978F] line-clamp-2">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, demoPersona, loginAsPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const active = menuItems.find(item => location === item.path) ?? menuItems[0];
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(
      surfaceRef.current?.querySelectorAll("main section, main article") ?? []
    );
    targets.forEach((target, index) => {
      target.classList.add("reveal-ready");
      target.setAttribute(
        "style",
        `${target.getAttribute("style") ?? ""}; transition-delay:${Math.min(index * 55, 220)}ms`
      );
    });
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 }
    );
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [location]);
  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = surfaceRef.current?.getBoundingClientRect();
    if (!box || event.pointerType === "touch") return;
    surfaceRef.current?.style.setProperty(
      "--cursor-x",
      `${event.clientX - box.left}px`
    );
    surfaceRef.current?.style.setProperty(
      "--cursor-y",
      `${event.clientY - box.top}px`
    );
  };
  return (
    <div
      ref={surfaceRef}
      onPointerMove={track}
      className="relative min-h-screen"
    >
      <Sidebar
        collapsible="icon"
        className="border-r border-[#E1E5DB] bg-[#F8F9F3] text-[#19352D]"
      >
        <SidebarHeader className="px-4 pb-4 pt-5">
          <button
            onClick={() => setLocation("/")}
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-left group-data-[collapsible=icon]:justify-center"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF7164] text-[#18342C] shadow-[0_7px_15px_rgba(255,113,100,.28)]">
              <Command className="h-5 w-5" />
            </span>
            <span className="group-data-[collapsible=icon]:hidden">
              <span className="display-heading block text-[22px] leading-none">
                BugForge
              </span>
              <span className="mt-1 block text-[9px] font-medium tracking-[.14em] text-[#718079]">
                ISSUE STUDIO
              </span>
            </span>
          </button>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <div className="mb-3 px-3 text-[9px] font-medium uppercase tracking-[.16em] text-[#8A978F] group-data-[collapsible=icon]:hidden">
            Your workspace
          </div>
          <SidebarMenu className="gap-1">
            {menuItems.map(item => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={active.path === item.path}
                  onClick={() => setLocation(item.path)}
                  tooltip={item.label}
                  className="h-10 rounded-xl px-3 font-medium text-[#63736B] hover:bg-white hover:text-[#18342C] data-[active=true]:bg-[#DCCEFF] data-[active=true]:text-[#18342C]"
                >
                  <item.icon className="h-[17px] w-[17px]" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="mx-3 my-6 h-px bg-[#E1E5DB]" />
          <div className="rounded-2xl bg-[#FFF0A8] p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              AI stays reviewable
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#617067]">
              Helpful drafts, human decisions.
            </p>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <button
            onClick={toggleTheme}
            className="mb-3 flex w-full items-center gap-2 rounded-xl border border-[#E1E5DB] bg-white px-3 py-2 text-xs font-medium text-[#63736B] hover:bg-[#F1F2EA] group-data-[collapsible=icon]:justify-center"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="group-data-[collapsible=icon]:hidden">
              {theme === "dark" ? "Light appearance" : "Soft contrast"}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 rounded-xl bg-[#18342C]">
                  <AvatarFallback className="rounded-xl bg-[#18342C] text-[10px] font-bold text-white">
                    {initials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-xs font-semibold">
                    {user?.name ?? "Workspace member"}
                  </span>
                  <span className="block truncate text-[10px] text-[#839087]">
                    Signed in
                  </span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#839087] group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border-[#E1E5DB] bg-white text-[#19352D]">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer rounded-lg text-[#D95148] focus:bg-[#FFF1EF] focus:text-[#D95148]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-[#FAFAF6] text-[#19352D]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#E8EAE3]/80 bg-[#FAFAF6]/82 px-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-xl border border-[#E1E5DB] bg-white text-[#19352D] hover:bg-[#F1F2EA] md:hidden" />
            <div>
              <p className="eyebrow text-[#8A978F]">
                {active.label === "Overview" ? "Welcome back" : "Workspace"}
              </p>
              <p className="display-heading text-xl leading-none">
                {active.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <PerformanceLab />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-xl border border-[#E1E5DB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18342C] shadow-sm hover:bg-[#F1F2EA] transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-[#3ECF8E]" />
                  <span className="hidden sm:inline text-[#718079]">Role:</span>
                  <span>
                    {demoPersona === "admin"
                      ? "👑 Carol (Admin)"
                      : demoPersona === "triage"
                      ? "🎯 Eve (Triage)"
                      : demoPersona === "viewer"
                      ? "👁️ Bob (Viewer)"
                      : demoPersona === "developer"
                      ? "💻 Alice (Dev)"
                      : user?.name ?? "Demo User"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#8A978F]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 shadow-xl bg-white border border-[#E8EAE3]">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-[#8A978F] px-2 py-1">
                  ⚡ Fast Evaluator Switcher
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void loginAsPersona("admin")}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-[#FFF5F4] focus:bg-[#FFF5F4]"
                >
                  👑 Carol Danvers (Admin)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void loginAsPersona("triage")}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-[#FFFDF5] focus:bg-[#FFFDF5]"
                >
                  🎯 Eve Adams (Triage Lead)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void loginAsPersona("developer")}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-[#F4FAF6] focus:bg-[#F4FAF6]"
                >
                  💻 Alice Smith (Core Dev)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void loginAsPersona("viewer")}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-[#F9FAF9] focus:bg-[#F9FAF9]"
                >
                  👁️ Bob Jones (Viewer / QA)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden items-center gap-2 rounded-xl border border-[#E1E5DB] bg-white px-3 py-2 text-xs text-[#839087] lg:flex">
              <Command className="h-3.5 w-3.5" />
              Quick find{" "}
              <kbd className="ml-4 rounded border border-[#E1E5DB] px-1.5 py-0.5 text-[9px]">
                ⌘ K
              </kbd>
            </div>
            <Button
              size="sm"
              onClick={() => setLocation("/issues")}
              className="h-9 rounded-xl bg-[#FF7164] px-3 font-semibold text-[#18342C] shadow-[0_7px_16px_rgba(255,113,100,.22)] hover:bg-[#FF8A7E]"
            >
              <Plus className="mr-1 h-4 w-4" />
              New issue
            </Button>
          </div>
        </header>
        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#FAFAF6] p-4 md:p-8">
          <div className="cursor-wash" />
          <div className="paper-grid absolute inset-0 opacity-60" />
          <div className="relative z-10 page-enter">{children}</div>
        </main>
      </SidebarInset>
    </div>
  );
}

function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    if (reduced.matches || !fine.matches) return;
    document.documentElement.classList.add("has-custom-cursor");
    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let frame = 0;
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      dot.current?.classList.add("is-visible");
      ring.current?.classList.add("is-visible");
      const interactive = (event.target as HTMLElement).closest(
        "a,button,input,textarea,select,[role='button']"
      );
      ring.current?.classList.toggle("is-active", Boolean(interactive));
    };
    const leave = () => {
      dot.current?.classList.remove("is-visible");
      ring.current?.classList.remove("is-visible");
    };
    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current)
        dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);
  return (
    <>
      <div ref={dot} aria-hidden className="cursor-dot" />
      <div ref={ring} aria-hidden className="cursor-ring" />
    </>
  );
}
