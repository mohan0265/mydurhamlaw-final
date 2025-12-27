import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from '@/lib/supabase/AuthContext';
import { useDurmahRealtime } from "@/hooks/useDurmahRealtime";
import { useDurmahGeminiLive } from "@/hooks/useDurmahGeminiLive";
import { useDurmahDynamicContext } from "@/hooks/useDurmahDynamicContext";
import { useDurmah } from "@/lib/durmah/context";
import { fetchAuthed } from "@/lib/fetchAuthed";
import { waitForAccessToken } from "@/lib/auth/waitForAccessToken";
import { normalizeTranscriptLanguage } from "@/lib/durmah/normalizeTranscriptLanguage";
import { 
  buildDurmahSystemPrompt, 
  composeGreeting, 
  DurmahStudentContext, 
  DurmahMemorySnapshot 
} from "@/lib/durmah/systemPrompt";
import { formatTodayForDisplay } from "@/lib/durmah/phase";
import { useDurmahSettings } from "@/hooks/useDurmahSettings";
import { Settings, X, ArrowRight, AlertTriangle, Check, Volume2, Brain, Zap, MoreHorizontal } from "lucide-react";
import Link from 'next/link';
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

const VOICE_PROVIDER = process.env.NEXT_PUBLIC_DURMAH_VOICE_PROVIDER || 'gemini';
const useVoiceHook = VOICE_PROVIDER === 'gemini' ? useDurmahGeminiLive : useDurmahRealtime;

type Msg = { role: "durmah" | "you"; text: string; ts: number };

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(" ");
}

const supabaseClient = getSupabaseClient();

const DEDUPE_WINDOW_MS = 2000;

function normalizeTurnText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isDuplicateTurn(
  existing: Msg[],
  role: Msg["role"],
  normalizedText: string,
  ts: number
) {
  const last = existing[existing.length - 1];
  const lowered = normalizedText.toLowerCase();

  if (
    last &&
    last.role === role &&
    normalizeTurnText(last.text).toLowerCase() === lowered
  ) {
    return true;
  }

  for (let i = existing.length - 1; i >= 0; i -= 1) {
    const candidate = existing[i];
    if (!candidate) continue;
    if (ts - candidate.ts > DEDUPE_WINDOW_MS) break;
    if (
      candidate.role === role &&
      normalizeTurnText(candidate.text).toLowerCase() === lowered
    ) {
      return true;
    }
  }

  return false;
}

function mergeDedupedTranscript(turns: Msg[]) {
  const result: Msg[] = [];
  const now = Date.now();

  for (const turn of turns) {
    const normalizedText = normalizeTurnText(turn.text);
    if (!normalizedText) continue;
    const ts = typeof turn.ts === "number" ? turn.ts : now;
    if (isDuplicateTurn(result, turn.role, normalizedText, ts)) continue;
    result.push({ ...turn, text: normalizedText, ts });
  }

  return result;
}

