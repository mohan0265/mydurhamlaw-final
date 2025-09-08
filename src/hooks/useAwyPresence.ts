// src/hooks/useAwyPresence.ts
//
// AWY presence + waves + DB-backed call links (Supabase v2).
// Defensive: no crashes if client or user context missing.
// Real-time presence/waves via Supabase subscriptions.
// All DB operations are RLS-safe (use authenticated Supabase client).

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

export type AwyStatus = "online" | "offline" | "busy";

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
  last_seen: string; // ISO
  heartbeat_at: string; // ISO
}

export interface AwyWave {
  id: string;
  sender_id: string;
  receiver_id: string;
  sent_at: string; // ISO
  read: boolean;
}

export interface UseAwyPresenceResult {
  userId: string | null;
  connections: AwyConnection[];
  presence: AwyPresence[];
  presenceByUser: Map<string, AwyPresence>;
  sendWave: (lovedOneId: string) => Promise<{ ok: boolean; error?: string }>;
  wavesUnread: number;
  wavesUnreadRef: React.MutableRefObject<number>;
  reloadConnections: () => void;
  linkLovedOneByEmail: (
    email: string,
    relationship: string
  ) => Promise<{ ok: boolean; error?: string }>;
  callLinks: Record<string, string>; // loved_one_id => URL
}

function emptyReturn(): UseAwyPresenceResult {
  const wavesUnreadRef = useRef<number>(0);
  return {
    userId: null,
    connections: [],
    presence: [],
    presenceByUser: new Map<string, AwyPresence>(),
    sendWave: async () => ({ ok: false }),
    wavesUnread: 0,
    wavesUnreadRef,
    reloadConnections: () => {},
    linkLovedOneByEmail: async () => ({ ok: false }),
    callLinks: {},
  };
}

