import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/export")({ component: Page });

const COLS = ["team_id", "team_name", "college", "department", "team_size",
  "leader_name", "leader_email", "leader_phone", "leader_department", "leader_year", "leader_student_id",
  ...[2, 3, 4].flatMap((n) => ["name", "email", "phone", "department", "year", "student_id"].map((k) => `member${n}_${k}`)),
  "status", "created_at"];

const esc = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // guard against spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

function Page() {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const { data, error } = await supabase.from("registrations").select("*").order("created_at");
    setBusy(false);
    if (error) return toast.error("Something went wrong. Please try again.");
    if (!data.length) return toast.info("No registrations found.");
    const csv = [COLS.join(","), ...data.map((r) => COLS.map((c) => esc((r as Record<string, unknown>)[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `circuit2cloud-registrations-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">EXPORT DATA</h1>
      <div className="glass mt-6 max-w-xl rounded-xl p-6">
        <p className="text-muted-foreground">Download every registration with team, leader and member details, status and registration date.</p>
        <Button variant="cta" size="xl" className="mt-6" onClick={run} disabled={busy}><Download /> {busy ? "Exporting..." : "Export CSV"}</Button>
      </div>
    </div>
  );
}
