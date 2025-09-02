// src/pages/my/transcripts.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Row = {
  id: string;
  created_at: string;
  title: string | null;
  content: string;
};

function TranscriptsPageInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const sb = supabase;
      if (!sb) {
        setRows([]);
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await sb.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setRows([]); setLoading(false); return; }

      const { data, error } = await sb
        .from("ai_history")
        .select("id, created_at, title, content")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!mounted) return;
      if (error) { console.error(error); setRows([]); }
      else setRows(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold text-violet-700 mb-4">My Saved Transcripts</h1>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">No saved transcripts yet.</div>
      ) : (
        <ul className="space-y-4">
          {rows.map(r => (
            <li key={r.id} className="rounded-lg border p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium">{r.title || "Untitled session"}</div>
                <div className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{r.content}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TranscriptsPageInner;