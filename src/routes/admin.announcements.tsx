import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, type Announcement } from "@/lib/event-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/announcements")({ component: Ann });

type Draft = { id?: string; title: string; message: string; type: string; is_pinned: boolean };
const empty: Draft = { title: "", message: "", type: "NORMAL", is_pinned: false };

function Ann() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!edit) return;
    if (!edit.title.trim() || !edit.message.trim()) { setErr("Title and message are required."); return; }
    setBusy(status);
    const row = { title: edit.title.trim().slice(0, 200), message: edit.message.trim().slice(0, 4000), type: edit.type, is_pinned: edit.is_pinned, status };
    const { error } = edit.id ? await supabase.from("announcements").update(row).eq("id", edit.id) : await supabase.from("announcements").insert(row);
    setBusy(null);
    if (error) { setErr("Something went wrong. Please try again."); return; }
    toast.success(status === "PUBLISHED" ? "Published" : "Draft saved");
    setEdit(null);
    refresh();
  };

  const patch = async (a: Announcement, p: Partial<Announcement>, label: string) => {
    setBusy(a.id + label);
    const { error } = await supabase.from("announcements").update(p).eq("id", a.id);
    setBusy(null);
    if (error) { toast.error("Something went wrong. Please try again."); return; }
    refresh();
  };
  const del = async (a: Announcement) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    setBusy(a.id + "del");
    const { error } = await supabase.from("announcements").delete().eq("id", a.id);
    setBusy(null);
    if (error) { toast.error("Something went wrong. Please try again."); return; }
    toast.success("Deleted");
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">ANNOUNCEMENT CENTER</h1>
        <Button variant="cta" onClick={() => { setErr(null); setEdit(empty); }}><Plus /> Create Announcement</Button>
      </div>
      <div className="glass mt-6 overflow-x-auto rounded-xl">
        {isLoading ? <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> :
          !data?.length ? <p className="p-6 text-muted-foreground">No announcements yet.</p> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left font-mono text-xs uppercase text-muted-foreground">
              <tr>{["Title", "Type", "Status", "Pinned", "Created", "Last Updated", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3"><span className={cn("font-mono text-xs", a.type === "IMPORTANT" && "text-destructive")}>{a.type}</span></td>
                  <td className="px-4 py-3"><span className={cn("font-mono text-xs", a.status === "PUBLISHED" ? "text-success" : "text-muted-foreground")}>{a.status}</span></td>
                  <td className="px-4 py-3">{a.is_pinned ? "Yes" : "No"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(a.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(a.updated_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => { setErr(null); setEdit({ id: a.id, title: a.title, message: a.message, type: a.type, is_pinned: a.is_pinned }); }}>Edit</Button>
                    {a.status === "PUBLISHED"
                      ? <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => patch(a, { status: "DRAFT" }, "pub")}>Unpublish</Button>
                      : <Button size="sm" variant="ghost" className="text-success" disabled={!!busy} onClick={() => patch(a, { status: "PUBLISHED" }, "pub")}>{busy === a.id + "pub" ? "Publishing..." : "Publish"}</Button>}
                    <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => patch(a, { is_pinned: !a.is_pinned }, "pin")}>{a.is_pinned ? "Unpin" : "Pin"}</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={!!busy} onClick={() => del(a)}>{busy === a.id + "del" ? "Deleting..." : "Delete"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit announcement" : "Create announcement"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="t">Title *</Label><Input id="t" maxLength={200} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="m">Message *</Label><Textarea id="m" rows={5} maxLength={4000} value={edit.message} onChange={(e) => setEdit({ ...edit, message: e.target.value })} /></div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2"><Switch id="imp" checked={edit.type === "IMPORTANT"} onCheckedChange={(c) => setEdit({ ...edit, type: c ? "IMPORTANT" : "NORMAL" })} /><Label htmlFor="imp">Important</Label></div>
                <div className="flex items-center gap-2"><Switch id="pin" checked={edit.is_pinned} onCheckedChange={(c) => setEdit({ ...edit, is_pinned: c })} /><Label htmlFor="pin">Pinned</Label></div>
              </div>
              {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={!!busy} onClick={() => save("DRAFT")}>{busy === "DRAFT" ? "Saving..." : "Save Draft"}</Button>
                <Button variant="cta" disabled={!!busy} onClick={() => save("PUBLISHED")}>{busy === "PUBLISHED" ? "Publishing..." : "Publish"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
