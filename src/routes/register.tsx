import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Download, Printer, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/site/SiteChrome";
import { RegistrationStatus } from "@/components/site/Sections";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, fmtDate } from "@/lib/event-data";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => seo("Register Your Team — Circuit2Cloud Hardware Edition", "Register your 3–4 member college team for the Circuit2Cloud 2-Day National Hardware Build Challenge."),
  component: RegisterPage,
});

type Form = Record<string, string>;
const PERSON = [
  { k: "name", l: "Full Name", t: "text", ac: "name" },
  { k: "email", l: "Email", t: "email", ac: "email" },
  { k: "phone", l: "Phone Number", t: "tel", ac: "tel" },
  { k: "department", l: "Department", t: "text" },
  { k: "year", l: "Year / Semester", t: "text" },
  { k: "student_id", l: "Student ID", t: "text" },
] as const;
const STEPS = ["Team", "Leader", "Members", "Review"];

const req = (msg: string) => z.string().trim().min(1, msg).max(200, "Too long (max 200 characters).");
const email = z.string().trim().email("Enter a valid email address.").max(200);
const phone = z.string().trim().min(1, "Phone number is required.").regex(/^\+?[0-9 -]{7,20}$/, "Enter a valid phone number.");

function personSchema(prefix: string, who: string) {
  return {
    [`${prefix}_name`]: req(`${who} name is required.`),
    [`${prefix}_email`]: email,
    [`${prefix}_phone`]: phone,
    [`${prefix}_department`]: req(`${who} department is required.`),
    [`${prefix}_year`]: req(`${who} year / semester is required.`),
    [`${prefix}_student_id`]: req(`${who} student ID is required.`),
  };
}

function validate(step: number, f: Form): Record<string, string> {
  let shape: Record<string, z.ZodTypeAny> = {};
  if (step === 0) {
    shape = {
      team_name: req("Team name is required."),
      college: req("College / Institution is required."),
      department: req("Department is required."),
      team_size: z.enum(["3", "4"], { errorMap: () => ({ message: "Team must contain 3–4 members." }) }),
    };
  } else if (step === 1) shape = personSchema("leader", "Leader");
  else if (step === 2) {
    const n = Number(f.team_size);
    for (let i = 2; i <= n; i++) shape = { ...shape, ...personSchema(`member${i}`, `Member ${i}`) };
  }
  const r = z.object(shape).safeParse(f);
  if (r.success) return {};
  const e: Record<string, string> = {};
  r.error.issues.forEach((i) => (e[String(i.path[0])] ??= i.message));
  return e;
}

