import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { withAuthProtection } from "@/lib/withAuthProtection";

const supabase = getSupabaseClient();

type TranscriptTurn = {
  role?: string;
  text?: string;
  timestamp?: number;
  ts?: number;
};

type VoiceJournalRow = {
  id: string;
  topic: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: TranscriptTurn[] | null;
};

function formatDurationLabel(seconds: number) {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function resolveDurationSeconds(entry: VoiceJournalRow) {
  if (typeof entry.duration_seconds === "number" && entry.duration_seconds >= 0) {
    return entry.duration_seconds;
  }
  if (entry.started_at && entry.ended_at) {
    const start = new Date(entry.started_at).getTime();
    const end = new Date(entry.ended_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return Math.max(0, Math.round((end - start) / 1000));
    }
  }
  return 0;
}

function formatDateLabel(value: string | null) {
  if (!value) return "Unknown date";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function VoiceTranscriptsPage() {
  const [entries, setEntries] = useState<VoiceJournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    
    try {
        // 1. Fetch Legacy/Bulk Voice Journals
        const { data: journals, error: journalError } = await supabase
        .from("voice_journals")
        .select("id, topic, created_at, started_at, ended_at, duration_seconds, transcript")
        .order("created_at", { ascending: false });

        if (journalError) throw journalError;

        // 2. Fetch Itemized Saved Messages
        const { data: messages, error: msgError } = await supabase
        .from("durmah_messages")
        .select("id, content, role, created_at, session_id, saved_at")
        .not("saved_at", "is", null) // Only saved items
        .order("created_at", { ascending: true }); // Order by time within session

        if (msgError) throw msgError;

        // 3. Group Messages by Session
        const messageGroups: Record<string, VoiceJournalRow> = {};
        
        // Helper to normalize message role
        const normalizeRole = (r: string) => r === 'user' ? 'you' : r === 'assistant' ? 'durmah' : r;

        messages?.forEach(msg => {
            const sessionId = msg.session_id || `legacy-${msg.created_at.substring(0, 10)}`;
            
            if (!messageGroups[sessionId]) {
                messageGroups[sessionId] = {
                    id: sessionId,
                    topic: "Saved Highlights",
                    created_at: msg.created_at, // Will pick earliest
                    started_at: msg.created_at,
                    ended_at: msg.created_at,
                    duration_seconds: 0,
                    transcript: []
                };
            }
            
            const group = messageGroups[sessionId];
            // Update timestamps
            if (new Date(msg.created_at) < new Date(group.created_at)) group.created_at = msg.created_at;
            if (new Date(msg.created_at) > new Date(group.ended_at!)) group.ended_at = msg.created_at;
            
            // Add turn
            group.transcript?.push({
                role: normalizeRole(msg.role),
                text: msg.content,
                ts: new Date(msg.created_at).getTime(),
                timestamp: new Date(msg.created_at).getTime()
            });
        });

        // 4. Convert Groups to Array
        const messageEntries = Object.values(messageGroups).map(g => {
             // Calculate duration
             const start = new Date(g.started_at!).getTime();
             const end = new Date(g.ended_at!).getTime();
             return {
                 ...g,
                 duration_seconds: Math.round((end - start) / 1000),
                 topic: `Saved Highlights (${new Date(g.created_at).toLocaleDateString()})` 
             };
        });

        // 5. Merge and Sort
        // Deduping: If a session exists in both (unlikely given new flow, but possible), prefer Journal?
        // Actually, let's just show both if they somehow exist, or filter. 
        // Simple merge:
        const allEntries = [...(journals || []), ...messageEntries];
        
        // Sort by created_at desc
        allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setEntries(allEntries);
        
    } catch (error) {
      console.error("[VoiceTranscripts] Failed to fetch data", error);
      toast.error("Couldn't load transcripts.");
      setEntries([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries().catch(() => {
      toast.error("Failed to load voice transcripts.");
    });
  }, [loadEntries]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    const { error } = await supabase.from("voice_journals").delete().eq("id", id);
    if (error) {
      console.error("[VoiceTranscripts] Delete failed", error);
      toast.error("Couldn't delete transcript.");
    } else {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setExpanded((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      toast.success("Transcript deleted.");
    }
    setBusyId(null);
  };

  const handleCopy = (entry: VoiceJournalRow) => {
    const turns = Array.isArray(entry.transcript) ? entry.transcript : [];
    if (!turns.length) {
      toast.error("No transcript captured for this session.");
      return;
    }
    const lines = turns.map((turn) => {
      const speaker =
        turn.role === "durmah" || turn.role === "assistant"
          ? "Durmah"
          : turn.role === "user" || turn.role === "you"
          ? "You"
          : turn.role || "Voice";
      return `${speaker}: ${turn.text ?? ""}`.trim();
    });
    const textBlob = lines.join("\n");
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      toast.error("Clipboard not available in this browser.");
      return;
    }
    navigator.clipboard
      .writeText(textBlob)
      .then(() => toast.success("Transcript copied."))
      .catch(() => toast.error("Couldn't copy transcript."));
  };

  const content = useMemo(() => {
    if (loading) {
      return <div className="text-sm text-gray-600">Loading voice transcripts…</div>;
    }
    if (!entries.length) {
      return (
        <div className="text-sm text-gray-600">
          You haven't saved any voice transcripts yet. Start a Durmah voice session and save it to see it here.
        </div>
      );
    }

    return entries.map((entry) => {
      const transcriptTurns = Array.isArray(entry.transcript) ? entry.transcript : [];
      const durationSeconds = resolveDurationSeconds(entry);
      const isExpanded = !!expanded[entry.id];
      return (
        <div
          key={entry.id}
          className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 sm:p-6 space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {formatDateLabel(entry.started_at ?? entry.created_at)}
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {entry.topic || "Durmah Voice Session"}
              </h2>
              <p className="text-sm text-slate-500">
                Duration: {formatDurationLabel(durationSeconds)} · {transcriptTurns.length} turns
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleExpanded(entry.id)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
              >
                {isExpanded ? "Hide Transcript" : "Show Transcript"}
              </button>
              <button
                onClick={() => handleCopy(entry)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Copy
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={busyId === entry.id}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-60"
              >
                {busyId === entry.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
          {isExpanded && (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              {transcriptTurns.length === 0 ? (
                <p className="text-sm text-slate-500">No transcript captured for this session.</p>
              ) : (
                transcriptTurns.map((turn, idx) => (
                  <div
                    key={`${entry.id}-${idx}`}
                    className={`flex ${turn.role === "user" || turn.role === "you" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] shadow-sm ${
                        turn.role === "user" || turn.role === "you"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                      }`}
                    >
                      {turn.text ?? "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    });
  }, [busyId, entries, expanded, loading]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
          Durmah
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Voice Transcript Library</h1>
        <p className="text-sm text-slate-600">
          Review and manage transcripts that were saved from Durmah voice sessions.
        </p>
      </div>
      <div className="space-y-4">{content}</div>
    </div>
  );
}

export default withAuthProtection(VoiceTranscriptsPage);
