import { Link } from "@tanstack/react-router";
import {
  Stethoscope, PenTool, Wrench, Activity, BadgeCheck, FileText, UserRound, Pill, Hammer,
  FileSearch, ShieldAlert, Factory, Check, X, AlertTriangle, Cpu, Trophy, Shield, Heart, ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SiteChrome";
import { useAwards, useCriteria, useSchedule, useSettings, usePublicAnnouncements, fmtDate } from "@/lib/event-data";
import { cn } from "@/lib/utils";

export function RegistrationStatus({ compact }: { compact?: boolean }) {
  const { data: s, isLoading } = useSettings();
  if (isLoading) return <Skeleton className="h-16 w-full max-w-md" />;
  const st = s?.registration_status ?? "OPEN";
  const map = {
    OPEN: { dot: "bg-success", text: "Registrations Open", sub: "Register your team now.", cls: "border-success/40" },
    "CLOSING SOON": { dot: "bg-accent", text: "Registrations Closing Soon", sub: `Deadline: ${s?.registration_deadline || "To Be Announced"}`, cls: "border-accent/50" },
    CLOSED: { dot: "bg-destructive", text: "Registrations Closed", sub: "Registrations for Circuit2Cloud are currently closed.", cls: "border-destructive/50" },
  } as const;
  const m = map[st as keyof typeof map] ?? map.OPEN;
  return (
    <div className={cn("glass inline-flex items-center gap-3 rounded-lg px-4 py-3", m.cls)} role="status">
      <span className={cn("node-pulse size-3 rounded-full", m.dot)} aria-hidden />
      <div>
        <p className="font-display font-bold uppercase tracking-wider">{m.text}</p>
        {!compact && <p className="text-sm text-muted-foreground">{m.sub}</p>}
      </div>
    </div>
  );
}

const FLOW = ["Real Problem", "Diagnose", "Design", "Build", "Stress Test", "Prove"];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="// About" title="THE HARDWARE CHALLENGE" />
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>Circuit2Cloud Hardware Edition is built around a simple idea: teams should not build random gadgets. They should solve real problems.</p>
            <p>Every team receives a <span className="text-foreground">Patient File</span> containing a real-world problem. Teams approach the challenge like design doctors — diagnose the root cause, prescribe a solution, operate by building it, test its recovery under stress, and finally discharge it through a working demonstration.</p>
          </div>
        </div>
        <ol className="relative space-y-3 border-l border-primary/30 pl-8">
          {FLOW.map((f, i) => (
            <li key={f} className="relative">
              <span className="absolute -left-[41px] top-3 size-4 rounded-full border-2 border-primary bg-background node-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              <div className="glass trace-line rounded-lg px-5 py-3 font-display text-lg font-bold uppercase tracking-widest">
                <span className="mr-3 font-mono text-xs text-primary">0{i}</span>{f}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CYCLE = [
  { n: "01", t: "Diagnose", d: "Find the root cause.", i: Stethoscope },
  { n: "02", t: "Prescribe", d: "Design the fix.", i: PenTool },
  { n: "03", t: "Operate", d: "Build the device.", i: Wrench },
  { n: "04", t: "Recovery", d: "Stress-test it.", i: Activity },
  { n: "05", t: "Discharge", d: "Demo & prove it.", i: BadgeCheck },
];

export function ClinicCycle() {
  return (
    <section id="clinic" className="scroll-mt-24 border-y tech-grid py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow="// Protocol" title="THE CLINIC CYCLE" sub="Every team gets a real-world Patient File and works it like a design doctor." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CYCLE.map(({ n, t, d, i: Icon }) => (
            <article key={n} tabIndex={0} className="glass group rounded-xl p-6 transition-all hover:-translate-y-1 hover:glow focus:glow">
              <div className="flex items-center justify-between">
                <Icon className="size-8 text-primary transition-colors group-hover:text-accent" />
                <span className="font-mono text-sm text-muted-foreground">{n}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold uppercase">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
              <svg viewBox="0 0 120 20" className="mt-4 h-5 w-full text-primary/60" aria-hidden>
                <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points="0,10 40,10 48,2 56,18 64,10 120,10" />
              </svg>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { t: "Patient Files", d: "Real problems from industry, workshops and farms are presented as challenge files.", i: FileText },
  { t: "Clinic Doctors", d: "Expert mentors provide feedback twice a day but never build for the team.", i: UserRound },
  { t: "The Pharmacy", d: "Teams spend a fixed component budget, rewarding smart and frugal design.", i: Pill },
  { t: "Teardown Round", d: "Dissect a dead appliance, identify its failure points and reuse one part in the final build.", i: Hammer },
  { t: "Failure Autopsy", d: "Present what went wrong, why it happened and how it was fixed.", i: FileSearch },
  { t: "Stress Ward", d: "Devices face surprise tests such as vibration, voltage dip, heat, dust or wrong polarity.", i: ShieldAlert },
  { t: "Made-for-100", d: "Judges evaluate how easily the device could be manufactured at scale.", i: Factory },
];

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Differentiators" title="WHAT MAKES CIRCUIT2CLOUD DIFFERENT" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ t, d, i: Icon }, idx) => (
          <article key={t} className={cn("glass group rounded-xl p-6 transition-all hover:-translate-y-1 hover:border-accent/60 hover:glow-accent", idx === 0 && "lg:col-span-2")}>
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-lg border border-primary/40 bg-primary/10">
                <Icon className="size-6 text-primary group-hover:text-accent" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">F-{String(idx + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-5 text-xl font-bold">{t}</h3>
            <p className="mt-2 text-muted-foreground">{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const ALLOWED = ["Analog circuits", "Digital circuits", "Sensors", "Actuators", "Motor drivers", "Power electronics", "PCB / perfboard", "3D-printed parts", "Fabricated mechanical parts", "Enclosures", "Mechanisms"];
const NOT = ["Cloud", "IoT dashboards", "Mobile apps", "Web interfaces", "AI/ML", "Mains voltage", "Pre-built modules"];

export function PureHardware() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Scope" title="WHAT COUNTS AS PURE HARDWARE?" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-xl border-success/40 p-8">
          <h3 className="flex items-center gap-2 text-2xl font-bold text-success"><Check /> ALLOWED</h3>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {ALLOWED.map((a) => <li key={a} className="flex items-center gap-2"><Check className="size-4 text-success" />{a}</li>)}
          </ul>
        </div>
        <div className="glass rounded-xl border-destructive/40 p-8">
          <h3 className="flex items-center gap-2 text-2xl font-bold text-destructive"><X /> NOT ALLOWED</h3>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {NOT.map((a) => <li key={a} className="flex items-center gap-2"><X className="size-4 text-destructive" />{a}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-6">
          <p className="flex items-center gap-2 font-display font-bold text-warning"><AlertTriangle className="size-5" /> SAFETY FIRST</p>
          <p className="mt-2">12V DC limit. Mandatory safety glasses at soldering stations.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="flex items-center gap-2 font-display font-bold text-primary"><Cpu className="size-5" /> MICROCONTROLLER</p>
          <p className="mt-2 text-muted-foreground">Microcontroller use is limited to a simple controller role. Final rule will be announced before the event.</p>
        </div>
      </div>
    </section>
  );
}

export function ScheduleSection() {
  const { data, isLoading } = useSchedule();
  const days = [
    { d: 1, t: "DAY 1 — DIAGNOSE & BUILD" },
    { d: 2, t: "DAY 2 — OPERATE & PROVE" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Timeline" title="THE TWO DAYS" sub="From Patient File to final demo." />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      ) : !data?.length ? (
        <p className="text-muted-foreground">Schedule will be announced soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {days.map(({ d, t }) => {
            const items = data.filter((x) => x.day === d);
            return (
              <div key={d} className="glass rounded-xl p-6 md:p-8">
                <h3 className={cn("text-xl font-bold", d === 1 ? "text-primary" : "text-accent")}>{t}</h3>
                {items.length === 0 ? (
                  <p className="mt-6 text-muted-foreground">Schedule will be announced soon.</p>
                ) : (
                  <ol className="mt-6 space-y-5 border-l border-border pl-6">
                    {items.map((it) => (
                      <li key={it.id} className="relative">
                        <span className={cn("absolute -left-[31px] top-1.5 size-3 rounded-full", d === 1 ? "bg-primary" : "bg-accent")} />
                        <p className="font-mono text-sm text-muted-foreground">{it.time}</p>
                        <p className="font-medium">{it.title}</p>
                        {it.description && <p className="text-sm text-muted-foreground">{it.description}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function JudgingSection() {
  const { data, isLoading } = useCriteria();
  const total = (data ?? []).reduce((s, c) => s + c.points, 0);
  const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Scoring" title="HOW YOU ARE JUDGED" />
      {isLoading ? <Skeleton className="h-80" /> : (
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="glass grid place-items-center rounded-xl p-10 text-center glow">
            <div>
              <p className="text-gradient font-display text-8xl font-bold">{total}</p>
              <p className="eyebrow mt-2">Total points</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex h-4 overflow-hidden rounded-full bg-secondary" aria-hidden>
              {data?.map((c, i) => <div key={c.id} className={colors[i % 5]} style={{ width: `${total ? (c.points / total) * 100 : 0}%` }} />)}
            </div>
            <ul className="divide-y divide-border">
              {data?.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="flex items-center gap-3"><span className={cn("size-3 rounded-sm", colors[i % 5])} />{c.title}</span>
                  <span className="font-mono text-lg font-bold">{c.points}</span>
                </li>
              ))}
              <li className="flex justify-between py-3 font-display text-lg font-bold"><span>TOTAL</span><span>{total}</span></li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

const AWARD_ICONS = [Trophy, Wrench, Shield, Heart];

export function AwardsSection() {
  const { data, isLoading } = useAwards();
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Recognition" title="SPECIAL AWARDS" />
      {isLoading ? <Skeleton className="h-48" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((a, i) => {
            const Icon = AWARD_ICONS[i % 4];
            return (
              <article key={a.id} className="glass rounded-xl p-6 transition-all hover:-translate-y-1 hover:glow-accent">
                <Icon className="size-10 text-warning" />
                <h3 className="mt-4 text-xl font-bold">{a.title}</h3>
                {a.description && <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>}
                {a.prize && <p className="mt-4 font-mono text-sm text-accent">{a.prize}</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export const RULES = [
  "Teams consist of 3–4 college students.",
  "Everything is built on-site.",
  "Standard breakout boards are allowed.",
  "Teams must submit a schematic, hand sketch and BOM at the Day 1 Design Freeze.",
  "12V DC limit.",
  "Safety glasses are mandatory at soldering stations.",
  "Microcontroller use is limited to a simple controller role.",
  "Final microcontroller rule will be announced before the event.",
];

export function RulesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24">
      <SectionHeading eyebrow="// Regulations" title="RULES AT A GLANCE" />
      <ol className="grid gap-3 md:grid-cols-2">
        {RULES.map((r, i) => (
          <li key={r} className="glass flex gap-4 rounded-lg p-5">
            <span className="font-mono text-primary">R{String(i + 1).padStart(2, "0")}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AnnouncementsList({ limit }: { limit?: number }) {
  const { data, isLoading } = usePublicAnnouncements();
  if (isLoading) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  const list = limit ? data?.slice(0, limit) : data;
  if (!list?.length) return <p className="text-muted-foreground">No announcements yet.</p>;
  return (
    <ul className="space-y-4">
      {list.map((a) => (
        <li key={a.id} className={cn("glass rounded-xl p-6", a.type === "IMPORTANT" && "border-destructive/60 bg-destructive/10")}>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest">
            {a.is_pinned && <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">Pinned</span>}
            {a.type === "IMPORTANT" && <span className="rounded bg-destructive/20 px-2 py-0.5 text-destructive">Important</span>}
            <span className="text-muted-foreground">{fmtDate(a.created_at)}</span>
          </div>
          <h3 className="mt-3 text-xl font-bold">{a.title}</h3>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{a.message}</p>
        </li>
      ))}
    </ul>
  );
}

export function RegisterCTA() {
  const { data: s } = useSettings();
  const closed = s?.registration_status === "CLOSED";
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="glass relative overflow-hidden rounded-2xl p-10 text-center md:p-16 tech-grid glow">
        <h2 className="text-3xl font-bold md:text-5xl">READY TO BUILD SOMETHING REAL?</h2>
        <p className="mt-4 text-lg text-muted-foreground">Your team. Your diagnosis. Your build. Your proof.</p>
        <div className="mt-8">
          {closed ? (
            <p className="font-display text-lg text-destructive">Registrations are currently closed.</p>
          ) : (
            <Button asChild variant="cta" size="xl"><Link to="/register">Register Your Team <ArrowRight /></Link></Button>
          )}
        </div>
      </div>
    </section>
  );
}
