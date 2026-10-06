import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/account")({ component: Page });

function Page() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">ADMIN SETTINGS</h1>
      <form onSubmit={save} className="glass mt-6 max-w-md space-y-4 rounded-xl p-6">
        <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button type="submit" variant="cta" disabled={busy}>{busy ? "Saving..." : "Update password"}</Button>
      </form>
    </div>
  );
}
