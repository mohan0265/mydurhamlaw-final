// src/hooks/useAwyPresence.ts
// AWY presence + waves + DB-backed call links (Supabase v2).
// Uses the shared client (getSupabaseClient) and is fully defensive (no crashes if client is missing).

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

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

// A no-op return so the UI never crashes if client is unavailable
function emptyReturn() {
  const wavesUnreadRef = { current: 0 } as React.MutableRefObject<number>;
  return {
    userId: null as string | null,
    connections: [] as AwyConnection[],
    presence: [] as AwyPresence[],
    presenceByUser: new Map<string, AwyPresence>(),
    wavesUnread: 0,
    wavesUnreadRef,
    reloadConnections: async () => {},
    sendWave: async (_: string) => ({ ok: false, error: "offline" as const }),
    callLinks: {} as Record<string, string>,
    linkLovedOneByEmail: async (_e: string, _r: string) =>
      ({ ok: false, error: "offline" as const }),
  };
}

export function useAwyPresence() {
  // May temporarily be undefined if something is still initializing
  const supabase = getSupabaseClient() as SupabaseClient | undefined;

  // If client is not available, expose safe no-ops (prevents hard crash)
  if (!supabase) {
    return emptyReturn();
  }

  const [userId, setUserId] = useState<string | null>(null);

  const [connections, setConnections] = useState<AwyConnection[]>([]);
  const [presence, setPresence] = useState<AwyPresence[]>([]);
  const [wavesUnread, setWavesUnread] = useState<number>(0);
  const [callLinks, setCallLinks] = useState<Record<string, string>>({});

  const wavesUnreadRef = useRef(0);
  useEffect(() => { wavesUnreadRef.current = wavesUnread; }, [wavesUnread]);

  const presenceByUser = useMemo(() => {
    const m = new Map<string, AwyPresence>();
    for (const p of presence) m.set(p.user_id, p);
    return m;
  }, [presence]);

  // Resolve current user + subscribe to auth changes
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setUserId(session?.user?.id ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => { unsub?.(); };
  }, [supabase]);

  // presence upsert + heartbeat loop
  useEffect(() => {
    if (!userId) return;

    let timer: any;

    const upsertOnline = async () => {
      try {
        await supabase.rpc("awy_upsert_presence", { p_status: "online", p_message: null });
      } catch {}
    };
    const heartbeat = async () => {
      try { await supabase.rpc("awy_heartbeat"); } catch {}
    };

    const start = async () => {
      await upsertOnline();
      timer = setInterval(heartbeat, 50_000);
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

  // load my connections (student -> loved ones)
  const reloadConnections = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("awy_connections")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setConnections(data as AwyConnection[]);
  }, [supabase, userId]);

  useEffect(() => { reloadConnections(); }, [reloadConnections]);

  // subscribe: presence + waves
  useEffect(() => {
    if (!userId) return;

    const refreshPresence = async () => {
      const { data, error } = await supabase.from("awy_visible_presence").select("*");
      if (!error && data) setPresence(data as AwyPresence[]);
    };

    refreshPresence();

    const chPresence = supabase
      .channel("awy_presence_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_presence" },
        refreshPresence
      )
      .subscribe();

    const chEvents = supabase
      .channel("awy_events_inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "awy_events", filter: `receiver_id=eq.${userId}` },
        () => setWavesUnread((n) => n + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chPresence);
      supabase.removeChannel(chEvents);
    };
  }, [supabase, userId]);

  // load + live-refresh call links owned by me
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("awy_call_links")
        .select("loved_one_id,url")
        .eq("owner_id", userId);
      if (!error && data && !cancelled) {
        const map: Record<string, string> = {};
        for (const row of data) map[row.loved_one_id] = row.url ?? "";
        setCallLinks(map);
      }
    };

    load();

    const ch = supabase
      .channel("awy_call_links_owner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_call_links", filter: `owner_id=eq.${userId}` },
        load
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); cancelled = true; };
  }, [supabase, userId]);

  // actions
  const sendWave = useCallback(
    async (receiverId: string) => {
      if (!userId) return { ok: false, error: "not_authenticated" as const };
      const { error } = await supabase.from("awy_events").insert({
        sender_id: userId,
        receiver_id: receiverId,
        kind: "wave",
        payload: {},
      });
      return { ok: !error, error: (error?.message ?? undefined) as any };
    },
    [supabase, userId]
  );

  // RPC to link loved one by email (created earlier)
  const linkLovedOneByEmail = useCallback(
    async (email: string, relationship: string) => {
      if (!userId) return { ok: false, error: "not_authenticated" as const };
      const { data, error } = await supabase.rpc("awy_link_loved_one", {
        p_email: email,
        p_relationship: relationship || "Loved One",
      });
      if (error) return { ok: false, error: error.message };
      if (!data?.ok) return { ok: false, error: (data?.error || "link_failed") as any };
      await reloadConnections();
      return { ok: true };
    },
    [supabase, userId, reloadConnections]
  );

  return {
    userId,
    connections,
    presence,
    presenceByUser,
    wavesUnread,
    wavesUnreadRef,
    reloadConnections,
    sendWave,
    callLinks,
    linkLovedOneByEmail,
  };
}
