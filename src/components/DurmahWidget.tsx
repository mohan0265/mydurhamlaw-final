import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from '@/lib/supabase/AuthContext';
import { useDurmahRealtime } from "@/hooks/useDurmahRealtime";
import { useDurmahGeminiLive } from "@/hooks/useDurmahGeminiLive"; // NEW: Gemini Live
import { useDurmahDynamicContext } from "@/hooks/useDurmahDynamicContext";
import { useDurmah } from "@/lib/durmah/context";
import { fetchAuthed } from "@/lib/fetchAuthed";
import { waitForAccessToken } from "@/lib/auth/waitForAccessToken";
import { normalizeTranscriptLanguage } from "@/lib/durmah/normalizeTranscriptLanguage";
import {
  buildDurmahSystemPrompt,
  buildDurmahContextBlock,
  generateProactiveGreeting
} from "@/lib/durmah/systemPrompt";
import type { StudentContext } from "@/types/durmahContext";
import type { DurmahContextPacket } from "@/types/durmah";
import { formatTodayForDisplay } from "@/lib/durmah/phase";
import { useDurmahSettings } from "@/hooks/useDurmahSettings";
import { Settings, X, ArrowRight, AlertTriangle, Check, Volume2, Brain, Zap, RefreshCw, MoreHorizontal, Trash2 } from "lucide-react";
import Link from 'next/link';
import toast from "react-hot-toast";
import { useRouter } from 'next/router';
import { getSupabaseClient } from "@/lib/supabase/client";

// Voice Provider Selection - checks localStorage override first, then environment variable
// This allows runtime switching without redeployment (e.g., if Gemini fails)
function getVoiceProvider(): 'openai' | 'gemini' {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('durmah_voice_override');
    if (override === 'openai' || override === 'gemini') {
      console.log('[DurmahWidget] Using voice provider override:', override);
      return override;
    }
  }
  const envProvider = (process.env.NEXT_PUBLIC_DURMAH_VOICE_PROVIDER || 'openai').toLowerCase();
  return envProvider === 'gemini' ? 'gemini' : 'openai';
}

const VOICE_PROVIDER = getVoiceProvider();
const useVoiceHook = VOICE_PROVIDER === 'gemini' ? useDurmahGeminiLive : useDurmahRealtime;
console.log('[DurmahWidget] Using voice provider:', VOICE_PROVIDER);

type Msg = { role: "durmah" | "you"; text: string; ts: number };

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(" ");
}

const supabaseClient = getSupabaseClient();

const DEDUPE_WINDOW_MS = 2000;

function normalizeTurnText(text: string) {
  return (text || "")
    .replace(/\s+([,.!?;:])/g, "$1")  // Remove space before punctuation
    .replace(/\s+/g, " ")              // Collapse whitespace
    .trim();
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

function formatContextDayTimeLabel(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod =
    parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const time = `${hour}:${minute}${dayPeriod ? dayPeriod.toLowerCase() : ""}`;
  return day ? `${day} ${time}` : time;
}

function getLocalDateKey(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  if (!map.year || !map.month || !map.day) {
    return new Date().toISOString().slice(0, 10);
  }
  return `${map.year}-${map.month}-${map.day}`;
}

async function resolveAccessToken() {
  try {
    const result = await waitForAccessToken();
    if (typeof result === "string") return result;
    return result?.token ?? null;
  } catch {
    return null;
  }
}

function buildContextChipText(
  context: DurmahContextPacket | null,
  timeLabel: string | null
) {
  if (!context) return null;
  const termLabel =
    context.academic.term === "Unknown" ? "Unknown term" : context.academic.term;
  const weekLabel = context.academic.weekOfTerm
    ? `Week ${context.academic.weekOfTerm}`
    : null;
  const parts = [termLabel, weekLabel, timeLabel].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" | ") : null;
}

