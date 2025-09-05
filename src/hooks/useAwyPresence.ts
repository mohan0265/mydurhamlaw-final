// src/hooks/useAwyPresence.ts
// AWY presence + waves + DB-backed call links (Supabase v2).
// Includes: linkLovedOneByEmail(email, relationship) to add first loved one from the widget.

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
    throw new Error(
      "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return createClient(url, anon);
}

export function useAwyPresence() {
  const supabaseRef = useRef<SupabaseClient>();
  if (!supabaseRef.current) supabaseRef.current = getClient();
  const supabase = supabaseRef.current;

  const [userId, setUserId] = useState<string | null>(null);

  // core state
  const [connections, setConnections] = useState<AwyConnection[]>([]);
  const [presence, setPresence] = useState<AwyPresence[]>([]);
  const [wavesUnread, setWavesUnread] = useState<number>(0);

  // DB-backed call links: { [loved_one_id]: url }
  const [callLinks, setCallLinks] = useState<Record<string, string>>({});

  // useful refs for diffing in the widget
  const wavesUnreadRef = useRef(0);
  useEffect(() => {
    wavesUnreadRef.current = wavesUnread;
  }, [wavesUnread]);

  const presenceByUser = useMemo(() => {
    const m = new Map<string, AwyPresence>();
    for (const p of presence) m.set(p.user_id, p);
    return m;
  }, [presence]);

  // resolve current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUserId(data.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // presence upsert + heartbeat loop
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
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
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
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("awy_connections")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setConnections(data as AwyConnection[]);
  }, [supabase, userId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // subscribe: presence + waves
  useEffect(() => {
    if (!userId) return;

    const refreshPresence = async () => {
      const { data, error } = await supabase
        .from("awy_visible_presence")
        .select("*");
      if (!error && data) setPresence(data as AwyPresence[]);
    };

    refreshPresence();

    const chPresence = supabase
      .channel("awy_presence_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_presence" },
        async () => {
          await refreshPresence();
        }
      )
      .subscribe();

    const chEvents = supabase
      .channel("awy_events_inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "awy_events",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          setWavesUnread((n) => n + 1);
        }
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
        {
          event: "*",
          schema: "public",
          table: "awy_call_links",
          filter: `owner_id=eq.${userId}`,
        },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      cancelled = true;
    };
  }, [supabase, userId]);

  // actions
  const sendWave = useCallback(
    async (receiverId: string) => {
      if (!userId) return { ok: false, error: "not_authenticated" };
      const { error } = await supabase.from("awy_events").insert({
        sender_id: userId,
        receiver_id: receiverId,
        kind: "wave",
        payload: {},
      });
      return { ok: !error, error: error?.message };
    },
    [supabase, userId]
  );

  // NEW: link loved one by email via RPC (created earlier)
  const linkLovedOneByEmail = useCallback(
    async (email: string, relationship: string) => {
      if (!userId) return { ok: false, error: "not_authenticated" };
      const { data, error } = await supabase.rpc("awy_link_loved_one", {
        p_email: email,
        p_relationship: relationship || "Loved One",
      });
      if (error) return { ok: false, error: error.message };
      if (!data?.ok) return { ok: false, error: data?.error || "link_failed" };
      await loadConnections(); // refresh the list so it appears immediately
      return { ok: true };
    },
    [supabase, userId, loadConnections]
  );

  return {
    userId,
    connections,
    presence,
    presenceByUser,
    wavesUnread,
    wavesUnreadRef, // for diffing in the widget (optional)
    reloadConnections: loadConnections,
    sendWave,
    callLinks, // DB-backed call URLs keyed by loved_one_id
    linkLovedOneByEmail, // <<<<<< expose to the widget
  };
}
