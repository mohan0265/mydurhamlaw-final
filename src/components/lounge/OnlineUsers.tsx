"use client";
import React, { useEffect, useState } from "react";
import { useSupabaseClient } from "@/contexts/SupabaseProvider";
import { usePresenceChannel } from "@/hooks/usePresenceChannel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function OnlineUsers({ user = { id: "demo", name: "Guest" } }) {
  const supabase = useSupabaseClient();
  const [peers, setPeers] = useState<any[]>([]);
  if (!supabase) return <Card><CardHeader><CardTitle>Online now</CardTitle></CardHeader><CardContent>Backend not connected.</CardContent></Card>;

  const chRef = usePresenceChannel(supabase, "realtime:lounge-presence", String(user.id), {
    user_id: user.id, username: user.name || "Guest",
  });

  useEffect(() => {
    const ch = chRef.current;
    if (!ch) return;
    const off = ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const list = Object.values(state).flat() as any[];
      setPeers(list);
    });
    return () => { ch.off("presence", { event: "sync" }); };
  }, [chRef.current]);

  return (
    <Card>
      <CardHeader><CardTitle>Online now</CardTitle></CardHeader>
      <CardContent>{peers.length ? peers.map((p,i)=> <div key={i}>{p.username}</div>) : "No one online yet."}</CardContent>
    </Card>
  );
}