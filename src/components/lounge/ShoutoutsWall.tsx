"use client";
import React, { useEffect, useState } from "react";
import { useSupabaseClient } from "@/contexts/SupabaseProvider";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Kudos = { id: string; username: string; message: string; created_at: string };

export default function ShoutoutsWall({ user = { id: "demo", name: "Guest" } }) {
  const supabase = useSupabaseClient();
  const [items, setItems] = useState<Kudos[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.from("lounge_shoutouts").select("*").order("created_at", { ascending: true }).then(({ data, error }) => {
      if (error) { console.error(error); return; }
      if (active && data) setItems(data as Kudos[]);
    });
    const ch = supabase.channel("realtime:lounge_shoutouts")
      .on("postgres_changes", { event: "*", schema: "public", table: "lounge_shoutouts" },
        (payload: any) => setItems((prev) => [...prev, payload.new as Kudos]))
      .subscribe();
    return () => { active = false; ch.unsubscribe(); };
  }, [supabase]);

  async function send() {
    if (!text.trim()) return;
    const result = await supabase?.from("lounge_shoutouts").insert({
      username: user.name || "Guest", message: text,
    });
    if (result?.error) console.error(result.error);
    setText("");
  }

  if (!supabase) {
    return (
      <Card>
        <CardHeader><CardTitle>Shoutouts</CardTitle></CardHeader>
        <CardContent>Backend not connected.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Shoutouts Wall</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.map((k)=> <div key={k.id}><b>{k.username}:</b> {k.message}</div>) : "No shoutouts yet."}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Give kudos…" />
        <button onClick={send} className="rounded-xl border px-3 py-2">Send</button>
      </CardFooter>
    </Card>
  );
}