function buildContextGreeting(context: DurmahContextPacket) {
  const name = context.profile.displayName || "Student";
  const termLabel =
    context.academic.term === "Unknown" ? "this term" : context.academic.term;
  const weekLabel = context.academic.weekOfTerm
    ? `week ${context.academic.weekOfTerm}`
    : null;
  const timeOfDay = context.academic.timeOfDay || "day";
  const lastIntent = context.continuity.lastUserIntent;
  const followUp =
    context.continuity.followUpQuestion || "Want to continue from there?";

  if (lastIntent) {
    return `Hi ${name} - last time we discussed ${lastIntent}. ${followUp}`;
  }

  const termPhrase = weekLabel ? `${termLabel} ${weekLabel}` : termLabel;
  return `Hi ${name} - it's ${timeOfDay} and we're in ${termPhrase}. Want to review this week, plan your study, or practice a quick quiz?`;

}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  const signedIn = !!user?.id;
  
  // 1. Source Context
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents, authError } = useDurmahDynamicContext();
  const { preset, updateVoice, availablePresets, voiceId } = useDurmahSettings();
  
  // Construct the unified context object
  const studentContext: {
    userId: string;
    firstName: string;
    university: string;
    programme: string;
    yearGroup: string;
    academicYear: string;
    modules: any[];
    nowPhase: any;
    currentPhase: string;
    keyDates?: any;
    todayLabel?: string;
    upcomingTasks: any[];
    todaysEvents: any[];
  } = useMemo(() => {
    const base = durmahCtx.hydrated ? durmahCtx : (typeof window !== 'undefined' ? window.__mdlStudentContext : null);
    
    // Robust name resolution
    const rawName = (base as any)?.profile?.displayName || 
                    base?.firstName || 
                    user?.user_metadata?.full_name || 
                    user?.user_metadata?.name || 
                    "Student";

    // Robust role resolution
    const rawRole = base?.yearKey || 
                    (base as any)?.profile?.yearGroup || 
                    "Law Student";

    if (!base) {
       return {
        userId: user?.id || "anon",
        firstName: rawName,
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
      userId: base?.userId || user?.id || "anon",
      firstName: rawName, // Map full name to firstName field for system prompt
      university: base?.university || "Durham University",
      programme: base?.programme || "LLB",
      yearGroup: rawRole,
      academicYear: base?.academicYear || "2025/26",
      modules: base?.modules || [],
      nowPhase: base?.nowPhase || "term time" as any,
      currentPhase: base?.nowPhase || "Unknown Term",
      keyDates: base?.keyDates,
      todayLabel: formatTodayForDisplay(),
      upcomingTasks,
      todaysEvents
    };
  }, [durmahCtx, user, upcomingTasks, todaysEvents]);

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'chat' | 'study'>('chat'); // NEW: Chat vs Study Mode
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
  const [memory, setMemory] = useState<{ last_topic?: string; last_message?: string; last_seen_at?: string } | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [contextPacket, setContextPacket] = useState<DurmahContextPacket | null>(null);
  const [contextTimeLabel, setContextTimeLabel] = useState<string | null>(null);
  
  // NEW: Unified Durmah Intelligence - StudentContext from Phase 1
  const [studentContextData, setStudentContextData] = useState<StudentContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [lastProactiveGreeting, setLastProactiveGreeting] = useState<string | null>(null);

  const streamControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const prevListeningRef = useRef(false);

  // CRITICAL FIX: Create audio element ONCE and attach to document.body
  // This keeps it alive across React re-renders when component switches states
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = document.createElement('audio');
      audio.style.display = 'none';
      audio.id = 'durmah-persistent-audio';
      document.body.appendChild(audio);
      audioRef.current = audio;
    }

    // Cleanup on unmount - remove from DOM
    return () => {
      if (audioRef.current && document.body.contains(audioRef.current)) {
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, ready, isOpen]);

  useEffect(() => {
    if (!signedIn) {
      setContextPacket(null);
      setContextTimeLabel(null);
    }
  }, [signedIn]);

  // Listen for OPEN_DURMAH postMessage from other components (e.g., news feed)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only process messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OPEN_DURMAH') {
        const { mode: requestedMode, autoMessage } = event.data.payload || {};

        console.log('[Durmah] Received OPEN_DURMAH request:', { requestedMode, hasMessage: !!autoMessage });

        // 1. Open widget
        setIsOpen(true);

        // 2. Switch mode if requested
        if (requestedMode && (requestedMode === 'chat' || requestedMode === 'study')) {
          setMode(requestedMode);
        }

        // 3. Auto-send message if provided
        if (autoMessage && typeof autoMessage === 'string' && signedIn) {
          setTimeout(() => {
            // Programmatically trigger send
            const userText = autoMessage.trim();
            if (!userText || isStreaming || voiceSessionActive) return;
            
            const now = Date.now();
            const userMsg: Msg = { role: "you", text: userText, ts: now };
            const assistantId = now + 1;

            const history = [...messages, userMsg];
            setMessages([...history, { role: "durmah", text: "", ts: assistantId }]);
            setInput("");
            setIsStreaming(true);

            // Inline chat send logic
            (async () => {
              try {
                const body = {
                  message: userText,
                  history: history.map((m) => ({
                    role: m.role === "you" ? "user" : "assistant",
                    content: m.text,
                  })),
                  mode: requestedMode || mode,
                };

                const response = await fetch("/api/durmah/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body),
                });

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`);
                }

                if (!response.body) {
                  throw new Error("No response body");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value, { stream: true });
                  accumulated += chunk;

                  setMessages((prev) => {
                    const copy = [...prev];
                    const lastIdx = copy.length - 1;
                    if (copy[lastIdx]?.role === "durmah") {
                      copy[lastIdx] = { ...copy[lastIdx], text: accumulated };
                    }
                    return copy;
                  });
                }

                setIsStreaming(false);
              } catch (err: any) {
                console.error("[Durmah] Auto-send error:", err);
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (copy[lastIdx]?.role === "durmah") {
                    copy[lastIdx] = {
                      ...copy[lastIdx],
                      text: "Sorry, I encountered an error analyzing this article. Please try again.",
                    };
                  }
                  return copy;
                });
                setIsStreaming(false);
              }
            })();
          }, 1000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [messages, mode, signedIn, isStreaming, voiceSessionActive]);

  // NEW Phase 3: Listen for CustomEvent-based cross-component communication (e.g., from SmartNewsAgent)
  useEffect(() => {
    const handleDurmahOpen = () => {
      console.log('[Durmah] Received durmah:open event');
      setIsOpen(true);
    };

    const handleDurmahMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ text: string; mode?: 'chat' | 'study' }>;
      const { text, mode: requestedMode } = customEvent.detail || {};

      console.log('[Durmah] Received durmah:message event:', { text: text?.substring(0, 100), mode: requestedMode });

      if (!text || !signedIn) {
        console.warn('[Durmah] Ignoring durmah:message - missing text or user not signed in');
        return;
      }

      // 1. Set mode if requested
      if (requestedMode && (requestedMode === 'chat' || requestedMode === 'study')) {
        setMode(requestedMode);
      }

      // 2. Send message programmatically
      setTimeout(() => {
        if (isStreaming || voiceSessionActive) {
          console.warn('[Durmah] Ignoring durmah:message - already streaming or in voice session');
          return;
        }

        const userText = text.trim();
        const now = Date.now();
        const userMsg: Msg = { role: "you", text: userText, ts: now };
        const assistantId = now + 1;

        const history = [...messages, userMsg];
        setMessages([...history, { role: "durmah", text: "", ts: assistantId }]);
        setInput("");
        setIsStreaming(true);

        // Inline chat send logic
        (async () => {
          try {
            const body = {
              message: userText,
              history: history.map((m) => ({
                role: m.role === "you" ? "user" : "assistant",
                content: m.text,
              })),
              mode: requestedMode || mode,
            };

            const response = await fetch("/api/durmah/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            // /api/durmah/chat returns JSON: { ok: true, reply: "..." }
            const data = await response.json();
            
            if (!data.ok || !data.reply) {
              throw new Error(data.error || "No reply from Durmah");
            }

            // Update message with reply
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === "durmah") {
                copy[lastIdx] = { ...copy[lastIdx], text: data.reply };
              }
              return copy;
            });

            setIsStreaming(false);
          } catch (err: any) {
            console.error("[Durmah] CustomEvent message send error:", err);
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === "durmah") {
                copy[lastIdx] = {
                  ...copy[lastIdx],
                  text: "Sorry, I encountered an error analyzing this article. Please try again.",
                };
              }
              return copy;
            });
            setIsStreaming(false);
          }
        })();
      }, 500); // Short delay to ensure widget is fully open
    };

    // Add listeners
    window.addEventListener('durmah:open', handleDurmahOpen);
    window.addEventListener('durmah:message', handleDurmahMessage as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('durmah:open', handleDurmahOpen);
      window.removeEventListener('durmah:message', handleDurmahMessage as EventListener);
    };
  }, [messages, mode, signedIn, isStreaming, voiceSessionActive]);

  useEffect(() => {
    if (!contextPacket) return;
    const timeZone = contextPacket.academic.timezone || "Europe/London";
    const updateLabel = () => {
      setContextTimeLabel(formatContextDayTimeLabel(new Date(), timeZone));
    };
    updateLabel();
    const interval = window.setInterval(updateLabel, 60_000);
    return () => window.clearInterval(interval);
  }, [contextPacket]);

  // NEW: Fetch Student Context from Phase 1 API
  const fetchStudentContext = useCallback(async () => {
    if (!signedIn || contextLoading) return;
    
    setContextLoading(true);
    try {
      // DETECT ROUTE and build query params
      const currentPath = router.pathname;
      const query = router.query;
      const params = new URLSearchParams();
      
      // YAAG Week View
      if (currentPath ===  '/year-at-a-glance/week' && typeof query.ws === 'string') {
        params.set('focusDate', query.ws);
        params.set('rangeDays', '7');
        params.set('pageHint', 'yaag-week');
      }
      // YAAG Month View  
      else if (currentPath === '/year-at-a-glance/month' && typeof query.ym === 'string') {
        const [year, month] = query.ym.split('-').map(Number);
        if (year && month) {
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          params.set('rangeStart', monthStart.toISOString().substring(0, 10));
          params.set('rangeEnd', monthEnd.toISOString().substring(0, 10));
          params.set('pageHint', 'yaag-month');
        }
      }
      // Assignments Page
      else if (currentPath === '/assignments' && typeof query.assignmentId === 'string') {
        params.set('pageHint', 'assignments');
        params.set('rangeDays', '14');
      }
      // Default: 14 days from today
      else {
        const today = new Date().toISOString().substring(0, 10);
        params.set('focusDate', today);
        params.set('rangeDays', '14');
        params.set('pageHint', 'dashboard');
      }
      
      const url = `/api/durmah/context?${params.toString()}`;
      console.log('[Durmah] Fetching context with params:', params.toString());
      
      const res = await fetch(url);
      if (res.ok) {
        const data: StudentContext = await res.json();
        setStudentContextData(data);
        
        console.log('[Durmah] Context loaded:', {
          yaag: data.yaag ? `${Object.keys(data.yaag.itemsByDay).length} dates` : 'none',
          assignments: data.assignments.total,
          range: data.yaag ? `${data.yaag.rangeStart} to ${data.yaag.rangeEnd}` : 'none'
        });
        
        // Generate proactive greeting ONCE per session
        if (!lastProactiveGreeting) {
          const greeting = generateProactiveGreeting(data);
          if (greeting) {
            setLastProactiveGreeting(greeting);
          }
        }
      } else {
        console.error('Failed to fetch student context:', res.status);
      }
    } catch (error) {
      console.error('Error fetching student context:', error);
    } finally {
      setContextLoading(false);
    }
  }, [signedIn, contextLoading, lastProactiveGreeting, router.pathname, router.query]);

  // Fetch context when widget opens
  useEffect(() => {
    if (isOpen && signedIn && !studentContextData) {
      fetchStudentContext();
    }
  }, [isOpen, signedIn, studentContextData, fetchStudentContext]);

  // Refresh context periodically while widget is open (every 10 minutes)
  useEffect(() => {
    if (!isOpen || !signedIn) return;
    
    const interval = setInterval(() => {
      fetchStudentContext();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isOpen, signedIn, fetchStudentContext]);

  // Ensure browser is allowed to autoplay incoming WebRTC audio
  useEffect(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    el.autoplay = true;
    el.muted = false;
    (el as any).playsInline = true;
  }, []);

  // 2. Memory & Context
  useEffect(() => {
    if (!signedIn || !isOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await resolveAccessToken();
        if (!token) {
          if (!cancelled) setReady(true);
          return;
        }

        const res = await fetchAuthed("/api/durmah/context");
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setReady(true);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const ctx = data?.context as DurmahContextPacket | undefined;
          if (!cancelled && ctx) {
            const mapped = (ctx.recent?.lastMessages || []).map((m) => ({
              role: (m.role === 'assistant' ? 'durmah' : 'you') as "durmah" | "you",
              text: m.content,
              ts: new Date(m.created_at).getTime(),
            }));
            if (mapped.length > 0) {
              setMessages((prev) => (prev.length > 0 ? prev : mapped));
            }
            if (ctx.lastSummary) {
              setMemory({
                last_topic: 'continuation',
                last_message: ctx.lastSummary,
                last_seen_at: ctx.academic.localTimeISO,
              });
            }
            setContextPacket(ctx);
            if (process.env.NODE_ENV !== "production") {
              console.log("[Durmah] Context loaded", {
                displayName: ctx.profile.displayName,
                yearGroup: ctx.profile.yearGroup,
                term: ctx.academic.term,
                weekOfTerm: ctx.academic.weekOfTerm,
                lastThreadId: ctx.threadId,
              });
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
  }, [signedIn, isOpen]);

  // Set initial greeting once ready (context aware)
  useEffect(() => {
    if (!ready || !isOpen) return;
    if (messages.length > 0) return;
    
    // PHASE 3 FIX: Re-enable "greet once per session" guard
    const greetKey = user?.id ? `durmah_greeted_${user.id}` : null;
    if (greetKey && sessionStorage.getItem(greetKey)) {
      // Already greeted this session
      return;
    }

    // Skip greeting if there are recent messages (ongoing conversation)
    if (contextPacket?.recent?.lastMessages?.length) return;

    // Use proactive greeting from StudentContext if available, otherwise fallback
    const greeting = lastProactiveGreeting || 
                     (contextPacket ? buildContextGreeting(contextPacket) : null) ||
                     preset?.welcomeMessage ||
                     "Hey! I'm Durmah, your Durham Law study companion. What can I help with today?";

    // Mark as greeted for this session
    if (greetKey) sessionStorage.setItem(greetKey, "1");

    setMessages((prev) => [
      ...prev,
      { role: "durmah", text: greeting, ts: Date.now() },
    ]);
  }, [
    ready,
    isOpen,
    contextPacket,
    preset,
    studentContext,
    memory,
    upcomingTasks,
    todaysEvents,
    user?.id,
    messages.length,
  ]);

  useEffect(() => {
    if (authError) {
      toast.error("Your session expired. Please sign in again.");
    }
  }, [authError]);


  // 3. Voice Hook - System prompt with FULL student context
  const systemPrompt = useMemo(() => {
    // 1. Core Identity & Ethics (Base)
    const basePrompt = buildDurmahSystemPrompt();
    
    // 2. LISTEN FIRST Protocol (Critical Override)
    const listenFirstProtocol = `
CRITICAL VOICE INSTRUCTIONS:
1. LISTEN FIRST: Start every response by briefly acknowledging what the user said (e.g., "Got it," "I see," "Right,").
2. NO LECTURING IN CHAT MODE: If the user is just chatting or giving updates, DO NOT pivot to law topics.
3. HANDLING INTERRUPTIONS: If the user says "Stop", "No", or "Not that", stop immediately and ask for clarification.
4. CONFIRMATION: If you are unsure what the user said, ask a clarifying question instead of guessing.
`;

    // 3. Mode-Specific Instructions
    let modeInstructions = "";
    if (mode === 'chat') {
      modeInstructions = `
CURRENT MODE: CHAT (Conversational)
- You are a friendly listener first.
- Context is provided only for reference; do NOT use it to lecture.
- Discuss the user's life, updates, or feelings if they bring them up.
- ONLY discuss law if explicitly asked.
- Keep responses short (1-2 sentences).
`;
    } else {
      modeInstructions = `
CURRENT MODE: STUDY (Tutor)
- You are an active legal mentor.
- detailed academic context is provided below.
- Proactively guide the user through their schedule, assignments, and law concepts.
- Use the Stepwise Teaching method.
`;
    }

    // 4. Context Logic
    let contextBlock = "";
    if (studentContextData) {
      if (mode === 'chat') {
        // Minimal Context for Chat Mode (Prevent Hijacking)
        contextBlock = `
MINIMAL CONTEXT (Chat Mode):
User: ${studentContextData.student.displayName}
Date: ${studentContextData.academic?.now?.nowText || studentContextData.student.localTimeISO}
(Full academic data hidden to prevent distraction)
`;
      } else {
        // Full Context for Study Mode
        contextBlock = buildDurmahContextBlock(studentContextData);
      }
    }
    
    return `${listenFirstProtocol}\n\n${modeInstructions}\n\n${basePrompt}\n\n${contextBlock}`;
  }, [studentContextData, mode]);

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

  // Choose voice name based on provider
  const voiceName = VOICE_PROVIDER === 'gemini' 
    ? (preset?.geminiVoice || 'Puck') 
    : (preset?.openaiVoice || 'alloy');

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
    voice: voiceName, // Use provider-specific voice
    audioRef,
    onTurn: (turn) => {
      appendTranscriptTurn(
        turn.speaker === "user" ? "you" : "durmah",
        turn.text
      );
    },
  });

  const isVoiceActive = isListening || status === "connecting";
  const showVoiceStatus = status !== "idle";
  const voiceErrorShort = voiceError
    ? voiceError.replace(/\s+/g, " ").slice(0, 48)
    : "";
  const voiceStatusLabel =
    status === "connecting"
      ? "Connecting..."
      : status === "error"
        ? `Voice error${voiceErrorShort ? `: ${voiceErrorShort}` : ""}`
        : speaking
          ? "Speaking"
          : status === "listening"
            ? "Connected"
            : "Idle";
  const voiceStatusClass =
    status === "error"
      ? "text-red-200"
      : status === "connecting"
        ? "text-yellow-100"
        : "text-emerald-100";

  const contextChipText = useMemo(() => {
    if (!contextPacket) return null;
    const time =
      contextTimeLabel ||
      formatContextDayTimeLabel(
        new Date(),
        contextPacket.academic.timezone || "Europe/London"
      );
    return buildContextChipText(contextPacket, time);
  }, [contextPacket, contextTimeLabel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
      stopListening();
    };
  }, [stopListening]);

  // ----------------------------
  // EVENT BRIDGE: Listen for custom events from other components
  // (e.g., SmartNewsAgent triggering Durmah with article context)
  // ----------------------------
  useEffect(() => {
    function handleDurmahOpen() {
      setIsOpen(true);
    }

    function handleDurmahMessage(event: Event) {
      const customEvent = event as CustomEvent;
      const { text, mode: requestedMode } = customEvent.detail || {};
      
      if (!text) return;

      // Set mode if specified
      if (requestedMode && (requestedMode === 'chat' || requestedMode === 'study')) {
        setMode(requestedMode);
      }

      // Set input
      setInput(text);

      // Auto-send after brief delay to ensure state updates and widget is open
      setTimeout(() => {
        if (text && signedIn && !isStreaming) {
          send();
        }
      }, 200);
    }

    window.addEventListener('durmah:open', handleDurmahOpen);
    window.addEventListener('durmah:message', handleDurmahMessage);

    return () => {
      window.removeEventListener('durmah:open', handleDurmahOpen);
      window.removeEventListener('durmah:message', handleDurmahMessage);
    };
  }, [signedIn, isStreaming]);


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
    if (!isVoiceActive) {
      setCallTranscript([]);
      setShowVoiceTranscript(false);
      setVoiceSessionActive(true);
      setVoiceSessionHadTurns(false);
      setVoiceSessionEndedAt(null);
      setVoiceSessionStartedAt(new Date());
      setVoiceSessionId(createVoiceSessionId());
      
      // TIMEZONE TRUTH: Refresh context before voice to get fresh NOW packet
      try {
        const res = await fetchAuthed("/api/durmah/context");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setStudentContextData(data);
            console.log("[DurmahVoice] NOW from server context:", data.academic?.now?.nowText || "missing");
          }
        }
      } catch (err) {
        console.warn("[DurmahVoice] Could not refresh context:", err);
      }
      
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
    if (isVoiceActive || previewingVoiceId === preset.id) return;

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
          const token = await resolveAccessToken();
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
          setMemory((prev: any) => ({ ...prev, last_topic: topic, last_message: lastUser.text }));
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
  
  // CLEAR CHAT - Clears entire conversation history
  const clearChat = async () => {
    if (!confirm('Clear entire conversation? This cannot be undone.')) return;
    
    setMessages([]);
    setCallTranscript([]);
    
    // Also clear from database
    if (user?.id && supabaseClient) {
      try {
        await supabaseClient
          .from('durmah_messages')
          .delete()
          .eq('user_id', user.id);
        toast.success('Chat cleared');
      } catch (err) {
        console.error('[DurmahWidget] Failed to clear messages:', err);
      }
    }
  };

  // SEED TIMETABLE (DEV ONLY) - Uses DB RPC for timezone-correct seeding
  // ----------------------------
  const seedTimetable = async () => {
    if (!user?.id) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const { data, error } = await supabaseClient.rpc('seed_timetable_events_v1', {
        mode: 'epiphany2026'
      });

      if (error) {
        console.error("[SeedTimetable] RPC error:", error);
        toast.error("Failed to seed timetable: " + error.message);
        return;
      }

      toast.success(`Timetable seeded (${data} events)`);

      // Refetch context to update schedule
      try {
        const token = await resolveAccessToken();
        if (!token) return;

        const res = await fetchAuthed("/api/durmah/context");
        if (res.ok) {
          const data = await res.json();
          const ctx = data?.context;
          if (ctx) {
            setContextPacket(ctx);
            if (process.env.NODE_ENV !== "production") {
              console.log("[DurmahWidget] Context refetched after seed:", {
                scheduleCount: ctx.schedule?.weekPreview?.length || 0,
                nextClassLabel: ctx.schedule?.nextClassLabel,
              });
            }
          }
        }
      } catch (e) {
        console.error("[SeedTimetable] Failed to refetch context:", e);
      }

      // Close menu
      setShowHeaderMenu(false);
    } catch (err: any) {
      console.error("[SeedTimetable] Unexpected error:", err);
      toast.error("Failed to seed timetable");
    }
  };

  // RESET TIMETABLE (DEV ONLY) - Clears and reseeds
  // ----------------------------
  const resetTimetable = async () => {
    if (!user?.id) {
      toast.error("Not authenticated");
      return;
    }

    try {
      // First clear
      const { data: cleared, error: clearError } = await supabaseClient.rpc('clear_timetable_events_v1');

      if (clearError) {
        console.error("[ResetTimetable] Clear error:", clearError);
        toast.error("Failed to clear timetable: " + clearError.message);
        return;
      }

      console.log(`[ResetTimetable] Cleared ${cleared} events`);

      // Then seed
      const { data: seeded, error: seedError } = await supabaseClient.rpc('seed_timetable_events_v1', {
        mode: 'epiphany2026'
      });

      if (seedError) {
        console.error("[ResetTimetable] Seed error:", seedError);
        toast.error("Failed to seed timetable: " + seedError.message);
        return;
      }

      toast.success(`Timetable reset (cleared ${cleared}, seeded ${seeded})`);

      // Refetch context
      try {
        const token = await resolveAccessToken();
        if (!token) return;

        const res = await fetchAuthed("/api/durmah/context");
        if (res.ok) {
          const data = await res.json();
          const ctx = data?.context;
          if (ctx) {
            setContextPacket(ctx);
            if (process.env.NODE_ENV !== "production") {
              console.log("[DurmahWidget] Context refetched after reset:", {
                scheduleCount: ctx.schedule?.weekPreview?.length || 0,
                nextClassLabel: ctx.schedule?.nextClassLabel,
              });
            }
          }
        }
      } catch (e) {
        console.error("[ResetTimetable] Failed to refetch context:", e);
      }

      // Close menu
      setShowHeaderMenu(false);
    } catch (err: any) {
      console.error("[ResetTimetable] Unexpected error:", err);
      toast.error("Failed to reset timetable");
    }
  };


  // ----------------------------
  // TEXT CHAT SEND
  // ----------------------------
  async function send() {
    if (!signedIn || !input.trim() || isStreaming || isVoiceActive) return;

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
        setMemory((prev: any) => ({ ...prev, last_topic: inferredTopic, last_message: userText }));
      } catch {}
    })();

    // ----------------------------
    // ONBOARDING SEARCH INTEGRATION
    // Detect help/system queries and enrich with guide content
    // ----------------------------
    let enrichedMessage = userText;
    const helpKeywords = [
      'how do i', 'how to', 'where do i', 'where can i',
      'sync', 'timetable', 'blackboard', 'panopto', 
      'assignment', 'upload', 'import', 'download',
      'find', 'access', 'connect', 'enrol'
    ];
    const lowerMessage = userText.toLowerCase();
    const isHelpQuery = helpKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isHelpQuery) {
      try {
        const searchRes = await fetchAuthed('/api/durmah/onboarding-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userText, limit: 3 })
        });

        if (searchRes.ok) {
          const { results } = await searchRes.json();
          
          if (results && results.length > 0) {
            // Format guides as context for Durmah
            const guidesContext = results.map((guide: any, i: number) => `
Guide ${i + 1}: ${guide.title}
Summary: ${guide.summary}
Content (excerpt): ${guide.content_markdown.substring(0, 800)}
Link: /onboarding?guide=${guide.slug}
`).join('\n---\n');

            // Prepend system instruction to use guides
            enrichedMessage = `[SYSTEM CONTEXT: You have access to ${results.length} relevant help guide(s) from the MyDurhamLaw onboarding knowledge base. Use these to answer the user's question with exact step-by-step instructions. Include a link to the full guide.

${guidesContext}

INSTRUCTIONS: 
1. Answer using the step-by-step instructions from the guide(s) above
2. Format your response clearly with numbered steps or bullet points
3. Include at end: "Full guide: /onboarding?guide={slug}"
4. Cite source: "From: [guide title]"
5. Do NOT invent additional steps not in the guides]

User question: ${userText}`;
          }
        }
      } catch (error) {
        console.error('[DurmahWidget] Onboarding search failed:', error);
        // Fall through to regular chat
      }
    }

    try {
      const authError = "Please sign in again to chat with Durmah.";
      const { token } = await waitForAccessToken();
      if (!token) {
        toast.error(authError);
        throw new Error(authError);
      }

      const response = await fetchAuthed("/api/durmah/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: enrichedMessage, source: "dashboard" }),
      });

      if (response.status === 401 || response.status === 403) {
        toast.error(authError);
        throw new Error(authError);
      }
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

  //  1. Logged-out Modal
  if (isOpen && !signedIn) {
    return (
      <div className="fixed bottom-24 right-6 z-[45] flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
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
      <div className="fixed bottom-20 right-6 z-[50] flex flex-col items-end group">
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
            isVoiceActive 
              ? "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse text-white" 
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          }`}
        >
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
             <span className="font-serif text-xl font-bold italic">D</span>
             {isVoiceActive && (
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
    <div className="fixed bottom-24 right-6 z-[45] flex w-full max-w-md flex-col overflow-visible rounded-3xl border border-violet-100 bg-white shadow-2xl sm:w-[400px] max-h-[80vh] h-[600px] animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Premium Header Ribbon */}
      <header className="relative flex-none flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-5 py-4 text-white shadow-md z-30">
        <div className="flex flex-col">
          <div className="font-bold text-lg flex items-center gap-2">
            Durmah
            <span className="bg-white/20 backdrop-blur-sm rounded-full text-[10px] px-2 py-0.5 font-medium tracking-wide">BETA</span>
          </div>
          <span className="text-xs text-violet-100 font-medium">Your Legal Mentor</span>
          
          {contextChipText && (
            <div className="mt-1 inline-flex self-start items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70 backdrop-blur-sm">
              {contextChipText}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="mt-2 flex bg-black/20 rounded-lg p-0.5 self-start backdrop-blur-sm border border-white/10">
            <button 
              onClick={(e) => { e.stopPropagation(); setMode('chat'); }}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'chat' ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-100 hover:bg-white/10'}`}
            >
              Chat
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setMode('study'); }}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'study' ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-100 hover:bg-white/10'}`}
            >
              Study
            </button>
          </div>

          {showVoiceStatus && (
            <span className={`text-[10px] font-medium ${voiceStatusClass}`}>
              {voiceStatusLabel}
            </span>
          )}
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
                  className="px-4 py-2.5 hover:bg-violet-50 flex items-center justify-between"
                  onClick={() => setShowHeaderMenu(false)}
                >
                  Transcript Library
                  <ArrowRight size={14} className="text-violet-500" />
                </Link>
                {user?.email === "mohan0265@gmail.com" && (
                  <>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-violet-50 flex items-center justify-between border-t border-violet-100"
                      onClick={seedTimetable}
                    >
                      Seed Timetable (dev)
                      <Zap size={14} className="text-amber-500" />
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-violet-50 flex items-center justify-between"
                      onClick={resetTimetable}
                    >
                      Reset Timetable (dev)
                      <RefreshCw size={14} className="text-red-500" />
                    </button>
                  </>
                )}
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
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
              isVoiceActive 
                ? "bg-red-500 text-white shadow-lg scale-110" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={isVoiceActive ? "End voice chat" : "Start voice chat"}
          >
            {isVoiceActive ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                </div>
                <span className="text-xs font-medium">End Voice Chat</span>
              </>
            ) : (
              <span className="text-sm font-medium">Mic</span>
            )}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Minimize (voice continues)"
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
                             disabled={Boolean(isPreviewing) || isVoiceActive}
                             className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                               isPreviewing || isVoiceActive 
                                 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                 : "bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"
                             }`}
                          >
                             {isPreviewing ? (
                               <>
                                 <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                                 Playing...
                               </>
                             ) : isVoiceActive ? (
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

          <div className="flex justify-between gap-3 pt-3 mt-2 border-t border-violet-200/50 sticky bottom-0 bg-violet-50/0">
            <button
              onClick={clearChat}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-600  hover:bg-gray-200/50 transition-colors flex items-center gap-1"
              title="Clear entire conversation"
            >
              <Trash2 size={12} />
              Clear Chat
            </button>
            <div className="flex gap-2">
              <button
                onClick={discardVoiceTranscript}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-200/50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={saveVoiceTranscript}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all hover:shadow-lg hover:scale-105 flex items-center gap-1.5"
              >
                <Check size={14} className="stroke-[3]" />
                Save to Chat
              </button>
            </div>
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
      {!isVoiceActive && !showSettings && (
        <div className="flex-none flex gap-2 overflow-x-auto p-3 border-t border-gray-100 bg-white no-scrollbar z-10">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => {
                setInput(c);
                if (c.includes('Review') || c.includes('plan') || c.includes('quiz')) {
                    setMode('study');
                }
              }}
              className="whitespace-nowrap text-xs font-medium px-4 py-2 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* --------------- TEXT INPUT BAR ---------------- */}
      {!isVoiceActive && !showSettings && (
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
      {isVoiceActive && !showSettings && (
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
            {status === "connecting"
              ? "Connecting..."
              : speaking
                ? "Durmah is speaking..."
                : "Listening..."}
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
