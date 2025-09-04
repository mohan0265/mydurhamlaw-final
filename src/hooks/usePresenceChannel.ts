"use client";
import { useEffect, useRef } from "react";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export function usePresenceChannel(
  supabase: SupabaseClient | null,
  channelName: string,
  presenceKey: string,
  payload: Record<string, any>
) {
  const ref = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel(channelName, { config: { presence: { key: presenceKey } } });
    ref.current = ch;

    const sub = async () => {
      const status = await ch.subscribe((s) => {
        if (s === "SUBSCRIBED") {
          ch.track(payload).catch((e) => console.error("presence.track error", e));
        }
      });
      if (status !== "SUBSCRIBED") console.error("presence not subscribed:", status);
    };
    sub();

    return () => {
      try { ch.untrack(); } catch {}
      try { ch.unsubscribe(); } catch {}
    };
  }, [supabase, channelName, presenceKey, JSON.stringify(payload)]);
  return ref;
}
