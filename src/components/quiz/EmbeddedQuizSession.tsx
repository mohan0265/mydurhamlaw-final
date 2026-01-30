import React, { useEffect, useState } from "react";
import { QuizSessionUI } from "@/components/quiz/QuizSessionUI";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmbeddedQuizSessionProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
  title?: string;
}

export const EmbeddedQuizSession: React.FC<EmbeddedQuizSessionProps> = ({
  sessionId,
  userId,
  onClose,
  title,
}) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = getSupabaseClient();
      try {
        const { data, error: sessionError } = await supabase
          .from("quiz_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;
        setSession(data);
      } catch (err: any) {
        console.error("Failed to fetch session:", err);
        setError(err.message || "Session not found");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[2.5rem] border border-gray-100 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-gray-500 font-medium">Loading session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-[2.5rem] border border-red-100 min-h-[300px] text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <p className="text-gray-800 font-bold mb-2">Could not load session</p>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <Button onClick={onClose} variant="ghost">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden min-h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Embedded Header Overlay */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {/* Could add expand to full screen link here later */}
        <button
          onClick={onClose}
          className="bg-white/80 backdrop-blur text-gray-600 hover:text-purple-700 p-2 rounded-full shadow-sm border border-gray-100 transition-colors"
          title="Minimize / Close Quiz"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <QuizSessionUI
          sessionId={session.id}
          userId={userId}
          mode={session.performance_metadata?.mode || "text"}
        />
      </div>
    </div>
  );
};
