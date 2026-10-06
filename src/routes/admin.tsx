import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Megaphone, Settings, CalendarClock, Scale, Trophy, Download, UserCog, LogOut, Menu, X, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Control Center — Circuit2Cloud" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", l: "Dashboard", i: LayoutDashboard },
  { to: "/admin/registrations", l: "Registrations", i: Users },
  { to: "/admin/announcements", l: "Announcements", i: Megaphone },
  { to: "/admin/settings", l: "Event Settings", i: Settings },
  { to: "/admin/schedule", l: "Schedule", i: CalendarClock },
  { to: "/admin/judging", l: "Judging Criteria", i: Scale },
  { to: "/admin/awards", l: "Special Awards", i: Trophy },
  { to: "/admin/export", l: "Export Data", i: Download },
  { to: "/admin/account", l: "Admin Settings", i: UserCog },
] as const;

function AdminLayout() {
  const { loading, session, isAdmin } = useAdmin();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!loading && (!session || !isAdmin)) nav({ to: "/admin/login" });
  }, [loading, session, isAdmin, nav]);

  if (loading || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-10 w-48" /></div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar p-4 transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 font-display font-bold"><Cpu className="text-primary" /> CIRCUIT2CLOUD</Link>
        <nav className="space-y-1" aria-label="Admin">
          {LINKS.map(({ to, l, i: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-primary" }}>
              <Icon className="size-4" />{l}
            </Link>
          ))}
          <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/admin/login" }); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive">
            <LogOut className="size-4" />Logout
          </button>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <span className="font-display font-bold">Admin</span>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
