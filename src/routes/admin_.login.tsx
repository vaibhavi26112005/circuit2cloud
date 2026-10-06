import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Cpu, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({ meta: [{ title: "Admin Login — Circuit2Cloud" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const { loading, session, isAdmin } = useAdmin();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => setHasAdmin(!!data));
  }, []);

  // Signed in but not admin: if no admin exists yet, claim first-admin.
  useEffect(() => {
    if (loading || !session) return;
    if (isAdmin) { nav({ to: "/admin" }); return; }
    if (hasAdmin === false) {
      supabase.rpc("claim_first_admin", { _name: name || session.user.email || "Admin" }).then(({ data }) => {
        if (data) window.location.href = "/admin";
      });
    }
  }, [loading, session, isAdmin, hasAdmin, nav, name]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr("Invalid email or password.");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin/login`, data: { name } } });
      if (error) setErr(error.message);
      else if (!data.session) toast.success("Check your inbox to confirm your email, then log in here.");
    }
    setBusy(false);
  };

  const notAdmin = !loading && session && !isAdmin && hasAdmin;

  return (
    <main className="tech-grid flex min-h-screen items-center justify-center px-4">
      <div className="glass glow w-full max-w-md rounded-2xl p-8">
        <div className="flex items-center gap-2 font-display text-lg font-bold"><Cpu className="text-primary" /> CIRCUIT2CLOUD</div>
        <h1 className="mt-6 text-2xl font-bold">{mode === "login" ? "ADMIN LOGIN" : "CREATE FIRST ADMIN"}</h1>
        {notAdmin ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">This account doesn't have admin access.</p>
            <Button variant="neon" onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "setup" && (
              <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" /></div>
            )}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" /></div>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <Button type="submit" variant="cta" size="xl" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : mode === "login" ? "Login" : "Create account"}
            </Button>
            {hasAdmin === false && (
              <button type="button" className="w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "login" ? "setup" : "login")}>
                {mode === "login" ? "No admin yet? Create the first admin account" : "Back to login"}
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
