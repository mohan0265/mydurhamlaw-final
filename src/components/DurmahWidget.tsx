import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useDurmahRealtime } from "@/hooks/useDurmahRealtime";
import { useDurmahGeminiLive } from "@/hooks/useDurmahGeminiLive"; // NEW: Gemini Live
import { useDurmahDynamicContext } from "@/hooks/useDurmahDynamicContext";
import { useDurmahChat, DurmahMessage } from "@/hooks/useDurmahChat"; // UNIFIED HOOK
import { useDurmah } from "@/lib/durmah/context";
import { fetchAuthed } from "@/lib/fetchAuthed";
import { waitForAccessToken } from "@/lib/auth/waitForAccessToken";
import { normalizeTranscriptLanguage } from "@/lib/durmah/normalizeTranscriptLanguage";
import {
  buildDurmahSystemPrompt,
  buildDurmahContextBlock,
  generateProactiveGreeting,
} from "@/lib/durmah/systemPrompt";
import { DELIVERY_STYLES, SPEEDS } from "@/lib/voiceCatalog";
import type { StudentContext } from "@/types/durmahContext";
import type { DurmahContextPacket } from "@/types/durmah";
import { formatTodayForDisplay } from "@/lib/durmah/phase";
import { useDurmahSettings } from "@/hooks/useDurmahSettings";
import {
  Settings,
  X,
  ArrowRight,
  AlertTriangle,
  Check,
  Volume2,
  Brain,
  Zap,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Smile,
  CheckSquare,
  Square,
  Save,
  Bookmark,
  BookmarkX,
  Filter,
  Minimize2,
  GripVertical,
  Minus,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { getSupabaseClient } from "@/lib/supabase/client";
import SaveConversationModal from "@/components/SaveConversationModal"; // NEW: Session save modal
import SaveToFolderModal from "@/components/durmah/SaveToFolderModal";

// Voice Provider Selection - Forced to OpenAI for production quality and feature support
// Gemini provider logic is kept in hooks but disabled in UI to avoid confusion.
const VOICE_PROVIDER = "openai";
const useVoiceHook = useDurmahRealtime;
console.log("[DurmahWidget] Voice provider locked to:", VOICE_PROVIDER);

type Msg = {
  id?: string;
  role: "durmah" | "you";
  text: string;
  ts: number;
  saved_at?: string | null;
  session_id?: string;
};

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(" ");
}

const supabaseClient = getSupabaseClient();

const DEDUPE_WINDOW_MS = 2000;

function normalizeTurnText(text: string) {
  return (text || "")
    .replace(/\s+([,.!?;:])/g, "$1") // Remove space before punctuation
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

function isDuplicateTurn(
  existing: Msg[],
  role: Msg["role"],
  normalizedText: string,
  ts: number,
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
  timeLabel: string | null,
) {
  if (!context) return null;
  const termLabel =
    context.academic.term === "Unknown"
      ? "Unknown term"
      : context.academic.term;
  const weekLabel = context.academic.weekOfTerm
    ? `Week ${context.academic.weekOfTerm}`
    : null;
  const parts = [termLabel, weekLabel, timeLabel].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" | ") : null;
}