function createVoiceSessionId() {
  const cryptoRef =
    typeof globalThis !== "undefined"
      ? (globalThis.crypto as Crypto & { randomUUID?: () => string })
      : null;
  if (cryptoRef?.randomUUID) {
    try {
      return cryptoRef.randomUUID();
    } catch {
      // Ignore and fall back
    }
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const signedIn = !!user?.id;
  
  // 1. Source Context
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents, authError } = useDurmahDynamicContext();
  const { preset, updateVoice, availablePresets, voiceId } = useDurmahSettings();
  
  // Construct the unified context object
  const studentContext: DurmahStudentContext = useMemo(() => {
    const base = durmahCtx.hydrated ? durmahCtx : (typeof window !== 'undefined' ? window.__mdlStudentContext : null);
    
    if (!base) {
      return {
        userId: user?.id || "anon",
        firstName: "Student",
        university: "Durham University",
        programme: "LLB",
        yearGroup: "year1",
        academicYear: "2025/26",
        modules: [],
        nowPhase: "term time" as any,
        currentPhase: "Michaelmas Term",
        upcomingTasks: [],
        todaysEvents: []
      };
    }

    return {
      userId: base.userId,
      firstName: base.firstName,
      university: base.university,
      programme: base.programme,
      yearGroup: base.yearKey,
      academicYear: base.academicYear,
      modules: base.modules,
      nowPhase: base.nowPhase,
      currentPhase: base.nowPhase,
      keyDates: base.keyDates,
      todayLabel: formatTodayForDisplay(),
      upcomingTasks,
      todaysEvents
    };
  }, [durmahCtx, user?.id, upcomingTasks, todaysEvents]);

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTranscript, setCallTranscript] = useState<Msg[]>([]);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [voiceSessionHadTurns, setVoiceSessionHadTurns] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceSessionStartedAt, setVoiceSessionStartedAt] = useState<Date | null>(null);
  const [voiceSessionEndedAt, setVoiceSessionEndedAt] = useState<Date | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [memory, setMemory] = useState<DurmahMemorySnapshot | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const streamControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const prevListeningRef = useRef(false);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, ready, isOpen]);

  // Ensure browser is allowed to autoplay incoming WebRTC audio
  useEffect(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    el.autoplay = true;
    el.muted = false;
    (el as any).playsInline = true;
  }, []);

  // 2. Memory & Greeting (now driven by durmah context)
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;

    (async () => {
      try {
        await waitForAccessToken();
        const res = await fetchAuthed("/api/durmah/memory");
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setReady(true);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const ctx = data?.context;
          if (!cancelled && ctx) {
            const mapped = (ctx.recentMessages || []).map((m: any) => ({
              role: m.role === 'assistant' ? 'durmah' : 'you',
              text: m.content,
              ts: new Date(m.created_at).getTime(),
            }));
            if (mapped.length > 0) setMessages(mapped);
            if (ctx.lastSummary) {
              setMemory({
                last_topic: 'continuation',
                last_message: ctx.lastSummary,
                last_seen_at: ctx.last_message_at,
              });
            }
            if (ctx.onboardingState === 'new') {
            setMessages((prev) => [
              ...prev,
              {
                role: 'durmah',
                text:
                    "Welcome to MyDurhamLaw! You're on a 14-day trial. I'll keep this quick: Which year are you in (foundation/year1/year2/year3)? Any key modules or deadlines this month?",
                ts: Date.now(),
              },
            ]);
          }
          }
        }
      } catch (e) {
        console.error("Failed to fetch durmah context", e);
      }
      
      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [signedIn]);

  // Set initial greeting once ready (only if nothing loaded)
  useEffect(() => {
    if (ready && messages.length === 0) {
      const greeting = preset?.welcomeMessage || composeGreeting(studentContext, memory, upcomingTasks, todaysEvents);
      setMessages([{ role: "durmah", text: greeting, ts: Date.now() }]);
    }
  }, [ready, preset, studentContext, memory, messages.length, upcomingTasks, todaysEvents]);

  useEffect(() => {
    if (authError) {
      toast.error("Your session expired. Please sign in again.");
    }
  }, [authError]);


  // 3. Voice Hook
  const systemPrompt = useMemo(() => 
    buildDurmahSystemPrompt(studentContext, memory, upcomingTasks, todaysEvents, { systemTone: preset?.subtitle || "Friendly" }), 
  [studentContext, memory, upcomingTasks, todaysEvents, preset]);

  const appendTranscriptTurn = useCallback((role: Msg["role"], text: string) => {
    const normalizedText = normalizeTurnText(text);
    if (!normalizedText) return;

    const ts = Date.now();
    let added = false;

    setCallTranscript((prev) => {
      // Fix undefined candidate error
      const last = prev[prev.length - 1];
      const lowered = normalizedText.toLowerCase();

      if (
        last &&
        last.role === role &&
        normalizeTurnText(last.text).toLowerCase() === lowered
      ) {
        return prev;
      }
      added = true;
      return [...prev, { role, text: normalizedText, ts }];
    });

    if (added) {
      setVoiceSessionHadTurns(true);
    }
  }, []);

  // Pass selected realtime voice from the preset
  const {
    startListening,
    stopListening,
    isListening,
    status,
    speaking,
    error: voiceError,
    playVoicePreview // Imported from hook
  } = useVoiceHook({
    systemPrompt,
    voice: preset?.openaiVoice || "alloy",
    audioRef,
    onTurn: (turn) => {
      appendTranscriptTurn(
        turn.speaker === "user" ? "you" : "durmah",
        turn.text
      );
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showHeaderMenu &&
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target as Node)
      ) {
        setShowHeaderMenu(false);
      }
    }

    if (showHeaderMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHeaderMenu]);

  useEffect(() => {
    const wasListening = prevListeningRef.current;
    if (wasListening && !isListening && voiceSessionActive) {
      if (callTranscript.length > 0 || voiceSessionHadTurns) {
        setShowVoiceTranscript(true);
      }
      setVoiceSessionEndedAt(new Date());
      setVoiceSessionActive(false);
    }
    prevListeningRef.current = isListening;
  }, [isListening, voiceSessionActive, voiceSessionHadTurns, callTranscript.length]);

  const chips = useMemo(() => {
    if (studentContext.currentPhase === 'exams') return ["Revision tips", "Past papers", "Stress management"];
    if (studentContext.currentPhase === 'induction_week') return ["Where is the library?", "How to reference", "Module choices"];
    return ["Review this week", "Make a study plan", "Practice quiz"];
  }, [studentContext.currentPhase]);

  // ----------------------------
  // VOICE SESSION HANDLING
  // ----------------------------
  async function toggleVoice() {
    console.log("[DurmahVoice] Mic button clicked");
    if (!isListening) {
      setCallTranscript([]);
      setShowVoiceTranscript(false);
      setVoiceSessionActive(true);
      setVoiceSessionHadTurns(false);
      setVoiceSessionEndedAt(null);
      setVoiceSessionStartedAt(new Date());
      setVoiceSessionId(createVoiceSessionId());
      try {
        await startListening();
      } catch (err) {
        console.error("[DurmahVoice] Unable to start listening:", err);
        setVoiceSessionActive(false);
        setVoiceSessionId(null);
        setVoiceSessionStartedAt(null);
        setVoiceSessionEndedAt(null);
      }
      return;
    }

    stopListening();
    setVoiceSessionActive(false);
    setShowVoiceTranscript(true);
    setVoiceSessionEndedAt(new Date());
  }

  const handlePreview = async (
    preset: { id: string; openaiVoice: string; previewText: string },
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (isListening || previewingVoiceId === preset.id) return;

    setPreviewingVoiceId(preset.id);
    try {
      if (playVoicePreview) {
        await playVoicePreview(preset);
      }
    } catch (err) {
      console.error("[DurmahVoice] Preview failed:", err);
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const saveVoiceTranscript = async () => {
    const transcriptTurns = mergeDedupedTranscript(callTranscript);
    if (transcriptTurns.length > 0) {
      setMessages((prev) => [...prev, ...transcriptTurns]);

      const lastUser = [...transcriptTurns].reverse().find((m) => m.role === "you");
      if (lastUser) {
        const topic = inferTopic(lastUser.text);
        try {
          const { token } = await waitForAccessToken();
          if (!token) {
            toast.error("Session expired. Please sign in again to save Durmah updates.");
            return;
          }

          const res = await fetchAuthed("/api/durmah/memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ last_topic: topic, last_message: lastUser.text }),
          });
          if (res.status === 401 || res.status === 403) {
            toast.error("Session expired. Please sign in again to save Durmah updates.");
            return;
          }
          setMemory((prev) => ({ ...prev, last_topic: topic, last_message: lastUser.text }));
        } catch {
          // Non-blocking memory update failure
        }
      }

      try {
        const sessionStart = voiceSessionStartedAt ?? new Date();
        const sessionEnd = voiceSessionEndedAt ?? new Date();
        const durationSeconds = Math.max(
          0,
          Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 1000)
        );
        const sessionIdentifier = voiceSessionId ?? createVoiceSessionId();
        const normalizedTranscript = await Promise.all(
          transcriptTurns.map(async (turn) => ({
            role: turn.role === "you" ? "user" : "durmah",
            text: await normalizeTranscriptLanguage(turn.text),
            timestamp: turn.ts,
          }))
        );
        const firstUserTurn = transcriptTurns.find((turn) => turn.role === "you");
        const topic =
          firstUserTurn && firstUserTurn.text
            ? firstUserTurn.text.slice(0, 60)
            : "Durmah Voice Session";

        let supabaseUserId = user?.id ?? null;
        if (!supabaseUserId) {
          try {
            const { data } = await supabaseClient.auth.getUser();
            supabaseUserId = data.user?.id ?? null;
          } catch {
            supabaseUserId = null;
          }
        }

        if (!supabaseUserId) {
          toast.error("Saved to chat, but couldn't archive transcript.");
        } else {
          const { error } = await supabaseClient.from("voice_journals").insert({
            user_id: supabaseUserId,
            session_id: sessionIdentifier,
            started_at: sessionStart.toISOString(),
            ended_at: sessionEnd.toISOString(),
            duration_seconds: durationSeconds,
            topic,
            summary: null,
            transcript: normalizedTranscript,
          });
          if (error) {
            throw error;
          }
          toast.success("Voice transcript saved to library.");
        }
      } catch (err) {
        console.error("[DurmahVoice] Failed to persist transcript", err);
        toast.error("Saved to chat, but couldn't archive transcript.");
      }
    }
    setShowVoiceTranscript(false);
    setCallTranscript([]);
    setVoiceSessionHadTurns(false);
    setVoiceSessionActive(false);
    setVoiceSessionId(null);
    setVoiceSessionStartedAt(null);
    setVoiceSessionEndedAt(null);
  };

  const discardVoiceTranscript = () => {
    setShowVoiceTranscript(false);
    setCallTranscript([]);
    setVoiceSessionHadTurns(false);
    setVoiceSessionActive(false);
    setVoiceSessionId(null);
    setVoiceSessionStartedAt(null);
    setVoiceSessionEndedAt(null);
  };

  // ----------------------------
  // TEXT CHAT SEND
  // ----------------------------
  async function send() {
    if (!signedIn || !input.trim() || isStreaming || isListening) return;

    const userText = input.trim();
    const now = Date.now();
    const userMsg: Msg = { role: "you", text: userText, ts: now };
    const assistantId = now + 1;

    const history = [...messages, userMsg];
    setMessages([...history, { role: "durmah", text: "", ts: assistantId }]);
    setInput("");
    setIsStreaming(true);

    const inferredTopic = inferTopic(userText);

    // Update memory in background
    void (async () => {
      try {
        const { token } = await waitForAccessToken();
        if (!token) {
          return;
        }

        const res = await fetchAuthed("/api/durmah/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_topic: inferredTopic, last_message: userText }),
        });
        if (res.status === 401 || res.status === 403) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[DurmahWidget] memory update unauthorized during text send");
          }
          return;
        }
        setMemory(prev => ({ ...prev, last_topic: inferredTopic, last_message: userText }));
      } catch {}
    })();

    try {
      const response = await fetch("/api/durmah/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, source: "dashboard" }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const replyText = data?.reply || "I'm here if you want to continue.";

      setMessages((current) =>
        mergeDedupedTranscript([
          ...current.map((m) => (m.ts === assistantId ? { ...m, text: replyText } : m)),
        ])
      );
    } catch (err: any) {
      setMessages((current) =>
        current.map((m) =>
          m.ts === assistantId ? { ...m, text: `Error: ${err.message}` } : m
        )
      );
    } finally {
      streamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  // ----------------------------
  // UI RENDER
  // ----------------------------

  // 1. Logged-out Modal
  if (isOpen && !signedIn) {
    return (
      <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
         <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
            <h3 className="font-bold text-lg">Unlock Your Legal Eagle Buddy</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20">
               <X size={20} />
            </button>
         </div>
         
         <div className="p-8 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-violet-600" />
             </div>
             <p className="text-gray-600 mb-8 leading-relaxed">
               Please log in or start your free trial to talk to Durmah, your personal Durham Law study mentor.
             </p>
             <div className="flex flex-col gap-3 w-full">
                <Link href="/login" className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  Log In
                </Link>
                <Link href="/signup" className="w-full py-3 bg-white text-violet-600 border border-violet-200 rounded-xl font-bold hover:bg-violet-50 transition-all">
                  Start Free Trial
                </Link>
             </div>
         </div>
      </div>
    );
  }

  // 2. Closed Launcher (Pill Style)
  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 z-[60] flex flex-col items-end group">
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0">
          <div className="bg-gray-900/90 backdrop-blur-sm text-white text-xs py-2.5 px-4 rounded-xl shadow-xl border border-white/10">
            <div className="font-bold mb-0.5 text-violet-200">Durmah - Your Legal Eagle Buddy</div>
            <div className="text-gray-300">I'm always here to help you study.</div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-gray-900/90 rotate-45 border-t border-r border-white/10"></div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-violet-400/50 ${
            isListening 
              ? "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse text-white" 
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          }`}
        >
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
             <span className="font-serif text-xl font-bold italic">D</span>
             {isListening && (
               <span className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-ping"></span>
             )}
          </div>
          
          <div className="flex flex-col items-start">
             <span className="font-bold text-sm leading-tight">Durmah</span>
             <span className="text-[10px] text-violet-100 font-medium">Your Legal Eagle Buddy</span>
          </div>
        </button>
      </div>
    );
  }

  // 3. Open Chat Widget (Logged In)
  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-md flex-col overflow-visible rounded-3xl border border-violet-100 bg-white shadow-2xl sm:w-[400px] max-h-[80vh] h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Premium Header Ribbon */}
      <header className="relative flex-none flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-5 py-4 text-white shadow-md z-30">
        <div className="flex flex-col">
          <div className="font-bold text-lg flex items-center gap-2">
            Durmah
            <span className="bg-white/20 backdrop-blur-sm rounded-full text-[10px] px-2 py-0.5 font-medium tracking-wide">BETA</span>
          </div>
          <span className="text-xs text-violet-100 font-medium">Your Legal Mentor</span>
        </div>

        {/* Hidden audio output for Durmah's voice */}
        <audio
          ref={audioRef}
          style={{ display: 'none' }}
        />

        <div className="flex items-center gap-2">
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setShowHeaderMenu((prev) => !prev)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>
            {showHeaderMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white/95 rounded-2xl shadow-xl border border-violet-100 overflow-hidden text-sm text-gray-700 z-30">
                <button
                  className="w-full text-left px-4 py-2.5 hover:bg-violet-50 flex items-center justify-between"
                  onClick={() => {
                    setShowVoiceTranscript(true);
                    setShowSettings(false);
                    setShowHeaderMenu(false);
                  }}
                >
                  Transcript
                  <ArrowRight size={14} className="text-violet-500" />
                </button>
                <Link
                  href="/my/voice-transcripts"
                  className="block px-4 py-2.5 hover:bg-violet-50 flex items-center justify-between"
                  onClick={() => setShowHeaderMenu(false)}
                >
                  Transcript Library
                  <ArrowRight size={14} className="text-violet-500" />
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Voice Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full transition-all duration-300 ${
              isListening 
                ? "bg-red-500 text-white shadow-lg scale-110" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {isListening ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
              </div>
            ) : "Mic"}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* --------------- SETTINGS MODAL (PERSONA CARDS) ---------------- */}
      {showSettings && (
        <div className="absolute inset-0 z-40 bg-gray-50/95 backdrop-blur-xl flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white/50">
             <div>
                <h3 className="font-bold text-lg text-gray-800">Durmah's Voice</h3>
                <p className="text-xs text-gray-500">Select a personality for your mentor</p>
             </div>
            <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4 pb-4">
                {availablePresets.map((p) => {
                  const isSelected = voiceId === p.id;
                  const isPreviewing = previewingVoiceId === p.id;
                  
                  return (
                    <div 
                      key={p.id}
                      onClick={() => updateVoice(p.id)}
                      className={`relative group rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                        isSelected 
                          ? "bg-white border-violet-500 shadow-lg ring-1 ring-violet-500 scale-[1.02]" 
                          : "bg-white border-gray-200 hover:border-violet-200 hover:shadow-md hover:bg-gray-50"
                      }`}
                    >
                      {/* Top Color Band */}
                      <div className={`h-2 w-full bg-gradient-to-r ${p.colorClass}`}></div>
                      
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Check size={10} /> Selected
                        </div>
                      )}

                      <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${p.colorClass} text-white shadow-md`}>
                                {p.icon === 'mentor' && <Brain size={20} />}
                                {p.icon === 'owl' && <Brain size={20} />} 
                                {p.icon === 'feather' && <Volume2 size={20} />} 
                                {p.icon === 'spark' && <Zap size={20} />}
                             </div>
                          </div>
                          
                          <h4 className="font-bold text-gray-900 mb-1">{p.label}</h4>
                          <p className="text-xs text-gray-500 mb-4 h-8">{p.subtitle}</p>
                          
                          <button
                             onClick={(e) => handlePreview(p, e)}
                             disabled={Boolean(isPreviewing) || isListening}
                             className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                               isPreviewing || isListening 
                                 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                 : "bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"
                             }`}
                          >
                             {isPreviewing ? (
                               <>
                                 <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                                 Playing...
                               </>
                             ) : isListening ? (
                               <>
                                 <Volume2 size={14} /> In a call
                               </>
                             ) : (
                               <>
                                 <Volume2 size={14} /> Play Preview
                               </>
                             )}
                          </button>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-white/50 text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
               Powered by Gemini Realtime
            </div>
          </div>
        </div>
      )}

      {/* --------------- VOICE TRANSCRIPT ---------------- */}
      {showVoiceTranscript && !showSettings && (
        <div className="flex-none p-4 bg-violet-50/80 backdrop-blur-sm border-b border-violet-100 z-10 shadow-sm max-h-[40%] overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-3 flex items-center gap-2 sticky top-0 bg-violet-50/0">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Live Transcript
          </div>

          {callTranscript.length === 0 ? (
            <div className="text-sm text-violet-900/80 bg-white/80 border border-violet-100 rounded-2xl px-4 py-3 shadow-sm">
              No transcript captured for this session.
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {callTranscript.map((m) => (
                <div key={m.ts} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      m.role === "you"
                        ? "bg-violet-600 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-violet-100 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-violet-200/50 sticky bottom-0 bg-violet-50/0">
            <button
              onClick={discardVoiceTranscript}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-200/50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={saveVoiceTranscript}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-md transition-all hover:shadow-lg"
            >
              Save to Chat
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {voiceError && !showSettings && (
        <div className="flex-none px-4 py-3 text-xs font-medium text-red-600 bg-red-50 border-y border-red-100 flex items-center gap-2">
           <AlertTriangle size={14} /> {voiceError}
        </div>
      )}

      {/* --------------- CHAT HISTORY (Scrollable Flex Area) ---------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto glb-scroll p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && !ready && (
           <div className="flex justify-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
           </div>
        )}
        
        {messages.map((m) => (
          <div key={m.ts} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${
                m.role === "you"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* --------------- QUICK REPLY CHIPS ---------------- */}
      {!isListening && !showSettings && (
        <div className="flex-none flex gap-2 overflow-x-auto p-3 border-t border-gray-100 bg-white no-scrollbar z-10">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="whitespace-nowrap text-xs font-medium px-4 py-2 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* --------------- TEXT INPUT BAR ---------------- */}
      {!isListening && !showSettings && (
        <div className="flex-none border-t border-gray-100 p-4 flex gap-3 items-center bg-white z-10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Durmah..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white"
          />

          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* --------------- VOICE MODE FOOTER (WAVEFORM) ---------------- */}
      {isListening && !showSettings && (
        <div className="flex-none p-6 text-center bg-white border-t border-gray-100 z-10">
          <div className="flex items-center justify-center gap-1 h-8 mb-2">
             {/* Simulated Waveform Animation */}
             {[...Array(5)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-1 bg-violet-500 rounded-full animate-waveform`}
                 style={{ 
                   height: speaking ? '100%' : '30%',
                   animationDelay: `${i * 0.1}s`,
                   animationDuration: '0.8s'
                 }} 
               />
             ))}
          </div>
          <div className="text-xs font-medium text-violet-600 uppercase tracking-wide">
            {speaking ? "Durmah is speaking..." : "Listening..."}
          </div>
          <style jsx>{`
            @keyframes waveform {
              0%, 100% { height: 30%; opacity: 0.5; }
              50% { height: 100%; opacity: 1; }
            }
            .animate-waveform {
              animation: waveform 1s infinite ease-in-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
