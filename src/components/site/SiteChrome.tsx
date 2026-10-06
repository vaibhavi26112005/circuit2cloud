import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, AlertTriangle, Megaphone, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicAnnouncements, useSettings, TBA } from "@/lib/event-data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", hash: undefined },
  { to: "/", label: "About", hash: "about" },
  { to: "/", label: "Clinic Cycle", hash: "clinic" },
  { to: "/schedule", label: "Schedule" },
  { to: "/rules", label: "Rules" },
  { to: "/judging", label: "Judging" },
  { to: "/announcements", label: "Announcements" },
  { to: "/register", label: "Register" },
] as const;

export function AnnouncementBar() {
  const { data } = usePublicAnnouncements();
  const top = data?.[0];
  if (!top) return null;
  const important = top.type === "IMPORTANT";
  return (
    <Link
      to="/announcements"
      className={cn(
        "no-print block border-b px-4 py-2 text-center text-sm transition-colors",
        important
          ? "border-destructive/50 bg-destructive/15 text-foreground hover:bg-destructive/25"
          : "border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15",
      )}
    >
      <span className="inline-flex items-center gap-2">
        {important ? (
          <AlertTriangle className="size-4 text-destructive" />
        ) : (
          <Megaphone className="size-4 text-primary" />
        )}
        {important && <strong className="font-mono tracking-widest text-destructive">IMPORTANT —</strong>}
        <span className="font-medium">{top.title}</span>
        <span className="hidden text-muted-foreground sm:inline">· {top.message.slice(0, 90)}</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="no-print sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Cpu className="size-6 text-primary" />
          <span>
            CIRCUIT<span className="text-accent">2</span>CLOUD
          </span>
        </Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.slice(0, 7).map((n) => (
            <li key={n.label}>
              <Link
                to={n.to}
                {...("hash" in n && n.hash ? { hash: n.hash } : {})}
                className="rounded px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                activeOptions={{ exact: true, includeHash: true }}
                activeProps={{ className: "text-primary" }}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button asChild variant="cta" size="sm" className="hidden sm:inline-flex">
            <Link to="/register">Register Now</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>
      {open && (
        <ul className="border-t px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <li key={n.label}>
              <Link
                to={n.to}
                {...("hash" in n && n.hash ? { hash: n.hash } : {})}
                onClick={() => setOpen(false)}
                className="block py-3 font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-primary"
              >
                {n.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Button asChild variant="cta" size="xl" className="w-full">
              <Link to="/register" onClick={() => setOpen(false)}>Register Now</Link>
            </Button>
          </li>
        </ul>
      )}
    </header>
  );
}

export function Footer() {
  const { data: s } = useSettings();
  return (
    <footer className="no-print mt-24 border-t tech-grid">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold">CIRCUIT2CLOUD</p>
          <p className="eyebrow mt-1">Hardware Edition</p>
          <p className="mt-4 text-muted-foreground">Diagnose. Design. Build. Prove.</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {NAV.map((n) => (
            <li key={n.label}>
              <Link to={n.to} {...("hash" in n && n.hash ? { hash: n.hash } : {})} className="text-muted-foreground hover:text-primary">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-3 text-sm">
          <p className="eyebrow">Contact</p>
          <p>{s?.contact_name || TBA}</p>
          {s?.contact_phone && <p><a className="hover:text-primary" href={`tel:${s.contact_phone}`}>{s.contact_phone}</a></p>}
          {s?.contact_email && <p><a className="hover:text-primary" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>}
          <p className="pt-2"><span className="text-muted-foreground">Organized by: </span>{s?.organization || TBA}</p>
          <p><span className="text-muted-foreground">Supported by: </span>{s?.sponsors || TBA}</p>
        </div>
      </div>
      <div className="border-t py-5 text-center font-mono text-xs text-muted-foreground">
        © {new Date().getFullYear()} Circuit2Cloud — Hardware Edition ·{" "}
        <Link to="/admin" className="hover:text-primary">Admin</Link>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}
