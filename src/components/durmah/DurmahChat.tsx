import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Brain,
  AlertTriangle,
  Send,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  FileText,
  Check,
  Loader2,
  Square,
  CheckSquare,
  ListPlus,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth, useSupabaseClient } from "@/lib/supabase/AuthContext";
import { useDurmah } from "@/lib/durmah/context";
import { useDurmahDynamicContext } from "@/hooks/useDurmahDynamicContext";
import {
  buildDurmahSystemPrompt,
  buildDurmahContextBlock,
} from "@/lib/durmah/systemPrompt";
import { useDurmahChat, DurmahMessage } from "@/hooks/useDurmahChat";
import { useDurmahRealtime } from "@/hooks/useDurmahRealtime";
import { useDurmahGeminiLive } from "@/hooks/useDurmahGeminiLive";
import { useDurmahSettings } from "@/hooks/useDurmahSettings";
import toast from "react-hot-toast";
import { v5 as uuidv5 } from "uuid";

// Namespace for deterministic UUIDs (Durmah Context Namespace) matches useDurmahChat
const DURMAH_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// Voice Provider Selection Logic
function getVoiceProvider(): "openai" | "gemini" {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("durmah_voice_override");
    if (override === "openai" || override === "gemini") return override;
  }
  return (
    process.env.NEXT_PUBLIC_DURMAH_VOICE_PROVIDER || "openai"
  ).toLowerCase() === "gemini"
    ? "gemini"
    : "openai";
}

const VOICE_PROVIDER = getVoiceProvider();

interface DurmahChatProps {
  contextType: "assignment" | "exam" | "general" | "module_exam";
  contextTitle: string;
  contextId?: string; // Assignment ID or Module Code
  systemHint?: string;
  initialPrompt?: string;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onInsertToDraft?: (payload: {
    source: "durmah";
    text?: string;
    html?: string;
    mode?: "cursor" | "append";
    label?: string;
    addPrefix?: boolean;
  }) => void;
  cleanSlate?: boolean;
}

