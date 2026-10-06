import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = { loading: boolean; session: Session | null; isAdmin: boolean };

async function checkAdmin(uid: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return !!data;
}

export function useAdmin(): AdminState {
  const [st, setSt] = useState<AdminState>({ loading: true, session: null, isAdmin: false });
  useEffect(() => {
    let alive = true;
    const run = async (session: Session | null) => {
      if (!session) return alive && setSt({ loading: false, session: null, isAdmin: false });
      const isAdmin = await checkAdmin(session.user.id);
      if (alive) setSt({ loading: false, session, isAdmin });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => run(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => run(data.session));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return st;
}
