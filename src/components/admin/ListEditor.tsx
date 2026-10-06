import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export type Col = { k: string; l: string; type?: "text" | "number" | "day"; w?: string };
type Row = { id: string; sort_order: number } & Record<string, unknown>;

/** Generic inline editor for sortable admin lists. */
export function ListEditor({ table, rows, loading, cols, queryKey, blank, groupBy }: {
  table: "schedule_items" | "judging_criteria" | "special_awards";
  rows: Row[] | undefined; loading: boolean; cols: Col[]; queryKey: string[]; blank: Record<string, unknown>; groupBy?: string;
}) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey });
  const val = (r: Row, k: string) => (drafts[r.id]?.[k] ?? r[k] ?? "") as string | number;

  const run = async (key: string, fn: () => PromiseLike<{ error: unknown }>, ok?: string) => {
    setBusy(key);
    const { error } = await fn();
    setBusy(null);
    if (error) { toast.error("Something went wrong. Please try again."); return false; }
    if (ok) toast.success(ok);
    refresh();
    return true;
  };

  const save = (r: Row) => {
    const d = drafts[r.id];
    if (!d) return;
    for (const c of cols) if (c.k === "title" && !String(val(r, "title")).trim()) { toast.error("Title is required."); return; }
    run(r.id + "save", () => supabase.from(table).update(d as never).eq("id", r.id), "Saved").then((ok) => ok && setDrafts((x) => { const n = { ...x }; delete n[r.id]; return n; }));
  };

  const move = async (list: Row[], i: number, dir: -1 | 1) => {
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    setBusy("move");
    await supabase.from(table).update({ sort_order: b.sort_order } as never).eq("id", a.id);
    await supabase.from(table).update({ sort_order: a.sort_order === b.sort_order ? a.sort_order + dir : a.sort_order } as never).eq("id", b.id);
    setBusy(null);
    refresh();
  };

  const add = (extra: Record<string, unknown> = {}) => {
    const max = Math.max(0, ...(rows ?? []).map((r) => r.sort_order));
    run("add", () => supabase.from(table).insert({ ...blank, ...extra, sort_order: max + 1 } as never), "Added");
  };

  if (loading) return <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;

  const groups = groupBy ? [1, 2].map((g) => ({ g, list: (rows ?? []).filter((r) => r[groupBy] === g).sort((a, b) => a.sort_order - b.sort_order) })) : [{ g: 0, list: [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order) }];

  return (
    <div className="space-y-8">
      {groups.map(({ g, list }) => (
        <div key={g} className="glass rounded-xl p-4">
          {groupBy && <h2 className="mb-4 font-display text-lg font-bold text-primary">Day {g}</h2>}
          {!list.length && <p className="p-2 text-muted-foreground">Nothing here yet.</p>}
          <ul className="space-y-2">
            {list.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-secondary/30 p-2">
                <div className="flex flex-col">
                  <button aria-label="Move up" disabled={i === 0 || !!busy} onClick={() => move(list, i, -1)} className="disabled:opacity-30"><ArrowUp className="size-4" /></button>
                  <button aria-label="Move down" disabled={i === list.length - 1 || !!busy} onClick={() => move(list, i, 1)} className="disabled:opacity-30"><ArrowDown className="size-4" /></button>
                </div>
                {cols.map((c) => c.type === "day" ? (
                  <select key={c.k} aria-label={c.l} value={val(r, c.k)} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...drafts[r.id], [c.k]: Number(e.target.value) } })} className="h-9 rounded-md border bg-background px-2 text-sm">
                    <option value={1}>Day 1</option><option value={2}>Day 2</option>
                  </select>
                ) : (
                  <Input key={c.k} aria-label={c.l} placeholder={c.l} type={c.type === "number" ? "number" : "text"} min={0} value={val(r, c.k)}
                    onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...drafts[r.id], [c.k]: c.type === "number" ? Math.max(0, Number(e.target.value) || 0) : e.target.value || null } })}
                    className={c.w ?? "min-w-40 flex-1"} />
                ))}
                <Button size="sm" variant="neon" disabled={!drafts[r.id] || !!busy} onClick={() => save(r)}>{busy === r.id + "save" ? "Saving..." : "Save"}</Button>
                <Button size="icon" variant="ghost" aria-label="Delete" disabled={!!busy} onClick={() => confirm("Delete this item?") && run(r.id + "del", () => supabase.from(table).delete().eq("id", r.id), "Deleted")}><Trash2 className="text-destructive" /></Button>
              </li>
            ))}
          </ul>
          <Button className="mt-4" variant="ghost" disabled={!!busy} onClick={() => add(groupBy ? { [groupBy]: g } : {})}><Plus /> Add item</Button>
        </div>
      ))}
    </div>
  );
}