function Field({ id, label, value, onChange, error, type = "text", ac }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; ac?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} <span className="text-accent" aria-hidden>*</span></Label>
      <Input
        id={id}
        type={type}
        autoComplete={ac}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        required
        className={cn("h-12 bg-secondary/50 text-base", error && "border-destructive")}
      />
      {error && <p id={`${id}-err`} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function PersonFields({ prefix, f, set, errors }: { prefix: string; f: Form; set: (k: string, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PERSON.map((p) => {
        const k = `${prefix}_${p.k}`;
        return <Field key={k} id={k} label={p.l} type={p.t} ac={"ac" in p ? p.ac : undefined} value={f[k]} onChange={(v) => set(k, v)} error={errors[k]} />;
      })}
    </div>
  );
}

type Result = { team_id: string; team_name: string; college: string; status: string; created_at: string };

function RegisterPage() {
  const { data: s, isLoading } = useSettings();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>({ team_size: "3" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const next = () => {
    const e = validate(step, f);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    for (let i = 0; i < 3; i++) {
      const e = validate(i, f);
      if (Object.keys(e).length) { setErrors(e); setStep(i); return; }
    }
    setSubmitting(true);
    setSubmitErr(null);
    const payload: Form = { ...f };
    if (f.team_size === "3") PERSON.forEach((p) => delete payload[`member4_${p.k}`]);
    const { data, error } = await supabase.rpc("submit_registration", { p: payload });
    setSubmitting(false);
    if (error) {
      setSubmitErr(error.message || "Registration could not be completed. Please try again.");
      return;
    }
    setResult(data as unknown as Result);
    window.scrollTo({ top: 0 });
  };

  const download = () => {
    if (!result) return;
    const txt = `CIRCUIT2CLOUD — HARDWARE EDITION\nTeam Registration Confirmation\n\nTeam ID: ${result.team_id}\nTeam Name: ${result.team_name}\nCollege: ${result.college}\nStatus: ${result.status}\nRegistered: ${fmtDate(result.created_at)}\n`;
    const url = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.team_id}-confirmation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-2xl px-4 py-20">
          <div className="glass glow rounded-2xl p-8 text-center md:p-12">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/20"><Check className="size-8 text-success" /></div>
            <h1 className="mt-6 text-3xl font-bold md:text-4xl">🎉 TEAM REGISTRATION SUCCESSFUL</h1>
            <p className="mt-3 text-muted-foreground">Welcome to Circuit2Cloud — Hardware Edition.</p>
            <p className="eyebrow mt-8">Your Team ID</p>
            <p className="text-gradient font-mono text-4xl font-bold">{result.team_id}</p>
            <dl className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              {[["Team Name", result.team_name], ["College", result.college], ["Registration Status", result.status], ["Registration Date", fmtDate(result.created_at)]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-secondary/50 p-4"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">Please save your Team ID. No confirmation email is sent.</p>
            <div className="no-print mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="neon" onClick={download}><Download /> Download Confirmation</Button>
              <Button variant="neon" onClick={() => window.print()}><Printer /> Print Confirmation</Button>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  const closed = s?.registration_status === "CLOSED";
  const size = Number(f.team_size);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <p className="eyebrow">// Registration</p>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">REGISTER YOUR TEAM</h1>
        <div className="mt-6"><RegistrationStatus /></div>

        {isLoading ? <Skeleton className="mt-10 h-96" /> : closed ? (
          <div className="glass mt-10 rounded-xl border-destructive/50 p-8 text-center">
            <p className="font-display text-xl font-bold text-destructive">REGISTRATIONS CLOSED</p>
            <p className="mt-2 text-muted-foreground">Registrations for Circuit2Cloud are currently closed.</p>
            <Button asChild variant="neon" className="mt-6"><Link to="/announcements">See announcements</Link></Button>
          </div>
        ) : (
          <>
            <ol className="mt-10 grid grid-cols-4 gap-2" aria-label="Progress">
              {STEPS.map((t, i) => (
                <li key={t} aria-current={i === step ? "step" : undefined}>
                  <div className={cn("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-secondary")} />
                  <p className={cn("mt-2 font-mono text-xs uppercase tracking-widest", i === step ? "text-primary" : "text-muted-foreground")}>{i + 1}. {t}</p>
                </li>
              ))}
            </ol>

            <div className="glass mt-8 rounded-xl p-6 md:p-8">
              {step === 0 && (
                <fieldset className="space-y-4">
                  <legend className="mb-4 font-display text-xl font-bold">Team</legend>
                  <Field id="team_name" label="Team Name" value={f.team_name} onChange={(v) => set("team_name", v)} error={errors.team_name} />
                  <Field id="college" label="College / Institution" value={f.college} onChange={(v) => set("college", v)} error={errors.college} />
                  <Field id="department" label="Department" value={f.department} onChange={(v) => set("department", v)} error={errors.department} />
                  <div>
                    <p className="mb-2 text-sm font-medium">Team Size <span className="text-accent">*</span></p>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Team size">
                      {["3", "4"].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={f.team_size === n} onClick={() => set("team_size", n)}
                          className={cn("h-14 rounded-lg border font-display text-lg font-bold transition-all", f.team_size === n ? "border-primary bg-primary/15 text-primary glow" : "bg-secondary/40 hover:border-primary/50")}>
                          {n} Members
                        </button>
                      ))}
                    </div>
                    {errors.team_size && <p className="mt-1 text-sm text-destructive">{errors.team_size}</p>}
                  </div>
                </fieldset>
              )}
              {step === 1 && (
                <fieldset>
                  <legend className="mb-6 font-display text-xl font-bold">Team Leader</legend>
                  <PersonFields prefix="leader" f={f} set={set} errors={errors} />
                </fieldset>
              )}
              {step === 2 && (
                <div className="space-y-10">
                  {Array.from({ length: size - 1 }, (_, i) => i + 2).map((n) => (
                    <fieldset key={n}>
                      <legend className="mb-6 font-display text-xl font-bold">Member {n}</legend>
                      <PersonFields prefix={`member${n}`} f={f} set={set} errors={errors} />
                    </fieldset>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="font-display text-xl font-bold">Review</h2>
                  <ReviewBlock title="Team" onEdit={() => setStep(0)} rows={[["Team Name", f.team_name], ["College", f.college], ["Department", f.department], ["Team Size", f.team_size]]} />
                  <ReviewBlock title="Team Leader" onEdit={() => setStep(1)} rows={PERSON.map((p) => [p.l, f[`leader_${p.k}`]])} />
                  {Array.from({ length: size - 1 }, (_, i) => i + 2).map((n) => (
                    <ReviewBlock key={n} title={`Member ${n}`} onEdit={() => setStep(2)} rows={PERSON.map((p) => [p.l, f[`member${n}_${p.k}`]])} />
                  ))}
                  {submitErr && <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">Registration could not be completed. {submitErr}</p>}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <Button variant="ghost" size="xl" onClick={() => setStep(step - 1)} disabled={step === 0 || submitting}><ArrowLeft /> Back</Button>
                {step < 3 ? (
                  <Button variant="cta" size="xl" onClick={next}>Next <ArrowRight /></Button>
                ) : (
                  <Button variant="cta" size="xl" onClick={submit} disabled={submitting}>
                    {submitting ? <><Loader2 className="animate-spin" /> Submitting...</> : "Submit Registration"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </PublicLayout>
  );
}

function ReviewBlock({ title, rows, onEdit }: { title: string; rows: (string | undefined)[][]; onEdit: () => void }) {
  return (
    <div className="rounded-lg border bg-secondary/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-bold text-primary">{title}</h3>
        <Button variant="link" size="sm" onClick={onEdit}>Edit</Button>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>)}
      </dl>
    </div>
  );
}
