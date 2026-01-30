import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Play, Calendar, Trash2, ArrowRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface QuizSession {
  id: string;
  created_at: string;
  status: string;
  performance_metadata?: {
    score?: number;
    mode?: string;
  };
}

interface LectureQuizHistoryProps {
  lectureId: string;
  academicItemId?: string;
  onResume: (sessionId: string) => void;
  currentSessionId?: string | null;
}

export const LectureQuizHistory: React.FC<LectureQuizHistoryProps> = ({
  lectureId,
  academicItemId,
  onResume,
  currentSessionId,
}) => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const supabase = getSupabaseClient();
      // Fetch sessions linked to this lecture (target_id) OR academic_item_id
      // For now, let's look up by target_id as that's populated for legacy too
      let query = supabase
        .from("quiz_sessions")
        .select("*")
        .eq("target_id", lectureId)
        .order("created_at", { ascending: false });

      if (academicItemId) {
        // If we have an AI ID, we could use `.or()` but Supabase simple query might fail complex ORs without raw SQL
        // Let's stick to target_id which IS the lecture ID.
        // Future proofing: fetching both is safer if we migrate entirely.
        // query = query.or(`target_id.eq.${lectureId},academic_item_id.eq.${academicItemId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [lectureId, currentSessionId]); // Reload when session changes or ends

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;

    const supabase = getSupabaseClient();
    await supabase.from("quiz_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session deleted");
  };

  if (loading)
    return <div className="text-xs text-gray-400">Loading history...</div>;
  if (sessions.length === 0) return null;

  return (
    <div className="mt-8 animate-fadeIn">
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Previous Sessions
      </h4>
      <div className="grid gap-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onResume(session.id)}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
              currentSessionId === session.id
                ? "bg-purple-50 border-purple-200 ring-1 ring-purple-200"
                : "bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentSessionId === session.id
                    ? "bg-purple-200 text-purple-700"
                    : "bg-gray-50 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600"
                }`}
              >
                {currentSessionId === session.id ? (
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 group-hover:text-purple-700">
                  {format(new Date(session.created_at), "MMM d, h:mm a")}
                </div>
                <div className="text-xs text-gray-500">
                  {session.performance_metadata?.mode === "voice"
                    ? "Voice Mode"
                    : "Text Quiz"}
                  {session.status === "active" && " • In Progress"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentSessionId !== session.id && (
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {currentSessionId !== session.id && (
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