export default function DurmahChat({
  contextType,
  contextTitle,
  contextId,
  systemHint,
  initialPrompt,
  className = "",
  isMinimized = false,
  onToggleMinimize,
  onInsertToDraft,
  cleanSlate = false,
}: DurmahChatProps) {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents, identity } = useDurmahDynamicContext();
  const { voiceId } = useDurmahSettings();

  // Voice Hook Selection
  const useVoiceHook =
    VOICE_PROVIDER === "gemini" ? useDurmahGeminiLive : useDurmahRealtime;

  // State
  const [input, setInput] = useState("");
  // Local expand state for chat history ONLY when minimized
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Selection State for Insert-to-Draft
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [addPrefix, setAddPrefix] = useState(true);

  // Load prefix preference
  useEffect(() => {
    const stored = localStorage.getItem("durmah_insert_prefix");
    if (stored !== null) setAddPrefix(stored === "true");
  }, []);

  const togglePrefix = () => {
    const newVal = !addPrefix;
    setAddPrefix(newVal);
    localStorage.setItem("durmah_insert_prefix", String(newVal));
  };

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine Scope and Context Object
  const chatScope =
    contextType === "assignment"
      ? "assignment"
      : contextType === "module_exam" || (contextType === "exam" && contextId)
        ? "exam"
        : "global";

  const chatContext = useMemo(
    () => ({
      assignmentId: contextType === "assignment" ? contextId : undefined,
      moduleId:
        contextType === "module_exam" || contextType === "exam"
          ? contextId
          : undefined,
      title: contextTitle,
      mode: "study",
    }),
    [contextType, contextId, contextTitle],
  );

  // 1. Initialize Chat Hook (Persistent Session per Assignment/Module)
  const {
    messages,
    sendMessage,
    isLoading: isChatLoading,
    conversationId,
    logMessage,
    discardSession,
    deleteMessages,
  } = useDurmahChat({
    source: "widget", // or derive from contextType
    scope: chatScope,
    context: chatContext,
    // Stabilize session ID based on ID for persistence
    sessionId: contextId
      ? uuidv5(`${chatScope}-${user?.id}-${contextId}`, DURMAH_NAMESPACE)
      : null,
  });

  // Audio Ref for Voice
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // CRITICAL FIX: Create audio element ONCE
  useEffect(() => {
    if (!audioRef.current) {
      const audio = document.createElement("audio");
      audio.style.display = "none";
      audio.id = `durmah-chat-audio-${contextId || "general"}`;
      document.body.appendChild(audio);
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current && document.body.contains(audioRef.current)) {
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
      }
    };
  }, [contextId]);

  // Cleanup: Remove duplicate greetings from history (Refined)
  useEffect(() => {
    if (!isChatLoading && messages.length > 1) {
      const idsToDelete: string[] = [];
      const seenNormalizedSet = new Set<string>();
      const normalize = (s: string) =>
        s.trim().replace(/\s+/g, " ").toLowerCase();

      // Check the first 15 messages for repeats
      const earlyMessages = messages.slice(0, 15);

      earlyMessages.forEach((msg) => {
        if (msg.role === "assistant") {
          const normalized = normalize(msg.content);
          const isGreeting =
            normalized.includes("hi i'm durmah") ||
            normalized.includes("how can i help you today");

          if (isGreeting) {
            // One Greeting Rule: if we've seen a greeting (exact or similar), delete subsequent ones
            if (seenNormalizedSet.size > 0) {
              idsToDelete.push(msg.id);
            } else {
              seenNormalizedSet.add(normalized);
            }
          } else {
            // Also check for strict duplicate assistant replies
            if (seenNormalizedSet.has(normalized)) {
              idsToDelete.push(msg.id);
            } else {
              seenNormalizedSet.add(normalized);
            }
          }
        }
      });

      if (idsToDelete.length > 0 && deleteMessages) {
        console.log(
          "[DurmahChat] Aggressive cleanup of duplicate assistant messages:",
          idsToDelete,
        );
        deleteMessages(idsToDelete);
      }
    }
  }, [isChatLoading, messages.length, deleteMessages]);

  // 2. Initialize Voice Hook

  // Handler for voice transcripts
  const handleVoiceTurn = useCallback(
    async (turn: { speaker: "user" | "durmah"; text: string }) => {
      // Log to chat history without triggering text response
      if (!turn.text) return;

      // Determine role
      const role = turn.speaker === "user" ? "user" : "assistant";

      // Use logMessage directly from useDurmahChat to persist to DB and update UI
      if (logMessage) {
        await logMessage(role, turn.text, "voice");
      }
    },
    [logMessage],
  );

  const {
    isConnected: isVoiceConnected,
    isListening: isVoiceListening,
    isSpeaking: isVoiceSpeaking,
    connect: connectVoice,
    disconnect: disconnectVoice,
    mode: voiceMode,
    transcript: voiceTranscript,
  } = useVoiceHook({
    enabled: true,
    userName: durmahCtx.firstName || "Student",
    voiceId: voiceId,
    // initialMessage: initialPrompt, // Disable auto-greeting to prevent persistent duplicates
    // Pass BOTH systemInstruction (Gemini) and systemPrompt (Realtime)
    systemInstruction: `You are Durmah, a helpful academic tutor. You are helping ${identity?.publicName || "the student"}. ${identity?.pronunciationHint ? `(Pronounce name as: ${identity.pronunciationHint})` : ""} Assignment: "${contextTitle}". Be concise, encouraging, and helpful. Do not write the essay for the student.`,
    systemPrompt: `You are Durmah, a helpful academic tutor.
USER: ${identity?.publicName || "Student"} ${identity?.pronunciationHint ? `(Pronounce as: ${identity.pronunciationHint})` : ""}
ASSIGNMENT: "${contextTitle}"
    
CONTEXT:
${systemHint || "No specific stage context provided."}

INSTRUCTIONS:
- Be concise, encouraging, and helpful.
- Do not write the essay for the student.
- If the user asks for milestones or specific help, use the context provided.`,
    onTurn: handleVoiceTurn,
    audioRef, // Pass the audio ref!
  });

  // 4. Auto-Scroll - Improved to prevent page jumping
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom =
        scrollHeight - chatContainerRef.current.scrollTop - clientHeight < 100;

      // Only auto-scroll if user is near bottom or it's a new message from user
      if (isNearBottom) {
        chatContainerRef.current.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, voiceTranscript]);

  // Insert Logic
  const handleInsertSingle = (content: string) => {
    if (onInsertToDraft) {
      onInsertToDraft({
        source: "durmah",
        text: content,
        mode: "cursor", // Single insert defaults to cursor
        addPrefix: addPrefix,
      });
    }
  };

  const handleInsertSelected = () => {
    // Get selected messages in chronological order
    // (messages array is already chronological)
    const content = messages
      .filter((m) => selectedMessageIds.has(m.id || m.created_at))
      .map((m) => m.content)
      .join("\n\n");

    if (onInsertToDraft && content) {
      onInsertToDraft({
        source: "durmah",
        text: content,
        mode: "append", // Bulk defaults to append
        addPrefix: addPrefix,
      });
      // Clear selection
      setSelectedMessageIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedMessageIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMessageIds(newSet);
  };

  // 5. Handle Send Message
  const handleSendMessage = async () => {
    if (!input.trim() || isChatLoading) return;

    const textToSend = input;
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(textToSend);
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${className} relative overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden border-2 ${
                isVoiceListening
                  ? "border-red-400 scale-110 shadow-[0_0_15px_rgba(248,113,113,0.5)]"
                  : isVoiceSpeaking
                    ? "border-violet-500 scale-110 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                    : "border-gray-200"
              }`}
            >
              <img
                src="/images/durmah_barrister.png"
                alt="Durmah"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online/Active Dot */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full transition-colors ${
                isVoiceConnected ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-gray-800 text-sm leading-tight flex items-center gap-2">
              Durmah
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 uppercase tracking-wide">
                Virtual Tutor
              </span>
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[150px]">
              {isVoiceConnected
                ? isVoiceListening
                  ? "Listening..."
                  : isVoiceSpeaking
                    ? "Speaking..."
                    : "Voice Active"
                : contextTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear Chat (Reset Session) */}
          {messages.length > 0 && (
            <button
              onClick={async () => {
                if (
                  window.confirm(
                    "Clear this assignment chat history? This affects only this assignment.",
                  )
                ) {
                  if (discardSession) await discardSession();
                }
              }}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 size={18} />
            </button>
          )}

          {/* Voice Toggle */}
          <button
            onClick={isVoiceConnected ? disconnectVoice : connectVoice}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isVoiceConnected
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-gray-50 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
            }`}
            title={
              isVoiceConnected ? "End Voice Session" : "Start Voice Session"
            }
          >
            {isVoiceConnected ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Minimize/Maximize (Optional based on prop) */}
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
          )}

          {/* Expand History Toggle (Local state when minimized) - Optional UX */}
          {isMinimized && !onToggleMinimize && (
            <button
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
              className={`p-2 rounded-lg transition-colors ${isHistoryVisible ? "bg-violet-100 text-violet-600" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <FileText size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Connection Error Banner */}
      {!isVoiceConnected && isChatLoading && !messages.length && (
        <div className="bg-amber-50 text-amber-800 text-xs px-4 py-2 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          <span>Connecting to Durmah...</span>
        </div>
      )}

      {/* Ethics Banner */}
      {(!isMinimized || isHistoryVisible) && (
        <div className="bg-rose-50 border-b border-rose-100 px-4 py-3 flex gap-3 shrink-0">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] leading-relaxed text-rose-700 font-medium">
            <strong className="block text-rose-800 mb-0.5">
              Academic Integrity Alert
            </strong>
            Durmah is a tutor, not a writer. I can explain legal concepts and
            critique your logic, but I cannot write or rewrite your essay for
            you.
          </p>
        </div>
      )}

      {/* Content Area (Hidden if minimized, unless history manually toggled) */}
      {(!isMinimized || isHistoryVisible) && (
        <>
          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 ${isMinimized ? "max-h-[400px]" : ""} pb-20`}
          >
            {/* Render Chat Messages */}
            {messages.map((m) => {
              const mId = m.id || m.created_at;
              const isSelected = selectedMessageIds.has(mId);

              return (
                <div
                  key={mId}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group/msg relative`}
                >
                  {/* Selection Checkbox (Only for Assistant or if needed for user too. User messages usually not inserted?) */}
                  {/* Actually user might want to insert their own voice transcript? Yes. */}
                  {onInsertToDraft && (
                    <button
                      onClick={() => handleToggleSelect(mId)}
                      className={`absolute top-3 ${m.role === "user" ? "-left-8" : "-right-8"} p-1 text-gray-400 hover:text-violet-600 transition-opacity ${isSelected ? "opacity-100 text-violet-600" : "opacity-0 group-hover/msg:opacity-100"}`}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed relative border transition-all ${
                      m.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm border-violet-600"
                        : isSelected
                          ? "bg-violet-50 text-gray-800 border-violet-300 rounded-tl-sm ring-1 ring-violet-300"
                          : "bg-white text-gray-800 border-gray-100 rounded-tl-sm hover:border-violet-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-1">
                      {m.content}
                    </div>

                    {/* Single Insert Button (only on hover, if not in bulk selection mode) */}
                    {m.role === "assistant" &&
                      onInsertToDraft &&
                      selectedMessageIds.size === 0 && (
                        <button
                          onClick={() => handleInsertSingle(m.content)}
                          className="absolute -right-2 -bottom-3 opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-violet-600 bg-white rounded-full shadow-md border border-gray-200 hover:bg-violet-50 hover:border-violet-300 transition-all z-10"
                          title="Insert into Draft"
                        >
                          <Plus size={10} /> Insert
                        </button>
                      )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}

            {/* Voice Status Indicator Overlay */}
            {isVoiceConnected && (
              <div className="sticky bottom-0 left-0 right-0 p-2 flex justify-center pointer-events-none">
                <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                  {isVoiceListening ? (
                    <>
                      <Mic size={12} className="text-red-400 animate-pulse" />
                      <span>Listening...</span>
                    </>
                  ) : isVoiceSpeaking ? (
                    <>
                      <Brain
                        size={12}
                        className="text-violet-300 animate-pulse"
                      />
                      <span>Speaking...</span>
                    </>
                  ) : (
                    <span className="opacity-80">Voice Active</span>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Action Bar (When messages selected) */}
          {selectedMessageIds.size > 0 && (
            <div className="absolute bottom-[72px] left-4 right-4 bg-gray-900/90 backdrop-blur text-white p-2 rounded-lg shadow-xl z-20 animate-in slide-in-from-bottom-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-0.5 bg-white/20 rounded-full">
                  {selectedMessageIds.size} selected
                </span>

                {/* Prefix Toggle */}
                <button
                  onClick={togglePrefix}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition ${addPrefix ? "text-green-300 bg-green-900/30" : "text-gray-400 hover:text-white"}`}
                  title="Add 'Durmah Note' prefix to inserted text"
                >
                  {addPrefix ? (
                    <CheckCircleIcon size={12} />
                  ) : (
                    <CircleIcon size={12} />
                  )}
                  Integrity Prefix
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMessageIds(new Set())}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                  title="Clear selection"
                >
                  <XIcon size={16} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button
                  onClick={() => {
                    const content = messages
                      .filter((m) =>
                        selectedMessageIds.has(m.id || m.created_at),
                      )
                      .map((m) => m.content)
                      .join("\n\n");
                    navigator.clipboard.writeText(content);
                    toast.success("Copied");
                    setSelectedMessageIds(new Set());
                  }}
                  className="p-1.5 hover:bg-white/10 rounded text-white transition flex items-center gap-1"
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleInsertSelected}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded text-xs font-bold transition shadow-lg shadow-violet-900/20 flex items-center gap-1.5"
                >
                  <ListPlus size={14} />
                  Insert
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-gray-100 bg-white rounded-b-xl z-10 relative">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-grow
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isVoiceConnected
                    ? "Voice active (speak now)..."
                    : "Ask for help..."
                }
                disabled={isVoiceConnected}
                className="flex-1 resize-none py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all min-h-[44px] max-h-[150px] overflow-y-auto disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isChatLoading || isVoiceConnected}
                className="w-11 h-11 flex items-center justify-center bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
            {!isVoiceConnected && (
              <div className="text-[10px] text-center text-gray-400 mt-2">
                AI can make mistakes. Auto-saves to "
                {`Assignment: ${contextTitle.substring(0, 15)}...`}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Icons for the Action Bar
function CheckCircleIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function CircleIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
function XIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
