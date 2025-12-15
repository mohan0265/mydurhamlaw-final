// src/hooks/useAwyPresence.ts
//
// AWY presence + waves + DB-backed call links (Supabase v2).
// Defensive: no crashes if client or user context missing.
// Real-time presence/waves via Supabase subscriptions.
// All DB operations are RLS-safe (use authenticated Supabase client).

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

export type AwyStatus = "online" | "offline" | "busy";
export type AwyConnStatus = "pending" | "active" | "blocked";

export interface AwyConnection {
  id: string;
  student_id: string;
  loved_one_id: string | null; // can be null while 'pending'
  loved_is_user: boolean;
  relationship: string | null;
  status: AwyConnStatus;        // <-- added
  is_visible: boolean;
  created_at: string;
}

export interface AwyPresence {
  id: string;
  user_id: string;
  status: AwyStatus;
  status_message: string | null;
  last_seen: string;   // ISO
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
  ) => Promise<{ ok: boolean; status?: "active" | "pending"; error?: string }>;
  callLinks: Record<string, string>; // loved_one_id => URL
}

function emptyReturn(): UseAwyPresenceResult {
  // Construct a ref-like object without calling React hooks here.
  const wavesUnreadRef = { current: 0 } as React.MutableRefObject<number>;
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
  const client = getSupabaseClient();
  const [connections, setConnections] = useState<AwyConnection[]>([]);
  const [presence, setPresence] = useState<AwyPresence[]>([]);
  const [waves, setWaves] = useState<AwyWave[]>([]);
  const [callLinks, setCallLinks] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const wavesUnreadRef = useRef<number>(0);

  // Boot: who am I?
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
        "id,student_id,loved_one_id,loved_is_user,relationship,status,is_visible,created_at" // <-- status included
      )
      .or(`student_id.eq.${userId},loved_one_id.eq.${userId}`)
      .then(({ data, error }) => {
        if (data && !error) setConnections(data as AwyConnection[]);
        else setConnections([]);
      });
  }, [client, userId]);

  // Load connections once userId available
  useEffect(() => {
    if (!client || !userId) return;
    reloadConnections();
  }, [userId, reloadConnections]);

  // Live DB subscription for connections (listen for both roles)
  useEffect(() => {
    if (!client || !userId) return;

    const sub = client
      .channel(`connections_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_connections", filter: `student_id=eq.${userId}` },
        () => reloadConnections()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_connections", filter: `loved_one_id=eq.${userId}` },
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
    if (!client || !userId || connections.length === 0) {
      setPresence([]);
      return;
    }

    let canceled = false;

    const allUserIds = [
      userId,
      ...connections
        .map((c) => (userId === c.student_id ? c.loved_one_id : c.student_id))
        .filter((id): id is string => Boolean(id)),
    ];

    client
      .from("awy_presence")
      .select("*")
      .in("user_id", allUserIds)
      .then(({ data, error }) => {
        if (data && !error && !canceled) setPresence(data as AwyPresence[]);
      });

    const sub = client
      .channel(`presence_${userId}`)
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
            const newData = payload.new as Partial<AwyPresence> & { user_id?: string };
            const uid = newData?.user_id;
            if (!uid) return prev;

            const idx = prev.findIndex((p) => p.user_id === uid);
            if (idx >= 0) {
              const next = [...prev];
              const existing = next[idx];
              if (!existing) return prev; // TS-safe & defensive

              next[idx] = {
                id: (newData as any).id ?? existing.id ?? "",
                user_id: uid,
                status:
                  ((newData as any).status as AwyStatus | undefined) ??
                  existing.status ??
                  "offline",
                status_message:
                  (newData as any).status_message ?? existing.status_message ?? null,
                last_seen:
                  (newData as any).last_seen ?? existing.last_seen ?? new Date().toISOString(),
                heartbeat_at:
                  (newData as any).heartbeat_at ??
                  existing.heartbeat_at ??
                  new Date().toISOString(),
              };
              return next;
            }

            const added: AwyPresence = {
              id: (newData as any).id ?? "",
              user_id: uid,
              status: (((newData as any).status as AwyStatus) ?? "offline") as AwyStatus,
              status_message: (newData as any).status_message ?? null,
              last_seen: (newData as any).last_seen ?? new Date().toISOString(),
              heartbeat_at: (newData as any).heartbeat_at ?? new Date().toISOString(),
            };
            return [...prev, added];
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
    if (!client || !userId || connections.length === 0) {
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
          for (const row of data as any[]) {
            if (row.loved_one_id) rec[row.loved_one_id] = row.url ?? "";
          }
          setCallLinks(rec);
        } else {
          setCallLinks({});
        }
      });
  }, [client, userId, connections]);

  // Presence map for quick lookup
  const presenceByUser = useMemo(() => {
    const m = new Map<string, AwyPresence>();
    for (const p of presence) m.set(p.user_id, p);
    return m;
  }, [presence]);

  // Unread waves loader + subscription
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
        if (data && !error) setWaves(data as AwyWave[]);
      });

    const sub = client
      .channel(`waves_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "awy_waves", filter: `receiver_id=eq.${userId}` },
        (payload) => {
          setWaves((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as AwyWave, ...prev];
            } else if (payload.eventType === "UPDATE") {
              return prev.map((w) =>
                w.id === (payload.new as AwyWave).id ? { ...w, ...(payload.new as any) } : w
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

  // Link by email — returns { ok, status?: 'active' | 'pending' }
  const linkLovedOneByEmail = useCallback(
    async (email: string, relationship: string) => {
      if (!client || !userId) return { ok: false, error: "not_authenticated" };

      try {
        const { data, error } = await client.rpc("awy_link_loved_one_by_email", {
          p_email: email,
          p_relationship: relationship,
        });

        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("max_loved_ones_reached")) return { ok: false, error: "max_loved_ones_reached" };
          if (msg.includes("limit_reached")) return { ok: false, error: "limit_reached" }; // legacy phrasing just in case
          if (msg.includes("cannot_link_self")) return { ok: false, error: "cannot_link_self" };
          if (msg.includes("user_not_found")) return { ok: false, error: "user_not_found" };
          return { ok: false, error: error.message };
        }

        const status = (data?.status || "").toLowerCase() as "active" | "pending" | "";
        // Reload list in either case
        reloadConnections();

        return { ok: true, status: (status || undefined) as "active" | "pending" | undefined };
      } catch (err: any) {
        return { ok: false, error: String(err?.message || err) };
      }
    },
    [client, userId, reloadConnections]
  );

  return useMemo<UseAwyPresenceResult>(() => {
    if (!client) return emptyReturn();
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
