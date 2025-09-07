// src/components/lounge/MiniTweetBar.tsx
"use client";
import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

type Spark = {
  id: string;
  author_id: string;
  author_display_name: string | null;
  text: string;
  created_at: string;
  is_shadow_muted: boolean;
  automod_flag: boolean;
};

const MAX = 140;
const BAD_WORDS = ["idiot", "stupid", "hate you", "racist", "sexist"];

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function MiniTweetBar() {
  const [text, setText] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [rows, setRows] = useState<Spark[]>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let mounted = true;
    let channel: any;
    
    (async () => {
      const supabase = (await import("@/lib/supabase/client")).getSupabaseClient(); if (!supabase) throw new Error("Unable to connect to database");
      
      const { data, error } = await supabase.rpc("get_lounge_sparks_recent", {
        p_limit: 20,
      });
      if (!mounted) return;
      if (!error) setRows((data || []) as Spark[]);

      channel = supabase
        .channel("lounge_sparks_rt")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lounge_sparks" },
          async () => {
            const supabase = (await import("@/lib/supabase/client")).getSupabaseClient(); if (!supabase) throw new Error("Unable to connect to database");
            const { data } = await supabase.rpc("get_lounge_sparks_recent", {
              p_limit: 20,
            });
            setRows((data || []) as Spark[]);
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) {
        (async () => {
          const supabase = (await import("@/lib/supabase/client")).getSupabaseClient(); if (!supabase) throw new Error("Unable to connect to database");
          supabase.removeChannel(channel);
        })();
      }
      mounted = false;
    };
  }, []);

  function clientModerationCheck(t: string) {
    const low = t.toLowerCase();
    for (const w of BAD_WORDS) {
      if (low.includes(w)) return `Please revise your text. "${w}" was detected.`;
    }
    return null;
  }

  async function send() {
    if (!text.trim()) return;
    const w = clientModerationCheck(text);
    if (w) {
      setWarn(w);
      return;
    }
    setPosting(true);
    try {
      const supabase = (await import("@/lib/supabase/client")).getSupabaseClient(); if (!supabase) throw new Error("Unable to connect to database");
      const { error } = await supabase.rpc("create_lounge_spark", {
        p_text: text,
      });
      if (error) throw error;
      setText("");
      setWarn(null);
    } catch (e: any) {
      setWarn(e.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <SectionCard title="Spark bar" right={<span className="text-[11px]">{MAX} chars</span>}>
      <div>
        <textarea
          className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
          placeholder="Share a quick thought with the Lounge…"
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX) setText(e.target.value);
          }}
          rows={2}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
          <div>{text.length}/{MAX}</div>
          <button
            onClick={send}
            disabled={posting || !text.trim()}
            className="rounded-xl bg-purple-600 text-white px-3 py-1 disabled:opacity-50"
          >
            {posting ? "Posting…" : "Tweet"}
          </button>
        </div>
        {warn && <p className="mt-2 text-amber-700 text-sm">{warn}</p>}

        <div className="mt-4 space-y-3">
          {rows.map((s) => (
            <div key={s.id} className="rounded-lg border px-3 py-2">
              <div className="text-xs text-gray-500 mb-1">
                <span className="font-medium">
                  {s.author_display_name || "Student"}
                </span>{" "}
                · {timeAgo(s.created_at)}
                {s.automod_flag && (
                  <span className="ml-2 text-[10px] rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                    Review
                  </span>
                )}
              </div>
              <div className="text-sm whitespace-pre-wrap">{s.text}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-xs text-gray-500">No sparks yet.</div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
