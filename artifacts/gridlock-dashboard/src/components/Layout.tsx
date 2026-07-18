import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BrainCircuit, BarChart3, Cpu, Activity, Menu, X
} from "lucide-react";
import { useState } from "react";
import ApiWakeUp from "@/components/ApiWakeUp";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/predict", label: "Event Predictor", icon: BrainCircuit },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/pipeline", label: "ML Pipeline", icon: Cpu },
];

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: any; active: boolean }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary/15 text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">Gridlock</p>
            <p className="text-xs text-muted-foreground">Bengaluru Traffic AI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Navigation</p>
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} active={location === href} />
          ))}
        </nav>

        {/* Footer badge */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
            <p className="text-xs font-semibold text-primary">Flipkart Hackathon R2</p>
            <p className="text-xs text-muted-foreground mt-0.5">Problem Statement 2</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-semibold text-sm">Gridlock Dashboard</span>
        </header>

        <ApiWakeUp />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
