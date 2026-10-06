import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type EventSettings = T["event_settings"]["Row"];
export type Announcement = T["announcements"]["Row"];
export type ScheduleItem = T["schedule_items"]["Row"];
export type Criterion = T["judging_criteria"]["Row"];
export type Award = T["special_awards"]["Row"];
export type Registration = T["registrations"]["Row"];

export const TBA = "To Be Announced";

/** Subscribe to realtime changes on a table and invalidate the given query. */
export function useLive(table: string, key: readonly unknown[]) {
  const qc = useQueryClient();
  const k = JSON.stringify(key);
  useEffect(() => {
    const ch = supabase
      .channel(`live-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, k, qc]);
}

export function useSettings() {
  useLive("event_settings", ["settings"]);
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function usePublicAnnouncements() {
  useLive("announcements", ["announcements", "public"]);
  return useQuery({
    queryKey: ["announcements", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("status", "PUBLISHED")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useSchedule() {
  useLive("schedule_items", ["schedule"]);
  return useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_items")
        .select("*")
        .order("day")
        .order("sort_order")
        .order("time");
      if (error) throw error;
      return data;
    },
  });
}

export function useCriteria() {
  useLive("judging_criteria", ["criteria"]);
  return useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const { data, error } = await supabase.from("judging_criteria").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useAwards() {
  useLive("special_awards", ["awards"]);
  return useQuery({
    queryKey: ["awards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("special_awards").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
