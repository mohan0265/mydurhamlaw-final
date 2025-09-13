"use client";
import React, { useEffect, useState } from "react";
import { useSupabaseClient } from "@/contexts/SupabaseProvider";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Msg = { id: string; user_id: string; username: string; text: string; created_at: string };

export default function PublicChat({ user = { id: "demo", name: "Guest" } }) {
  const supabase = useSupabaseClient();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  if (!supabase) return <Card><CardHeader><CardTitle>Chat</CardTitle></CardHeader><CardContent>Backend not connected.</CardContent></Card>;

  useEffect(() => {
    let active = true;
    supabase.from("lounge_messages").select("*").order("created_at", { ascending: true }).then(({ data, error }) => {
      if (error) { console.error(error); return; }
      if (active && data) setMsgs(data as Msg[]);
    });
    const ch = supabase.channel("realtime:lounge_messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "lounge_messages" },
        (payload: any) => setMsgs((prev) => [...prev, payload.new as Msg]))
      .subscribe();
    return () => { active = false; ch.unsubscribe(); };
  }, [supabase]);

  async function send() {
    if (!text.trim()) return;
    const result = await supabase?.from("lounge_messages").insert({
      user_id: user.id, username: user.name || "Guest", text,
    });
    if (result?.error) console.error(result.error);
    setText("");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Public Chat</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {msgs.map((m) => (<div key={m.id}><b>{m.username}:</b> {m.text}</div>))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Say hi…" />
        <button onClick={send} className="rounded-xl border px-3 py-2">Send</button>
      </CardFooter>
    </Card>
  );
}