function buildContextGreeting(context: DurmahContextPacket | null) {
  if (!context) {
    return "Hi! I'm loading your student context to better assist you...";
  }

  const profile = context.profile || {};
  const academic = context.academic || {};
  const name = (
    profile.displayName ||
    profile.display_name ||
    "Student"
  ).trim();
  const greetingName = name || (profile as any).display_name || "Student";

  const term = academic.term || "your term";
  const weekLabel = academic.weekOfTerm ? `Week ${academic.weekOfTerm}` : "";
  const timeOfDay = academic.timeOfDay || "day";

  // Continuity check
  const lastIntent = context.continuity?.lastUserIntent;
  const followUp =
    context.continuity?.followUpQuestion || "Want to continue from there?";

  if (lastIntent) {
    return `Hi ${greetingName} - last time we discussed ${lastIntent}. ${followUp}`;
  }

  const termPhrase = weekLabel ? `${term} ${weekLabel}` : term;
  return `Hi ${greetingName} - it's ${timeOfDay} and we're in ${termPhrase}. Want to review this week, plan your study, or practice a quick quiz?`;
}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  const signedIn = !!user?.id;

  // 1. Source Context
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents, authError } = useDurmahDynamicContext();
  const {
    preset,
    deliveryStyleId,
    deliveryStyle,
    speed,
    updateSettings,
    availablePresets,
    voiceId,
  } = useDurmahSettings();

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
    // FIX: Safely access window context
    const base = durmahCtx.hydrated
      ? durmahCtx
      : typeof window !== "undefined"
        ? (window as any).__mdlStudentContext
        : null;

    // Robust name resolution
    const rawName =
      (base as any)?.profile?.displayName ||
      base?.firstName ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "Student";

    // Robust role resolution
    const rawRole =
      base?.yearKey || (base as any)?.profile?.yearGroup || "Law Student";

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
        todaysEvents: [],
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
      nowPhase: base?.nowPhase || ("term time" as any),
      currentPhase: base?.nowPhase || "Unknown Term",
      keyDates: base?.keyDates,
      todayLabel: formatTodayForDisplay(),
      upcomingTasks,
      todaysEvents,
    };
  }, [durmahCtx, user, upcomingTasks, todaysEvents]);

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"chat" | "study" | "NEWS_STRICT">("chat");

  // NEW: Session Management State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSessionSaved, setIsSessionSaved] = useState(false);

  // Explorer Upgrade State
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [transcriptForFolder, setTranscriptForFolder] = useState<any>(null);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);

  // EMERGENCY STABILIZATION: ERROR STATE GATING
  const [contextError, setContextError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasFetchedRef = useRef(false);

  // Generate new session ID on widget open
  useEffect(() => {
    if (isOpen && !currentSessionId) {
      const newSessionId = crypto.randomUUID();
      setCurrentSessionId(newSessionId);
      setIsSessionSaved(false); // Reset saved status for new session
    }
  }, [isOpen, currentSessionId]);

  // UNIFIED CHAT HOOK with session management
  const {
    messages: unifiedMessages,
    sendMessage,
    logMessage,
    isLoading: chatIsLoading,
    toggleSaveMetadata,
    clearUnsaved,
    deleteMessages,
    refetchMessages,
    conversationId,
    createSession,
    saveSession,
    discardSession,
  } = useDurmahChat({
    source: "widget",
    scope: "global",
    context: {
      mode,
      lectureId: router.pathname.includes("/study/lectures")
        ? (router.query.id as string)
        : undefined,
      assignmentId: router.pathname.includes("/assignments")
        ? (router.query.assignmentId as string)
        : undefined,
    },
    sessionId: currentSessionId,
    skipAutoFetch: true, // Don't auto-load old messages
  });

  const scope = "global";

  // Map unified messages to legacy Msg format for UI compatibility
  const messages = useMemo<Msg[]>(() => {
    return unifiedMessages.map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "durmah" : "you",
      text: m.content,
      ts: new Date(m.created_at).getTime(),
      saved_at: m.saved_at,
    }));
  }, [unifiedMessages]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTranscript, setCallTranscript] = useState<Msg[]>([]);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [voiceSessionHadTurns, setVoiceSessionHadTurns] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceSessionStartedAt, setVoiceSessionStartedAt] =
    useState<Date | null>(null);
  const [voiceSessionEndedAt, setVoiceSessionEndedAt] = useState<Date | null>(
    null,
  );
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [memory, setMemory] = useState<{
    last_topic?: string;
    last_message?: string;
    last_seen_at?: string;
  } | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(
    null,
  );
  const [contextPacket, setContextPacket] =
    useState<DurmahContextPacket | null>(null);
  const [contextTimeLabel, setContextTimeLabel] = useState<string | null>(null);

  const [studentContextData, setStudentContextData] =
    useState<DurmahContextPacket | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [lastProactiveGreeting, setLastProactiveGreeting] = useState<
    string | null
  >(null);

  // Select-to-Save State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"session" | "saved">("session");

  // Desktop Resize State (default dimensions from CSS)
  const DEFAULT_WIDTH = 400;
  const DEFAULT_HEIGHT = 600;
  const [widgetSize, setWidgetSize] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isResized, setIsResized] = useState(false);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const resetWidgetSize = () => {
    setWidgetSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    setIsResized(false);
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX =
      "touches" in e && e.touches[0]
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e && e.touches[0]
        ? e.touches[0].clientY
        : (e as React.MouseEvent).clientY;

    resizeRef.current = {
      startX: clientX,
      startY: clientY,
      startW: widgetSize.width,
      startH: widgetSize.height,
    };

    const handleResizeMove = (moveE: MouseEvent | TouchEvent) => {
      if (!resizeRef.current) return;
      const moveX =
        "touches" in moveE && moveE.touches[0]
          ? moveE.touches[0].clientX
          : (moveE as MouseEvent).clientX;
      const moveY =
        "touches" in moveE && moveE.touches[0]
          ? moveE.touches[0].clientY
          : (moveE as MouseEvent).clientY;

      // Resize from top-left corner (widget is anchored bottom-right)
      const deltaX = resizeRef.current.startX - moveX;
      const deltaY = resizeRef.current.startY - moveY;

      const newWidth = Math.max(
        350,
        Math.min(800, resizeRef.current.startW + deltaX),
      );
      const newHeight = Math.max(
        400,
        Math.min(900, resizeRef.current.startH + deltaY),
      );

      setWidgetSize({ width: newWidth, height: newHeight });
      if (newWidth !== DEFAULT_WIDTH || newHeight !== DEFAULT_HEIGHT) {
        setIsResized(true);
      }
    };

    const handleResizeEnd = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("touchmove", handleResizeMove);
      document.removeEventListener("touchend", handleResizeEnd);
    };

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
    document.addEventListener("touchmove", handleResizeMove);
    document.addEventListener("touchend", handleResizeEnd);
  };

  // Session ID
  const sessionIdRef = useRef<string>("");
  useEffect(() => {
    if (!sessionIdRef.current && typeof crypto !== "undefined") {
      try {
        sessionIdRef.current = crypto.randomUUID();
      } catch (e) {
        sessionIdRef.current = Date.now().toString();
      }
    }
  }, []);

  // Helper to get a stable message key (prefer DB id, fallback to timestamp)
  const getMessageKey = (m: Msg): string => m.id || m.ts.toString();

  const toggleSelection = (key: string) => {
    if (!key) return;
    const next = new Set(selectedIds);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedIds(next);
  };

  const selectAllMessages = () => {
    const allKeys = messages.map((m) => getMessageKey(m));
    setSelectedIds(new Set(allKeys));
  };

  const deselectAllMessages = () => {
    setSelectedIds(new Set());
  };

  const handleManageAction = async (
    action: "save" | "unsave" | "delete_selected" | "clear_unsaved",
  ) => {
    if (
      (action === "delete_selected" ||
        action === "save" ||
        action === "unsave") &&
      selectedIds.size === 0
    )
      return;

    const toastId = toast.loading("Processing...");

    try {
      // Bulk processing via hook (toggleSaveMetadata)
      const ids = Array.from(selectedIds);
      let failureCount = 0;

      if (action === "save" || action === "unsave") {
        for (const id of ids) {
          const m = messages.find((msg) => msg.id === id);
          if (!m) continue;

          // Only toggle if state differs
          if (action === "save" && !m.saved_at) {
            const success = await toggleSaveMetadata(id, "ephemeral", true); // Silent
            if (!success) failureCount++;
          } else if (action === "unsave" && m.saved_at) {
            const success = await toggleSaveMetadata(id, "saved", true); // Silent
            if (!success) failureCount++;
          }
        }
        // Refresh state to ensure consistency
        refetchMessages();
      } else if (action === "delete_selected") {
        await deleteMessages(ids);
      } else if (action === "clear_unsaved") {
        await clearUnsaved();
      }

      if (failureCount > 0) {
        toast.error(
          `Some messages (${failureCount}) failed to save. Check RLS.`,
          { id: toastId },
        );
      } else {
        toast.success("Done", { id: toastId });
      }
      if (action === "save") {
        setIsSessionSaved(true);
      }
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error("[Durmah Manage] Error:", err);
      toast.error("Error", { id: toastId });
    }
  };

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
      const audio = document.createElement("audio");
      audio.style.display = "none";
      audio.id = "durmah-persistent-audio";
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
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, ready, isOpen]);

  // Voice transcript auto-scroll
  useEffect(() => {
    if (showVoiceTranscript) {
      const anchor = document.getElementById("voice-scroll-anchor");
      anchor?.scrollIntoView({ behavior: "smooth" });
    }
  }, [callTranscript, showVoiceTranscript]);

  useEffect(() => {
    if (!signedIn) {
      setContextPacket(null);
      setContextTimeLabel(null);
    }
  }, [signedIn]);

  // Listen for OPEN_DURMAH postMessage from other components (e.g., news feed)
  // Listen for OPEN_DURMAH postMessage from other components (e.g., news feed) -> Now handled by custom event bridge below
  // effectively deprecated by Phase 3 logic
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      // Legacy support: if still receiving OPEN_DURMAH, forward to CustomEvent
      if (event.data?.type === "OPEN_DURMAH") {
        const { mode: reqMode, autoMessage } = event.data.payload || {};
        if (reqMode) setMode(reqMode);
        setIsOpen(true);
        if (autoMessage && typeof autoMessage === "string" && signedIn) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("durmah:message", {
                detail: { text: autoMessage, mode: reqMode },
              }),
            );
          }, 500);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [signedIn]);

  // NEW Phase 3: Listen for CustomEvent-based cross-component communication (e.g., from SmartNewsAgent)
  useEffect(() => {
    const handleDurmahOpen = () => {
      console.log("[Durmah] Received durmah:open event");
      setIsOpen(true);
    };

    const handleDurmahMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{
        text: string;
        mode?: "chat" | "study";
      }>;
      const { text, mode: requestedMode } = customEvent.detail || {};

      console.log("[Durmah] Received durmah:message event:", {
        text: text?.substring(0, 100),
        mode: requestedMode,
      });

      if (!text || !signedIn) {
        console.warn(
          "[Durmah] Ignoring durmah:message - missing text or user not signed in",
        );
        return;
      }

      // 1. Set mode if requested
      if (
        requestedMode &&
        (requestedMode === "chat" || requestedMode === "study")
      ) {
        setMode(requestedMode);
      }

      // 2. Send message programmatically
      setTimeout(() => {
        if (isStreaming || voiceSessionActive) {
          console.warn(
            "[Durmah] Ignoring durmah:message - already streaming or in voice session",
          );
          return;
        }

        const userText = text.trim();
        setInput(""); // Clear input (optimistic)
        setIsStreaming(true);

        (async () => {
          try {
            await sendMessage(userText, "text");
          } catch (err: any) {
            console.error("[Durmah] CustomEvent message send error:", err);
            toast.error("Failed to send message from external source");
          } finally {
            setIsStreaming(false);
          }
        })();
      }, 500); // Short delay to ensure widget is fully open
    };

    // Add listeners
    window.addEventListener("durmah:open", handleDurmahOpen);
    window.addEventListener(
      "durmah:message",
      handleDurmahMessage as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener("durmah:open", handleDurmahOpen);
      window.removeEventListener(
        "durmah:message",
        handleDurmahMessage as EventListener,
      );
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

  // FIX: Use ref to track loading state to avoid dependency loop in useCallback
  const contextLoadingRef = useRef(false);
  // STRICT GUARD: Track if we have already fetched for this "open session"
  const hasFetchedSessionRef = useRef(false);

  // Reset fetch guard when widget closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedSessionRef.current = false;
    }
  }, [isOpen]);

  // NEW: Fetch Student Context from Phase 1 API
  const fetchStudentContext = useCallback(async () => {
    // STRICT GUARD: fail-stop and single-flight
    if (fatalError) return;
    if (hasFetchedRef.current) return;

    // Only fetch if open, signed in, not loading
    if (!signedIn || contextLoadingRef.current) return;

    hasFetchedRef.current = true; // Mark as fetched immediately to prevent loops
    contextLoadingRef.current = true;
    setContextLoading(true);
    setContextError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // ... [DETECT ROUTE logic unchanged] ...
      const currentPath = router.pathname;
      const query = router.query;
      const params = new URLSearchParams();

      if (
        currentPath === "/year-at-a-glance/week" &&
        typeof query.ws === "string"
      ) {
        params.set("focusDate", query.ws);
        params.set("rangeDays", "7");
        params.set("pageHint", "yaag-week");
      } else if (
        currentPath === "/year-at-a-glance/month" &&
        typeof query.ym === "string"
      ) {
        const [year, month] = query.ym.split("-").map(Number);
        if (year && month) {
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          params.set("rangeStart", monthStart.toISOString().substring(0, 10));
          params.set("rangeEnd", monthEnd.toISOString().substring(0, 10));
          params.set("pageHint", "yaag-month");
        }
      } else if (
        currentPath === "/assignments" &&
        typeof query.assignmentId === "string"
      ) {
        params.set("pageHint", "assignments");
        params.set("rangeDays", "14");
      } else if (
        currentPath.includes("/study/lectures/") ||
        (query.id &&
          (currentPath === "/study/lectures/[id]" ||
            router.asPath.includes("/study/lectures/")))
      ) {
        const lectureId = typeof query.id === "string" ? query.id : null;
        if (lectureId) {
          params.set("pageHint", "lecture");
          params.set("lectureId", lectureId);
          params.set("rangeDays", "7");
        } else {
          params.set("focusDate", new Date().toISOString().substring(0, 10));
          params.set("rangeDays", "14");
          params.set("pageHint", "dashboard");
        }
      } else {
        params.set("focusDate", new Date().toISOString().substring(0, 10));
        params.set("rangeDays", "14");
        params.set("pageHint", "dashboard");
      }

      const url = `/api/durmah/context?${params.toString()}`;
      console.log("[Durmah] Fetching context with params:", params.toString());

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        setContextError("Please sign in again");
        setFatalError("auth_failure");
        return;
      }

      if (!res.ok) {
        setContextError("Temporarily unavailable");
        setFatalError(`fetch_failure_${res.status}`);
        return;
      }

      const data = await res.json();
      // Ensure we set the full response object which contains context keys at the top level
      setStudentContextData(data);

      console.log("[Durmah] Context loaded");

      if (!lastProactiveGreeting) {
        const greeting = generateProactiveGreeting(data as any);
        if (greeting) {
          setLastProactiveGreeting(greeting);
        }
      }
    } catch (error: any) {
      setFatalError("exception_in_fetch");
      if (error.name === "AbortError") {
        console.error("Durmah context fetch timed out");
        setContextError("Connection timeout");
      } else {
        console.error("Error fetching student context:", error);
        setContextError("Service error");
      }
    } finally {
      clearTimeout(timeoutId);
      contextLoadingRef.current = false;
      setContextLoading(false);
    }
  }, [
    signedIn,
    lastProactiveGreeting,
    router.pathname,
    router.query,
    studentContextData,
  ]); // Removed contextLoading

  // Fetch context when widget opens
  useEffect(() => {
    if (
      isOpen &&
      signedIn &&
      !studentContextData &&
      !contextLoadingRef.current
    ) {
      fetchStudentContext();
    }
  }, [isOpen, signedIn, studentContextData, fetchStudentContext]);

  // Refresh context periodically while widget is open (every 10 minutes)
  useEffect(() => {
    if (!isOpen || !signedIn) return;

    const interval = setInterval(
      () => {
        fetchStudentContext();
      },
      10 * 60 * 1000,
    ); // 10 minutes

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

  // SET INITIAL READINESS
  useEffect(() => {
    if (signedIn) {
      setReady(true);
    }
  }, [signedIn]);

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
    const greeting =
      lastProactiveGreeting ||
      (contextPacket ? buildContextGreeting(contextPacket) : null) ||
      preset?.welcomeMessage ||
      "Hey! I'm Durmah, your Durham Law study companion. What can I help with today?";

    // Mark as greeted for this session
    if (greetKey) sessionStorage.setItem(greetKey, "1");

    // Proactive greeting handled by hook (or manual send if absolutely needed)
    // Only send if history is empty
    if (unifiedMessages.length === 0) {
      sendMessage(greeting, "text").catch(console.error);
    }
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
    if (mode === "chat") {
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
- Detailed academic context is provided below.
- Proactively guide the user through their schedule, assignments, and law concepts.
- Use the Stepwise Teaching method.
- STRICTLY FOLLOW THE VOICE EFFICIENCY PROTOCOL: Ask for 1-sentence goals, drill in batches of 3, and provide a 5-bullet summary + 3 drills at the end.
`;
    }

    // 4. Context Logic
    let contextBlock = "";
    if (studentContextData) {
      if (mode === "chat") {
        // Minimal Context for Chat Mode (Prevent Hijacking)
        contextBlock = `
MINIMAL CONTEXT (Chat Mode):
User: ${studentContextData?.profile?.displayName ?? studentContextData?.profile?.display_name ?? "Student"}
Date: ${(studentContextData.academic as any)?.now?.nowText || studentContextData.academic?.localTimeISO || "now"}
(Full academic data hidden to prevent distraction)
`;
      } else {
        // Full Context for Study Mode
        contextBlock = buildDurmahContextBlock(studentContextData as any);
      }
    }

    return `${listenFirstProtocol}\n\n${modeInstructions}\n\n${basePrompt}\n\n${contextBlock}`;
  }, [studentContextData, mode]);

  const appendTranscriptTurn = useCallback(
    async (role: Msg["role"], text: string) => {
      const normalizedText = normalizeTurnText(text);
      if (!normalizedText) return;

      const ts = Date.now();

      // Log directly to unified chat (ephemeral by default)
      await logMessage(
        role === "you" ? "user" : "assistant",
        normalizedText,
        "voice",
      );

      // Keep legacy callTranscript for Overlay if desired (or deprecate)
      // We keep it for the "Live Transcript" view feature
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
        return [...prev, { role, text: normalizedText, ts }];
      });
      setVoiceSessionHadTurns(true);
    },
    [logMessage],
  );

  // Choose voice name (OpenAI Realtime)
  const voiceName = preset?.openaiVoice || "alloy";

  // Pass selected realtime voice from the preset
  const {
    startListening,
    stopListening,
    isListening,
    status,
    speaking,
    error: voiceError,
    playVoicePreview, // Imported from hook
  } = useVoiceHook({
    systemPrompt,
    voice: voiceName, // Use provider-specific voice
    deliveryStyle: deliveryStyle?.instruction, // Pass delivery style instruction
    speed: speed, // Pass speech speed
    audioRef,
    onTurn: (turn) => {
      appendTranscriptTurn(
        turn.speaker === "user" ? "you" : "durmah",
        turn.text,
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
        contextPacket.academic.timezone || "Europe/London",
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
      if (
        requestedMode &&
        (requestedMode === "chat" || requestedMode === "study")
      ) {
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

    window.addEventListener("durmah:open", handleDurmahOpen);
    window.addEventListener("durmah:message", handleDurmahMessage);

    return () => {
      window.removeEventListener("durmah:open", handleDurmahOpen);
      window.removeEventListener("durmah:message", handleDurmahMessage);
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
  }, [
    isListening,
    voiceSessionActive,
    voiceSessionHadTurns,
    callTranscript.length,
  ]);

  const chips = useMemo(() => {
    if (studentContext.currentPhase === "exams")
      return ["Revision tips", "Past papers", "Stress management"];
    if (studentContext.currentPhase === "induction_week")
      return ["Where is the library?", "How to reference", "Module choices"];
    return ["Review this week", "Make a study plan", "Practice quiz"];
  }, [studentContext.currentPhase]);

  // ----------------------------
  // VOICE SESSION HANDLING
  // ----------------------------
  async function toggleVoice() {
    console.log("[DurmahVoice] Mic button clicked");
    if (!isVoiceActive) {
      setCallTranscript([]);
      setShowVoiceTranscript(true); // ENABLE REAL-TIME VISIBILITY IMMEDIATELY
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
            console.log(
              "[DurmahVoice] NOW from server context:",
              data.academic?.now?.nowText || "missing",
            );
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

  const handlePreview = async (voice_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoiceActive || previewingVoiceId === voice_id) return;

    setPreviewingVoiceId(voice_id);
    try {
      // Use the new Netlify function for preview
      const response = await fetch("/.netlify/functions/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_id,
          text: "Hi, I'm Durmah. Ready to study together?",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
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
      const lastUser = [...transcriptTurns]
        .reverse()
        .find((m) => m.role === "you");
      if (lastUser) {
        const topic = inferTopic(lastUser.text);
        try {
          const res = await fetchAuthed("/api/durmah/memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              last_topic: topic,
              last_message: lastUser.text,
            }),
          });
          if (res.ok)
            setMemory((prev: any) => ({
              ...prev,
              last_topic: topic,
              last_message: lastUser.text,
            }));
        } catch {}
      }

      // Instead of direct save, prepare payload and show folder picker
      const sessionStart = voiceSessionStartedAt ?? new Date();
      const sessionEnd = voiceSessionEndedAt ?? new Date();
      const durationSeconds = Math.max(
        0,
        Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 1000),
      );

      const normalizedTranscript = await Promise.all(
        transcriptTurns.map(async (turn) => ({
          role: turn.role === "you" ? "you" : "durmah",
          text: await normalizeTranscriptLanguage(turn.text),
          timestamp: turn.ts,
        })),
      );

      const firstUserTurn = transcriptTurns.find((turn) => turn.role === "you");
      const topic =
        firstUserTurn && firstUserTurn.text
          ? firstUserTurn.text.slice(0, 60)
          : "Durmah Voice Session";
      const content_text = normalizedTranscript
        .map((t) => `${t.role}: ${t.text}`)
        .join("\n");

      setTranscriptForFolder({
        topic,
        summary: null,
        transcript: normalizedTranscript,
        content_text,
        duration_seconds: durationSeconds,
        started_at: sessionStart.toISOString(),
        ended_at: sessionEnd.toISOString(),
        source_type: "voice_chat",
        source_id: voiceSessionId,
      });

      setShowFolderPicker(true);
    }
  };

  const handleFinalSaveToFolder = async (folderId: string) => {
    if (!transcriptForFolder) return;
    setIsSavingTranscript(true);
    try {
      const resp = await fetch("/api/transcripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptPayload: transcriptForFolder,
          folderId,
        }),
      });
      const json = await resp.json();
      if (json.ok) {
        toast.success("Transcript archived successfully!");
        setIsSessionSaved(true);
        localStorage.setItem("durmah:lastFolderId", folderId);
        setShowFolderPicker(false);
        setTranscriptForFolder(null);

        // Cleanup session
        setShowVoiceTranscript(false);
        setCallTranscript([]);
        setVoiceSessionHadTurns(false);
        setVoiceSessionActive(false);
        setVoiceSessionId(null);
        setVoiceSessionStartedAt(null);
        setVoiceSessionEndedAt(null);
      } else {
        toast.error(json.error || "Failed to archive transcript");
      }
    } catch (err) {
      toast.error("Network error saving transcript");
    } finally {
      setIsSavingTranscript(false);
    }
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
  // SESSION MANAGEMENT HANDLERS
  // ----------------------------

  /**
   * Handle widget close: prompt to save/discard if there are messages and session not yet saved
   */
  const handleClose = () => {
    if (messages.length > 0 && !isSessionSaved) {
      // Show save modal
      setShowSaveModal(true);
    } else {
      // No messages or already saved, just minimize
      setIsOpen(false);
    }
  };

  /**
   * Start a new session (after save/discard)
   */
  const startNewSession = () => {
    // Clear current session
    setCurrentSessionId(null);
    setIsSessionSaved(false);
    // Widget will auto-generate new session ID on next open
    setIsOpen(false);
    setShowSaveModal(false);
  };

  /**
   * Handle Save All from modal
   */
  const handleSaveSession = async () => {
    if (saveSession) {
      const success = await saveSession();
      if (success) {
        startNewSession();
      }
    }
  };

  /**
   * Handle Discard from modal
   */
  const handleDiscardSession = async () => {
    if (discardSession) {
      const success = await discardSession();
      if (success) {
        startNewSession();
      }
    }
  };

  /**
   * Handle Select Messages from modal
   */
  const handleSelectMessages = () => {
    setShowSaveModal(false);
    setIsSelectionMode(true);
    // User will manually save selected messages, then close
  };

  // CLEAR CHAT - Clears entire conversation history for this SPECIFIC TOPIC/WIDGET
  const clearChat = async () => {
    // We only clear the current conversation scope (e.g. current lecture, current assignment, or global widget thread)
    // This preserves "Saved Transcripts" in the library that reside in other threads or are archived elsewhere.
    const warning = `Are you sure you want to clear your chat history for this ${scope === "global" ? "widget" : scope}? \n\nAll messages currently visible here will be deleted. Your saved highlights in the separate Library will remain safe.`;

    if (!confirm(warning)) return;

    setCallTranscript([]);
    // Clearing local state via hook
    // Note: useDurmahChat's clearUnsaved only clears UN-saved.
    // We want a full clear, so we'll do it via DB and then reload/reset.

    if (user?.id && supabaseClient && conversationId) {
      try {
        const { error } = await supabaseClient
          .from("durmah_messages")
          .delete()
          .eq("conversation_id", conversationId); // CRITICAL: Scoped to current thread only

        if (error) throw error;

        toast.success("Chat history cleared");
        // Force a refresh of the messages in the hook
        if (typeof refetchMessages === "function") {
          refetchMessages();
        } else {
          // Fallback: clear local state manually if refetch not enough
          window.location.reload();
        }
      } catch (err) {
        console.error("[DurmahWidget] Failed to clear messages:", err);
        toast.error("Failed to clear chat");
      }
    } else {
      console.warn(
        "[DurmahWidget] Clear chat failed: missing user, client, or conversationId",
        {
          userId: user?.id,
          hasClient: !!supabaseClient,
          conversationId,
        },
      );
      toast.error("Unable to clear chat - check connection");
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
      const { data, error } = await supabaseClient.rpc(
        "seed_timetable_events_v1",
        {
          mode: "epiphany2026",
        },
      );

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
      const { data: cleared, error: clearError } = await supabaseClient.rpc(
        "clear_timetable_events_v1",
      );

      if (clearError) {
        console.error("[ResetTimetable] Clear error:", clearError);
        toast.error("Failed to clear timetable: " + clearError.message);
        return;
      }

      console.log(`[ResetTimetable] Cleared ${cleared} events`);

      // Then seed
      const { data: seeded, error: seedError } = await supabaseClient.rpc(
        "seed_timetable_events_v1",
        {
          mode: "epiphany2026",
        },
      );

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

    // Auto-switch to session view if in saved view
    if (viewMode !== "session") setViewMode("session");

    const userText = input.trim();
    let enrichedMessage = userText; // Initialize with userText

    // ----------------------------
    // ONBOARDING SEARCH INTEGRATION
    // ----------------------------
    const helpKeywords = [
      "how do i",
      "how to",
      "where do i",
      "where can i",
      "sync",
      "timetable",
      "blackboard",
      "panopto",
      "assignment",
      "upload",
      "import",
      "download",
      "find",
      "access",
      "connect",
      "enrol",
    ];
    const lowerMessage = userText.toLowerCase();
    const isHelpQuery = helpKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );

    if (isHelpQuery) {
      try {
        const searchRes = await fetchAuthed("/api/durmah/onboarding-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userText, limit: 3 }),
        });

        if (searchRes.ok) {
          const { results } = await searchRes.json();
          if (results && results.length > 0) {
            const guidesContext = results
              .map(
                (guide: any, i: number) => `
Guide ${i + 1}: ${guide.title}
Summary: ${guide.summary}
Content (excerpt): ${guide.content_markdown.substring(0, 800)}
Link: /onboarding?guide=${guide.slug}
`,
              )
              .join("\n---\n");

            enrichedMessage = `[SYSTEM CONTEXT: You have access to ${results.length} relevant help guide(s) from the Caseway onboarding knowledge base. Use these to answer the user's question with exact step-by-step instructions. Include a link to the full guide.

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
        console.error("[DurmahWidget] Onboarding search failed:", error);
      }
    }

    setInput("");

    // Auto-focus immediately after clearing
    requestAnimationFrame(() => textareaRef.current?.focus());

    // Auto-resize textarea back to default
    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
    }

    try {
      // Unified Send
      await sendMessage(enrichedMessage, "text");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send");
    } finally {
      // Ensure focus is regained after assistant reply starts/completes
      requestAnimationFrame(() => textareaRef.current?.focus());
      setIsStreaming(false);
    }
  }

  // Resolve current avatar based on settings
  const currentAvatar =
    preset?.gender === "female"
      ? "/images/demo-thumbnails/durmah-voice-female.png"
      : "/images/demo-thumbnails/durmah-voice.png";

  // ----------------------------
  // UI RENDER
  // ----------------------------

  //  1. Logged-out Modal
  if (isOpen && !signedIn) {
    return (
      <div className="fixed bottom-24 right-6 z-[45] flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-lg">Unlock Your Legal Eagle Buddy</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 mb-6 flex items-center justify-center animate-in fade-in zoom-in duration-700 rounded-full border-4 border-violet-50 overflow-hidden shadow-lg bg-white">
            <img
              src={currentAvatar}
              alt="Durmah Professor"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 mb-8">
            <p className="text-gray-800 font-bold">
              Talk through legal concepts.
            </p>
            <p className="text-gray-800 font-bold">
              Practice arguments out loud.
            </p>
            <p className="text-gray-800 font-bold">
              Think like a Durham lawyer - with guidance.
            </p>
          </div>
          <p className="text-[11px] text-gray-400 mb-4 font-medium uppercase tracking-wider">
            Log in or start a free trial to speak with Durmah, your personal
            Durham Law study mentor.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/login"
              className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="w-full py-3 bg-white text-violet-600 border border-violet-200 rounded-xl font-bold hover:bg-violet-50 transition-all"
            >
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
            <div className="font-bold mb-0.5 text-violet-200">
              Durmah - Your Legal Eagle Buddy
            </div>
            <div className="text-gray-300">
              I'm always here to help you study.
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-gray-900/90 rotate-45 border-t border-r border-white/10"></div>
        </div>

        <button
          data-tour="global-durmah-fab"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-violet-400/50 ${
            isVoiceActive
              ? "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse text-white"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          }`}
        >
          {/* Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner overflow-hidden border border-white/30">
            <img
              src={currentAvatar}
              alt="Durmah"
              className="w-full h-full object-cover"
            />
            {isVoiceActive && (
              <span className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-ping"></span>
            )}
          </div>

          <div className="flex flex-col items-start">
            <span className="font-bold text-sm leading-tight">Durmah</span>
            <span className="text-[10px] text-violet-100 font-medium">
              Your Legal Eagle Buddy
            </span>
          </div>
        </button>
      </div>
    );
  }

  // 3. Open Chat Widget (Logged In)
  return (
    <div
      className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-24 z-[45] flex flex-col w-full sm:max-w-none h-[450px] max-h-[85vh] sm:max-h-[90vh] overflow-visible rounded-t-3xl sm:rounded-3xl border-t sm:border border-violet-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] sm:shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in duration-300"
      style={{
        // Desktop only: use state-controlled dimensions (Hydration Safe)
        width:
          ready && window.innerWidth >= 640
            ? `${widgetSize.width}px`
            : undefined,
        height:
          ready && window.innerWidth >= 640
            ? `${widgetSize.height}px`
            : undefined,
      }}
    >
      {/* Resize Handle - Desktop Only (top-left corner) */}
      <div
        className="hidden sm:flex absolute top-0 left-0 w-6 h-6 cursor-nw-resize items-center justify-center z-50 group"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        title="Drag to resize"
      >
        <div className="w-4 h-4 rounded-tl-xl bg-violet-500/30 group-hover:bg-violet-500/50 transition-colors flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-white/70 rotate-45" />
        </div>
      </div>

      {/* Premium Header Ribbon */}
      <header
        className={`relative flex-none flex items-center justify-between px-5 py-4 text-white shadow-md z-30 transition-colors duration-300 ${isSelectionMode ? "bg-[#374151]" : "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700"}`}
      >
        {isSelectionMode ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="hover:bg-white/10 p-1 rounded"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Select All / Deselect All Checkbox */}
            <button
              onClick={() => {
                if (
                  selectedIds.size === messages.length &&
                  messages.length > 0
                ) {
                  deselectAllMessages();
                } else {
                  selectAllMessages();
                }
              }}
              className="p-1 hover:bg-white/10 rounded"
              title={
                selectedIds.size === messages.length
                  ? "Deselect all"
                  : "Select all"
              }
            >
              {selectedIds.size === messages.length && messages.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-green-400" />
              ) : (
                <Square className="w-5 h-5 text-white/60" />
              )}
            </button>

            <span className="font-bold text-sm flex-1">
              {selectedIds.size} selected
            </span>

            {/* Save Selected */}
            <button
              onClick={() => handleManageAction("save")}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${selectedIds.size === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
              title="Save selected messages to your notes."
            >
              <Save className="w-3 h-3" /> Save
            </button>

            {/* Unsave Selected */}
            <button
              onClick={() => handleManageAction("unsave")}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${selectedIds.size === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`}
              title="Remove selected messages from saved notes."
            >
              <BookmarkX className="w-3 h-3" /> Unsave
            </button>

            {/* Clear Unsaved (Contextual) */}
            <button
              onClick={() => handleManageAction("clear_unsaved")}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-white/10"
              title="Remove temporary messages from this session."
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <div className="font-bold text-lg flex items-center gap-2">
                Durmah
                <span className="bg-white/20 backdrop-blur-sm rounded-full text-[10px] px-2 py-0.5 font-medium tracking-wide">
                  BETA
                </span>
              </div>
              <span className="text-xs text-violet-100 font-medium">
                Your Legal Mentor
              </span>

              {contextChipText && (
                <div className="mt-1 inline-flex self-start items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70 backdrop-blur-sm">
                  {contextChipText}
                </div>
              )}

              {/* Select Messages Button Only - No Confusing Toggle */}
              {messages.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionMode(true);
                    }}
                    className="bg-black/20 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors border border-white/10 backdrop-blur-sm text-violet-100"
                    title="Select messages to save"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="font-medium">Select Messages</span>
                  </button>
                </div>
              )}

              {showVoiceStatus && (
                <span className={`text-[10px] font-medium ${voiceStatusClass}`}>
                  {voiceStatusLabel}
                </span>
              )}
            </div>
          </>
        )}

        {/* Right side header controls */}
        <div className="flex items-center gap-2">
          {/* Reset Size Button - Only shows when resized on desktop */}
          {isResized && (
            <button
              onClick={resetWidgetSize}
              className="hidden sm:flex p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Reset to default size"
            >
              <Minimize2 size={16} />
            </button>
          )}

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
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center justify-between border-t border-gray-100 text-red-600"
                      onClick={() => {
                        clearChat();
                        setShowHeaderMenu(false);
                      }}
                    >
                      Clear All Messages
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={clearChat}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            title="Clear entire conversation"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Voice Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleVoice}
            data-tour="durmah-voice-btn"
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

          {/* Minimize button - hide widget while keeping voice active */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Minimize window but continue voice chat"
          >
            <Minus size={20} />
          </button>

          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Close widget and save session"
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
              <h3 className="font-bold text-lg text-gray-800">
                Voice Settings
              </h3>
              <p className="text-xs text-gray-500">
                Customize your Durmah experience
              </p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* 1. Delivery Style Section */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
                Delivery Style
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {DELIVERY_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() =>
                      updateSettings({ deliveryStyleId: style.id })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      deliveryStyleId === style.id
                        ? "bg-violet-600 border-violet-600 text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-violet-300"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Speed Control Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Speech Speed
                </h4>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                  {SPEEDS.find((s) => s.value === speed)?.label || "Normal"} (
                  {speed}x)
                </span>
              </div>
              <div className="flex gap-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateSettings({ speed: s.value })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      speed === s.value
                        ? "bg-violet-100 border-violet-500 text-violet-700"
                        : "bg-white border-gray-200 text-gray-500 hover:border-violet-200"
                    }`}
                  >
                    {s.value}x
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Voice Selection Section */}
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">
              Voice Catalog
            </h4>
            <div className="grid grid-cols-1 gap-4 pb-4">
              {availablePresets.map((p) => {
                const isSelected = voiceId === p.id;
                const isPreviewing = previewingVoiceId === p.id;

                // Resolve avatar for this preset
                const presetAvatar =
                  p.gender === "female"
                    ? "/images/demo-thumbnails/durmah-voice-female.png"
                    : "/images/demo-thumbnails/durmah-voice.png";

                return (
                  <div
                    key={p.id}
                    onClick={() => updateSettings({ voiceId: p.id })}
                    className={`relative group rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                      isSelected
                        ? "bg-white border-violet-500 shadow-lg ring-1 ring-violet-500 scale-[1.02]"
                        : "bg-white border-gray-200 hover:border-violet-200 hover:shadow-md hover:bg-gray-50"
                    }`}
                  >
                    {/* Top Color Band */}
                    <div
                      className={`h-2 w-full bg-gradient-to-r ${p.colorClass}`}
                    ></div>

                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm transition-all animate-in zoom-in-75">
                        <Check size={10} /> Selected
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md border border-gray-100">
                          <img
                            src={presetAvatar}
                            alt={`${p.label} Avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{p.label}</h4>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize font-medium">
                          {p.gender}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8">
                        {p.subtitle}
                      </p>

                      <button
                        onClick={(e) => handlePreview(p.id, e)}
                        disabled={Boolean(isPreviewing) || isVoiceActive}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          isPreviewing
                            ? "bg-violet-600 text-white shadow-lg animate-pulse"
                            : isVoiceActive
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"
                        }`}
                      >
                        {isPreviewing ? (
                          <>
                            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                            Playing Preview...
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
              Powered by OpenAI Realtime
            </div>
          </div>
        </div>
      )}

      {/* --------------- VOICE TRANSCRIPT (MODAL STYLE OVERLAY) ---------------- */}
      {showVoiceTranscript && !showSettings && (
        <div
          className="flex-none p-4 bg-white border-b border-violet-200 z-[42] shadow-xl max-h-[50%] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-4 duration-300"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 mb-4 flex items-center justify-between sticky top-0 bg-white py-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isVoiceActive ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}
              ></span>
              {isVoiceActive
                ? "Real-time Transcript"
                : "Last Session Transcript"}
            </div>
            {!isVoiceActive && (
              <button
                onClick={() => setShowVoiceTranscript(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {callTranscript.length === 0 ? (
            <div className="text-sm text-gray-500 italic bg-slate-50 border border-slate-100 rounded-2xl px-4 py-6 text-center">
              {isVoiceActive
                ? "Listening... say something to Durmah!"
                : "No transcript recorded."}
            </div>
          ) : (
            <div className="space-y-4 pr-2 pb-4">
              {callTranscript.map((m) => (
                <div
                  key={m.ts}
                  className={`flex ${m.role === "you" ? "justify-end" : "justify-start"} items-start gap-3`}
                >
                  {isSelectionMode && (
                    <div
                      className={`flex items-center ${m.role === "you" ? "order-last" : "order-first"}`}
                    >
                      <button
                        onClick={() => toggleSelection(getMessageKey(m as any))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {selectedIds.has(getMessageKey(m as any)) ? (
                          <CheckSquare className="w-5 h-5 text-violet-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === "you"
                        ? "bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-600/10"
                        : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none"
                    } ${isSelectionMode && selectedIds.has(getMessageKey(m as any)) ? "ring-2 ring-violet-400 ring-offset-2" : ""}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {/* Voice auto-scroll anchor */}
              <div id="voice-scroll-anchor" />
            </div>
          )}

          {!isVoiceActive && callTranscript.length > 0 && (
            <div className="flex justify-between gap-3 pt-4 mt-2 border-t border-slate-100 sticky bottom-0 bg-white">
              <button
                onClick={discardVoiceTranscript}
                className="flex-1 text-xs font-bold px-4 py-2.5 rounded-xl text-gray-500 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                Close & Discard
              </button>
              <button
                onClick={saveVoiceTranscript}
                className="flex-1 text-xs font-black px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Save size={14} />
                Save To Library
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {voiceError && !showSettings && (
        <div className="flex-none px-4 py-3 text-xs font-medium text-red-600 bg-red-50 border-y border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} /> {voiceError}
        </div>
      )}

      {/* CHAT HISTORY (Scrollable Flex Area) */}
      <div className="flex-1 min-h-0 overflow-y-auto glb-scroll p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && !ready && !contextError && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        )}

        {contextError && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-gray-900 font-bold mb-1">
              Durmah is having trouble
            </h4>
            <p className="text-sm text-gray-500 mb-6">{contextError}</p>
            <button
              onClick={() => {
                setContextError(null);
                hasFetchedSessionRef.current = false;
                fetchStudentContext();
              }}
              className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filtered Messages Logic: session mode hides saved messages to keep focus on current chat */}
        {(() => {
          const isSaved = (m: any) => m.visibility === "saved" || !!m.saved_at;
          const savedMessages = messages.filter(isSaved);
          const sessionMessages = messages.filter((m) => !isSaved(m));

          const filteredMessages =
            viewMode === "saved" ? savedMessages : sessionMessages;

          if (filteredMessages.length === 0 && viewMode === "saved") {
            return (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                <Bookmark className="w-8 h-8 opacity-20" />
                <p className="text-xs">No saved messages yet.</p>
              </div>
            );
          }

          return filteredMessages.map((m) => (
            <div
              key={m.ts}
              className={`flex ${m.role === "you" ? "justify-end" : "justify-start"} group relative mb-2`}
            >
              {/* Selection Checkbox - Shows for ALL messages in selection mode */}
              {isSelectionMode && (
                <div
                  className={`flex items-center ${m.role === "you" ? "mr-2 order-last" : "mr-2 order-first"}`}
                >
                  <button
                    onClick={() => toggleSelection(getMessageKey(m))}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {selectedIds.has(getMessageKey(m)) ? (
                      <CheckSquare className="w-5 h-5 text-violet-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                    )}
                  </button>
                </div>
              )}

              <div
                className={`relative px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed transition-all ${
                  m.role === "you"
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm hover:shadow-md"
                } ${isSelectionMode && selectedIds.has(getMessageKey(m)) ? "ring-2 ring-violet-400 ring-offset-2" : ""}`}
              >
                {m.text}

                {/* Metadata Footer */}
                <div
                  className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${m.role === "you" ? "text-white/70" : "text-gray-400"}`}
                >
                  {m.saved_at && (
                    <span
                      className="flex items-center gap-0.5"
                      title="Saved to your notes"
                    >
                      <Bookmark className="w-3 h-3 fill-current" /> Saved
                    </span>
                  )}

                  {/* Hover Actions (Only if not selection mode) */}
                  {!isSelectionMode && m.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 ml-2">
                      {/* Save Toggle */}
                      <button
                        onClick={() => {
                          const newSet = new Set([m.id!]);
                          setSelectedIds(newSet);
                          // Immediate action hack or just toggle? Better to just trigger single action
                          // But for now, let's keep it simple: Select Mode is main way.
                          // Or maybe a quick save button?
                          // Let's rely on selection mode for consistency as per plan.
                        }}
                        className="hover:text-white"
                      >
                        {/* <MoreHorizontal size={12} /> */}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ));
        })()}
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
                if (
                  c.includes("Review") ||
                  c.includes("plan") ||
                  c.includes("quiz")
                ) {
                  setMode("study");
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
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask Durmah..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-gray-50 focus:bg-white resize-none min-h-[46px] max-h-[200px] overflow-y-auto"
            // Never disabled to maintain focus
          />

          <button
            onClick={send}
            disabled={isStreaming || !input.trim()}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            className="p-3 h-[46px] rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-md hover:shadow-lg disabled:shadow-none self-end"
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
                  height: speaking ? "100%" : "30%",
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
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
              0%,
              100% {
                height: 30%;
                opacity: 0.5;
              }
              50% {
                height: 100%;
                opacity: 1;
              }
            }
            .animate-waveform {
              animation: waveform 1s infinite ease-in-out;
            }
          `}</style>
        </div>
      )}

      {/* Save To Folder Modal (Explorer Upgrade) */}
      <SaveToFolderModal
        isOpen={showFolderPicker}
        onClose={() => {
          setShowFolderPicker(false);
          setTranscriptForFolder(null);
        }}
        onSave={handleFinalSaveToFolder}
        isSaving={isSavingTranscript}
      />

      <SaveConversationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        messageCount={messages.length}
        onSaveAll={handleSaveSession}
        onDiscard={handleDiscardSession}
        onSelectMessages={handleSelectMessages}
      />
    </div>
  );
}
