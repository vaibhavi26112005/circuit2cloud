import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/event-data";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data: s } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [r, a] = await Promise.all([
        supabase.from("registrations").select("status, created_at"),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
      ]);
      if (r.error) throw r.error;
      return { regs: r.data, ann: a.count ?? 0 };
    },
  });
  const regs = data?.regs ?? [];
  const stats = [
    { l: "Total Registrations", v: regs.length },
    { l: "Total Approved", v: regs.filter((r) => r.status === "APPROVED").length },
    { l: "Pending", v: regs.filter((r) => r.status === "SUBMITTED").length },
    { l: "Announcements", v: data?.ann ?? 0 },
    { l: "Registration Status", v: s?.registration_status ?? "—" },
  ];
  // last 14 days chart
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.getDate(), n: regs.filter((r) => r.created_at.slice(0, 10) === key).length };
  });
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div>
      <p className="eyebrow">Circuit2Cloud</p>
      <h1 className="mt-2 text-3xl font-bold">ADMIN CONTROL CENTER</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((x) => (
          <div key={x.l} className="glass rounded-xl p-5">
            <p className="eyebrow">{x.l}</p>
            {isLoading ? <Skeleton className="mt-3 h-9 w-20" /> : <p className="mt-2 font-display text-3xl font-bold">{x.v}</p>}
          </div>
        ))}
      </div>
      <div className="glass mt-6 rounded-xl p-6">
        <p className="eyebrow">Registrations — last 14 days</p>
        <div className="mt-6 flex h-40 items-end gap-2">
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-brand" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 4 : 1 }} title={`${d.n}`} />
              <span className="font-mono text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
