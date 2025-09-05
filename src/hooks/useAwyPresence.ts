// src/hooks/useAwyPresence.ts
// Presence + events + connections for AWY (Supabase v2).
// Standalone: uses env-based client so it won’t fight your providers.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type AwyStatus = "online" | "offline" | "busy";

export interface AwyConnection {
  id: string;
  student_id: string;
  loved_one_id: string;
  loved_is_user: boolean;
  relationship: string;
  is_visible: boolean;
  created_at: string;
}

export interface AwyPresence {
  id: string;
  user_id: string;
  status: AwyStatus;
  status_message: string | null;
  last_seen: string;    // ISO
  heartbeat_at: string; // ISO
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    throw new Error("Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
  return createClient(url, anon);
}

export function useAwyPresence() {
  const supabaseRef = useRef<SupabaseClient>();
  if (!supabaseRef.current) supabaseRef.current = getClient();
  const supabase = supabaseRef.current;

  const [userId, setUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<AwyConnection[]>([]);
  const [presence, setPresence] = useState<AwyPresence[]>([]);
  const [wavesUnread, setWavesUnread] = useState<number>(0);

  const presenceByUser = useMemo(() => {
    const m = new Map<string, AwyPresence>();
    for (const p of presence) m.set(p.user_id, p);
    return m;
  }, [presence]);

  // Resolve current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUserId(data.user?.id ?? null);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // Presence upsert + heartbeat loop
  useEffect(() => {
    if (!userId) return;

    let timer: any;

    const upsertOnline = async () => {
      try {
        await supabase.rpc("awy_upsert_presence", {
          p_status: "online",
          p_message: null,
        });
      } catch {}
    };

    const heartbeat = async () => {
      try {
        await supabase.rpc("awy_heartbeat");
      } catch {}
    };

    const start = async () => {
      await upsertOnline();
      timer = setInterval(heartbeat, 50_000); // ~50s
    };

    const onVisibility = async () => {
      if (document.visibilityState === "visible") {
        await heartbeat();
        if (!timer) timer = setInterval(heartbeat, 50_000);
      } else {
        if (timer) { clearInterval(timer); timer = null; }
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) clearInterval(timer);
    };
  }, [supabase, userId]);

  // Load my connections
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("awy_connections")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setConnections(data as AwyConnection[]);
  }, [supabase, userId]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // Subscribe: presence + waves
  useEffect(() => {
    if (!userId) return;

    const refreshPresence = async () => {
      const { data, error } = await supabase
        .from("awy_visible_presence")
        .select("*");
      if (!error && data) setPresence(data as AwyPresence[]);
    };

    refreshPresence();

    const chPresence = supabase.channel("awy_presence_changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "awy_presence" },
        async () => {
          await refreshPresence();
        })
      .subscribe();

    const chEvents = supabase.channel("awy_events_inbox")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "awy_events",
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        setWavesUnread((n) => n + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chPresence);
      supabase.removeChannel(chEvents);
    };
  }, [supabase, userId]);

  // Actions
  const sendWave = useCallback(async (receiverId: string) => {
    if (!userId) return { ok: false, error: "not_authenticated" };
    const { error } = await supabase.from("awy_events").insert({
      sender_id: userId,
      receiver_id: receiverId,
      kind: "wave",
      payload: {},
    });
    return { ok: !error, error: error?.message };
  }, [supabase, userId]);

  return {
    userId,
    connections,
    presence,
    presenceByUser,
    wavesUnread,
    reloadConnections: loadConnections,
    sendWave,
  };
}