// Utility: get current user ID from Supabase client (SSR-safe)
async function getCurrentUserId(client: SupabaseClient | null) {
  if (!client) return null;
  try {
    const { data } = await client.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function useAwyPresence(): UseAwyPresenceResult {
  const client = getSupabaseClient(); // SSR-safe hook
  const [connections, setConnections] = useState<AwyConnection[]>([]);
  const [presence, setPresence] = useState<AwyPresence[]>([]);
  const [waves, setWaves] = useState<AwyWave[]>([]);
  const [callLinks, setCallLinks] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const wavesUnreadRef = useRef<number>(0);

  // Defensive boot-up
  useEffect(() => {
    if (!client) return;
    getCurrentUserId(client).then(setUserId);
  }, [client]);

  // Load connections from DB (where user is student or loved one)
  const reloadConnections = useCallback(() => {
    if (!client || !userId) {
      setConnections([]);
      return;
    }
    client
      .from("awy_connections")
      .select(
        "id,student_id,loved_one_id,loved_is_user,relationship,is_visible,created_at"
      )
      .or(`student_id.eq.${userId},loved_one_id.eq.${userId}`)
      .then(({ data, error }) => {
        if (data && !error) setConnections(data);
        else setConnections([]);
      });
  }, [client, userId]);

  // Load connections once userId available
  useEffect(() => {
    if (!userId) return;
    reloadConnections();
  }, [userId, reloadConnections]);

  // Live DB subscription for connections
  useEffect(() => {
    if (!client || !userId) return;
    const sub = client
      .channel("connections")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "awy_connections",
          filter: `student_id=eq.${userId},loved_one_id=eq.${userId}`,
        },
        () => reloadConnections()
      )
      .subscribe();

    return () => {
      try {
        client.removeChannel(sub);
      } catch {}
    };
  }, [client, userId, reloadConnections]);

  // Load real-time presence for all loved ones in connections
  useEffect(() => {
    if (!client || !userId || !connections.length) {
      setPresence([]);
      return;
    }

    let canceled = false;

    const allUserIds = [
      userId,
      ...connections.map((c) =>
        userId === c.student_id ? c.loved_one_id : c.student_id
      ),
    ];
    client
      .from("awy_presence")
      .select("*")
      .in("user_id", allUserIds)
      .then(({ data, error }) => {
        if (data && !error && !canceled) setPresence(data);
      });

    const sub = client
      .channel("presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "awy_presence",
          filter: `user_id=in.(${allUserIds.join(",")})`,
        },
        (payload) => {
          setPresence((prev) => {
            const newData = payload.new as any;
            if (!newData?.user_id) return prev;

            const idx = prev.findIndex((p) => p.user_id === newData.user_id);
            if (idx >= 0) {
              const next = [...prev];
              const existingItem = next[idx];
              next[idx] = {
                id: newData.id || existingItem?.id || "",
                user_id: newData.user_id || existingItem?.user_id || "",
                status: newData.status || existingItem?.status || "offline",
                status_message:
                  newData.status_message ?? existingItem?.status_message ?? null,
                last_seen:
                  newData.last_seen ||
                  existingItem?.last_seen ||
                  new Date().toISOString(),
                heartbeat_at:
                  newData.heartbeat_at ||
                  existingItem?.heartbeat_at ||
                  new Date().toISOString(),
              };
              return next;
            }
            const newPresence: AwyPresence = {
              id: newData.id || "",
              user_id: newData.user_id || "",
              status: newData.status || "offline",
              status_message: newData.status_message ?? null,
              last_seen: newData.last_seen || new Date().toISOString(),
              heartbeat_at: newData.heartbeat_at || new Date().toISOString(),
            };
            return [...prev, newPresence];
          });
        }
      )
      .subscribe();

    return () => {
      canceled = true;
      try {
        client.removeChannel(sub);
      } catch {}
    };
  }, [client, userId, connections]);

  // Map loved_one_id -> call URL (for widget)
  useEffect(() => {
    if (!client || !userId || !connections.length) {
      setCallLinks({});
      return;
    }
    client
      .from("awy_call_links")
      .select("loved_one_id,url,owner_id")
      .eq("owner_id", userId)
      .then(({ data, error }) => {
        if (data && !error) {
          const rec: Record<string, string> = {};
          for (const row of data) rec[row.loved_one_id] = row.url ?? "";
          setCallLinks(rec);
        }
      });
  }, [client, userId, connections]);

  // Presence: mapped by user for quick lookup
  const presenceByUser = useMemo(() => {
    const m = new Map<string, AwyPresence>();
    for (const p of presence) m.set(p.user_id, p);
    return m;
  }, [presence]);

  // Load unread waves (where receiver_id is user)
  useEffect(() => {
    if (!client || !userId) {
      setWaves([]);
      return;
    }
    client
      .from("awy_waves")
      .select("*")
      .eq("receiver_id", userId)
      .eq("read", false)
      .order("sent_at", { ascending: false })
      .then(({ data, error }) => {
        if (data && !error) setWaves(data);
      });

    const sub = client
      .channel("waves")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "awy_waves",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          setWaves((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as AwyWave, ...prev];
            } else if (payload.eventType === "UPDATE") {
              return prev.map((w) =>
                w.id === (payload.new as AwyWave).id
                  ? { ...w, ...payload.new }
                  : w
              );
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      try {
        client.removeChannel(sub);
      } catch {}
    };
  }, [client, userId]);

  // Unread waves count
  const wavesUnread = useMemo(() => {
    const count = waves.filter((w) => !w.read).length;
    wavesUnreadRef.current = count;
    return count;
  }, [waves]);
  wavesUnreadRef.current = wavesUnread;

  // Actions
  const sendWave = useCallback(
    async (lovedOneId: string) => {
      if (!client || !userId) return { ok: false, error: "not_authenticated" };
      const { error } = await client.from("awy_waves").insert({
        sender_id: userId,
        receiver_id: lovedOneId,
        sent_at: new Date().toISOString(),
        read: false,
      });
      if (!error) return { ok: true };
      return { ok: false, error: error.message };
    },
    [client, userId]
  );

  // Link by email — **send the parameter names your function expects**
  const linkLovedOneByEmail = useCallback(
    async (email: string, relationship: string) => {
      if (!client || !userId) return { ok: false, error: "not_authenticated" };
      const { error } = await client.rpc("awy_link_loved_one_by_email", {
        p_email: email,
        p_relationship: relationship,
      });
      if (!error) return { ok: true };
      return { ok: false, error: error.message };
    },
    [client, userId]
  );

  return useMemo<UseAwyPresenceResult>(() => {
    return {
      userId,
      connections,
      presence,
      presenceByUser,
      sendWave,
      wavesUnread,
      wavesUnreadRef,
      reloadConnections,
      linkLovedOneByEmail,
      callLinks,
    };
  }, [
    userId,
    connections,
    presence,
    presenceByUser,
    sendWave,
    wavesUnread,
    reloadConnections,
    linkLovedOneByEmail,
    callLinks,
  ]);
}
