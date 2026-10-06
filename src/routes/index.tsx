import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout, SectionHeading } from "@/components/site/SiteChrome";
import {
  AboutSection, AnnouncementsList, AwardsSection, ClinicCycle, Features, JudgingSection,
  PureHardware, RegisterCTA, RegistrationStatus, RulesSection, ScheduleSection,
} from "@/components/site/Sections";
import { useSettings, TBA } from "@/lib/event-data";
import { seo } from "@/lib/seo";
import hero from "@/assets/hero-circuit.jpg";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "Circuit2Cloud — Hardware Edition | National Hardware Build Challenge",
      "Circuit2Cloud Hardware Edition is a 2-Day National Hardware Build Challenge where student teams diagnose real-world problems, design, build, stress-test and prove physical hardware solutions.",
    ),
  component: Index,
});

function Hero() {
  const { data: s } = useSettings();
  const closed = s?.registration_status === "CLOSED";
  const cards = [
    { i: Calendar, l: "Date", v: s?.event_date || TBA },
    { i: MapPin, l: "Venue", v: s?.venue || TBA },
    { i: Users, l: "Team Size", v: "3–4 Members" },
  ];
  return (
    <section className="tech-grid relative overflow-hidden border-b">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-block rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent">
            2-Day National Hardware Build Challenge
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-none sm:text-7xl">
            <span className="text-gradient">{s?.event_name || "CIRCUIT2CLOUD"}</span>
          </h1>
          <p className="mt-3 font-display text-2xl font-semibold tracking-[0.3em] text-muted-foreground">HARDWARE EDITION</p>
          <p className="mt-6 font-display text-xl font-bold text-primary">{s?.tagline || "Diagnose. Design. Build. Prove."}</p>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {s?.description ||
              "A 2-Day National Hardware Build Challenge where teams diagnose real-world problems, design practical solutions, build them on-site, stress-test them and prove that they work."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {closed ? (
              <Button variant="cta" size="xl" disabled>Registrations Closed</Button>
            ) : (
              <Button asChild variant="cta" size="xl"><Link to="/register">Register Your Team <ArrowRight /></Link></Button>
            )}
            <Button asChild variant="neon" size="xl"><a href="#about">Explore the Challenge <ArrowDown /></a></Button>
          </div>
          <div className="mt-8"><RegistrationStatus /></div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-brand opacity-25 blur-3xl" aria-hidden />
          <img
            src={hero}
            alt="Circuit2Cloud Hardware Edition artwork — glowing circuit board with a heartbeat chip, gears and robotic arm"
            width={1280}
            height={1280}
            className="glow relative aspect-square w-full rounded-2xl object-cover"
          />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {cards.map(({ i: Icon, l, v }) => (
          <div key={l} className="glass flex items-center gap-4 rounded-xl p-5">
            <Icon className="size-8 text-primary" />
            <div>
              <p className="eyebrow">{l}</p>
              <p className="mt-1 font-display text-lg font-bold">{v}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Index() {
  return (
    <PublicLayout>
      <Hero />
      <section className="mx-auto max-w-7xl px-4 pt-20">
        <SectionHeading eyebrow="// Live feed" title="LATEST ANNOUNCEMENTS" />
        <AnnouncementsList limit={3} />
      </section>
      <AboutSection />
      <ClinicCycle />
      <Features />
      <PureHardware />
      <ScheduleSection />
      <RulesSection />
      <JudgingSection />
      <AwardsSection />
      <RegisterCTA />
    </PublicLayout>
  );
}
