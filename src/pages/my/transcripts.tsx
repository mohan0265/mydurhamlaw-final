// src/pages/my/transcripts.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { withAuthProtection } from "@/lib/withAuthProtection";

type Row = { id: string; created_at: string; title: string | null; content: string };

function TranscriptsInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!supabase) return;
      const { data, error } = await supabase
        .from("ai_history")
        .select("id, created_at, title, content")
        .order("created_at", { ascending: false });
      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!rows.length) return <div className="p-6">No transcripts yet.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">My AI Transcripts</h1>
      {rows.map((r) => {
        let parts: { role: string; content: string }[] = [];
        try { parts = JSON.parse(r.content || "[]"); } catch {}
        return (
          <div key={r.id} className="p-4 rounded border bg-white">
            <div className="text-sm text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
            <div className="font-medium">{r.title || "Conversation"}</div>
            <div className="mt-2 space-y-2">
              {parts.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span
                    className={`inline-block px-3 py-2 rounded text-sm ${
                      m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-200"
                    }`}
                  >
                    {m.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default withAuthProtection(TranscriptsInner);