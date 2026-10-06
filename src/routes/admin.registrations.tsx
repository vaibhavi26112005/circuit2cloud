import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, type Registration } from "@/lib/event-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/registrations")({ component: Regs });

const FILTERS = ["ALL", "SUBMITTED", "APPROVED", "REJECTED"] as const;

export function StatusPill({ s }: { s: string }) {
  return (
    <span className={cn("rounded px-2 py-0.5 font-mono text-xs",
      s === "APPROVED" ? "bg-success/20 text-success" : s === "REJECTED" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning")}>{s}</span>
  );
}

function Regs() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("ALL");
  const [view, setView] = useState<Registration | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter((r) => (f === "ALL" || r.status === f) &&
    [r.team_id, r.team_name, r.college, r.leader_name].some((x) => x.toLowerCase().includes(q.toLowerCase())));

  const setStatus = async (id: string, status: string) => {
    setBusy(id + status);
    const { error } = await supabase.from("registrations").update({ status }).eq("id", id);
    setBusy(null);
    if (error) { toast.error("Something went wrong. Please try again."); return; }
    toast.success(`Registration ${status.toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["admin"] });
    setView((v) => (v && v.id === id ? { ...v, status } : v));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">REGISTRATIONS</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <Input placeholder="Search Team ID, team, college, leader…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 max-w-sm" aria-label="Search registrations" />
        <div className="flex gap-1">
          {FILTERS.map((x) => <Button key={x} size="sm" variant={f === x ? "default" : "ghost"} onClick={() => setF(x)}>{x === "ALL" ? "All" : x[0] + x.slice(1).toLowerCase()}</Button>)}
        </div>
      </div>
      <div className="glass mt-6 overflow-x-auto rounded-xl">
        {isLoading ? <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div> :
          error ? <p className="p-6 text-destructive">Something went wrong. Please try again.</p> :
          !list.length ? <p className="p-6 text-muted-foreground">No registrations found.</p> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left font-mono text-xs uppercase text-muted-foreground">
              <tr>{["Team ID", "Team Name", "College", "Size", "Leader", "Phone", "Status", "Registered On", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono">{r.team_id}</td>
                  <td className="px-4 py-3">{r.team_name}</td>
                  <td className="px-4 py-3">{r.college}</td>
                  <td className="px-4 py-3">{r.team_size}</td>
                  <td className="px-4 py-3">{r.leader_name}</td>
                  <td className="px-4 py-3">{r.leader_phone}</td>
                  <td className="px-4 py-3"><StatusPill s={r.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(r.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => setView(r)}>View</Button>
                    <Button size="sm" variant="ghost" className="text-success" disabled={!!busy || r.status === "APPROVED"} onClick={() => setStatus(r.id, "APPROVED")}>Approve</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={!!busy || r.status === "REJECTED"} onClick={() => setStatus(r.id, "REJECTED")}>Reject</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {view && (
            <>
              <DialogHeader><DialogTitle>{view.team_id} — {view.team_name}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <p><StatusPill s={view.status} /> · {view.college} · {view.department} · {view.team_size} members · {fmtDate(view.created_at)}</p>
                {(["leader", "member2", "member3", "member4"] as const).map((p, i) => {
                  const g = (k: string) => (view as Record<string, unknown>)[`${p}_${k}`] as string | null;
                  if (!g("name")) return null;
                  return (
                    <div key={p} className="rounded-lg border p-3">
                      <p className="font-display font-bold text-primary">{i === 0 ? "Leader" : `Member ${i + 1}`}</p>
                      <p>{g("name")} · {g("email")} · {g("phone")}</p>
                      <p className="text-muted-foreground">{g("department")} · {g("year")} · ID {g("student_id")}</p>
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <Button variant="success" disabled={!!busy} onClick={() => setStatus(view.id, "APPROVED")}>Approve</Button>
                  <Button variant="destructive" disabled={!!busy} onClick={() => setStatus(view.id, "REJECTED")}>Reject</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
