import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, type EventSettings } from "@/lib/event-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

const FIELDS: { k: keyof EventSettings; l: string; area?: boolean; ph?: string }[] = [
  { k: "event_name", l: "Event Name" },
  { k: "tagline", l: "Event Tagline" },
  { k: "description", l: "Description", area: true },
  { k: "event_date", l: "Event Date", ph: "e.g. 24–25 October 2026 (blank = To Be Announced)" },
  { k: "venue", l: "Event Venue", ph: "Blank = To Be Announced" },
  { k: "registration_deadline", l: "Registration Deadline", ph: "e.g. 12 October 2026" },
  { k: "contact_name", l: "Contact Name" },
  { k: "contact_phone", l: "Contact Phone" },
  { k: "contact_email", l: "Contact Email" },
  { k: "organization", l: "Organizing Institution" },
  { k: "organizer_name", l: "Organizer Name" },
  { k: "sponsors", l: "Sponsor Information", area: true },
];

function SettingsPage() {
  const { data, isLoading } = useSettings();
  const qc = useQueryClient();
  const [f, setF] = useState<Partial<EventSettings>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF(data); }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.contact_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contact_email)) return toast.error("Enter a valid email address.");
    setBusy(true);
    const row: Record<string, string | null> = {};
    FIELDS.forEach(({ k }) => { const v = (f[k] as string | null | undefined)?.toString().trim(); row[k] = v ? v.slice(0, 2000) : null; });
    row.event_name ||= "CIRCUIT2CLOUD";
    row.tagline ||= "Diagnose. Design. Build. Prove.";
    row.description ||= "";
    const { error } = await supabase.from("event_settings").update({ ...row, registration_status: f.registration_status } as never).eq("id", 1);
    setBusy(false);
    if (error) return toast.error("Something went wrong. Please try again.");
    toast.success("Settings saved — live on the public site");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  if (isLoading) return <Skeleton className="h-96" />;
  return (
    <form onSubmit={save} className="max-w-3xl">
      <h1 className="text-3xl font-bold">EVENT SETTINGS</h1>
      <div className="glass mt-6 space-y-5 rounded-xl p-6">
        <div>
          <p className="mb-2 text-sm font-medium">Registration Status</p>
          <div className="grid grid-cols-3 gap-2">
            {["OPEN", "CLOSING SOON", "CLOSED"].map((s) => (
              <button type="button" key={s} onClick={() => setF({ ...f, registration_status: s })}
                className={cn("h-11 rounded-md border font-mono text-xs", f.registration_status === s ? "border-primary bg-primary/15 text-primary" : "hover:border-primary/50")}>{s}</button>
            ))}
          </div>
        </div>
        {FIELDS.map(({ k, l, area, ph }) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{l}</Label>
            {area
              ? <Textarea id={k} value={(f[k] as string) ?? ""} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              : <Input id={k} value={(f[k] as string) ?? ""} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
          </div>
        ))}
        <Button type="submit" variant="cta" disabled={busy}>{busy ? "Saving..." : "Save Settings"}</Button>
      </div>
    </form>
  );
}
