import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useDurmahRealtime, VoiceTurn } from "@/hooks/useDurmahRealtime";
import { useDurmahDynamicContext } from "@/hooks/useDurmahDynamicContext";
import { useDurmah, MDLStudentContext } from "@/lib/durmah/context";
import { 
  buildDurmahSystemPrompt, 
  composeGreeting, 
  DurmahStudentContext, 
  DurmahMemorySnapshot 
} from "@/lib/durmah/systemPrompt";
import { formatTodayForDisplay } from "@/lib/durmah/phase";
import { useDurmahSettings } from "@/hooks/useDurmahSettings";
import { Settings, X } from "lucide-react";

type Msg = { role: "durmah" | "you"; text: string; ts: number };

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(" ");
}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const signedIn = !!user?.id;
  
  // 1. Source Context
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents } = useDurmahDynamicContext();
  const { preset, updateVoice, availablePresets, voiceId } = useDurmahSettings();
  
  // Construct the unified context object
  const studentContext: DurmahStudentContext = useMemo(() => {
    // Fallback to window if hook is empty/loading (though hook handles window fallback internally)
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
      currentPhase: base.nowPhase, // Map for systemPrompt
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
  const [memory, setMemory] = useState<DurmahMemorySnapshot | null>(null);

  const streamControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ensure browser is allowed to autoplay incoming WebRTC audio
  useEffect(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    el.autoplay = true;
    el.muted = false;
    (el as any).playsInline = true;
  }, []);

  // 2. Memory & Greeting
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/durmah/memory");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.ok && data.memory) {
            setMemory(data.memory);
          }
        }
      } catch (e) {
        console.error("Failed to fetch memory", e);
      }
      
      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [signedIn]);

  // Set initial greeting once ready
  useEffect(() => {
    if (ready && messages.length === 0) {
      const greeting = composeGreeting(studentContext, memory, upcomingTasks, todaysEvents);
      setMessages([{ role: "durmah", text: greeting, ts: Date.now() }]);
    }
  }, [ready, studentContext, memory, messages.length, upcomingTasks, todaysEvents]);


  // 3. Voice Hook
  const systemPrompt = useMemo(() => 
    buildDurmahSystemPrompt(studentContext, memory, upcomingTasks, todaysEvents, preset), 
  [studentContext, memory, upcomingTasks, todaysEvents, preset]);

  const {
    startListening,
    stopListening,
    isListening,
    status,
    speaking,
    error: voiceError,
  } = useDurmahRealtime({
    systemPrompt,
    voice: preset.modelVoiceId,
    audioRef,
    onTurn: (turn) => {
      setCallTranscript((prev) => [
        ...prev,
        {
          role: turn.speaker === "user" ? "you" : "durmah",
          text: turn.text,
          ts: Date.now(),
        },
      ]);
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
      stopListening();
    };
  }, [stopListening]);

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
      await startListening();
      return;
    }

    stopListening();
    setShowVoiceTranscript(true);
  }

  const saveVoiceTranscript = async () => {
    if (callTranscript.length > 0) {
      setMessages((prev) => [...prev, ...callTranscript]);
      
      // Update memory
      const lastUser = [...callTranscript].reverse().find((m) => m.role === "you");
      if (lastUser) {
        const topic = inferTopic(lastUser.text);
        try {
          await fetch("/api/durmah/memory", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ last_topic: topic, last_message: lastUser.text }),
          });
          // Optimistically update local memory
          setMemory(prev => ({ ...prev, last_topic: topic, last_message: lastUser.text }));
        } catch {}
      }
    }
    setShowVoiceTranscript(false);
    setCallTranscript([]);
  };

  const discardVoiceTranscript = () => {
    setShowVoiceTranscript(false);
    setCallTranscript([]);
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
        await fetch("/api/durmah/memory", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_topic: inferredTopic, last_message: userText }),
        });
        setMemory(prev => ({ ...prev, last_topic: inferredTopic, last_message: userText }));
      } catch {}
    })();

    // Prepare messages for API
    // We inject the system prompt as a 'system' message if the API supports it, 
    // or we rely on the API to use a default. The user requested we use the SAME prompt.
    // So we will pass it as a system message.
    const payloadMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === "durmah" ? "assistant" : "user",
        content: m.text,
      }))
    ];

    try {
      const controller = new AbortController();
      streamControllerRef.current = controller;

      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });

        setMessages((current) =>
          current.map((m) => (m.ts === assistantId ? { ...m, text: buf } : m))
        );
      }

      buf += decoder.decode();
      setMessages((current) =>
        current.map((m) => (m.ts === assistantId ? { ...m, text: buf.trim() } : m))
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
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg"
      >
        Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-xl sm:w-[400px]">
      <header className="flex items-center justify-between bg-violet-600 px-4 py-3 text-white">
        <div className="font-semibold flex items-center gap-2">
          Durmah <span className="bg-violet-500 rounded-full text-[10px] px-2">Beta</span>
        </div>

        {/* Hidden audio output for Durmah's voice */}
        <audio
          ref={audioRef}
          style={{ display: 'none' }}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-full hover:bg-violet-500 hover:text-white"
            title="Voice Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded-full ${
              isListening ? "bg-red-600 text-white animate-pulse" : "bg-violet-500 text-white"
            }`}
          >
            {isListening ? "Stop" : "Mic"}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-violet-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* --------------- SETTINGS MODAL ---------------- */}
      {showSettings && (
        <div className="absolute inset-0 z-10 bg-white/95 p-4 flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-semibold text-gray-800">Durmah Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voice Style</label>
              <div className="space-y-2">
                {availablePresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateVoice(p.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      voiceId === p.id 
                        ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600" 
                        : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------- VOICE TRANSCRIPT ---------------- */}
      {showVoiceTranscript && callTranscript.length > 0 && !showSettings && (
        <div className="p-3 bg-violet-50 border-b border-violet-200">
          <div className="text-xs font-semibold text-violet-700 mb-2">
            Voice Session Transcript
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1">
            {callTranscript.map((m) => (
              <div key={m.ts} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-2 py-1 rounded-xl text-xs ${
                    m.role === "you"
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-900 border border-violet-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={discardVoiceTranscript}
              className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              Discard
            </button>
            <button
              onClick={saveVoiceTranscript}
              className="text-xs px-2 py-1 rounded bg-violet-600 text-white hover:bg-violet-700"
            >
              Save to Chat
            </button>
          </div>
        </div>
      )}

      {voiceError && !showSettings && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-y border-red-100">
          Voice error: {voiceError}
        </div>
      )}

      {/* --------------- CHAT HISTORY ---------------- */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.ts} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
                m.role === "you"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* --------------- QUICK REPLY CHIPS ---------------- */}
      {!isListening && !showSettings && (
        <div className="flex gap-2 overflow-x-auto p-3 border-t border-gray-200">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* --------------- TEXT INPUT BAR ---------------- */}
      {!isListening && !showSettings && (
        <div className="border-t border-gray-200 p-3 flex gap-2 items-center bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <button
            onClick={send}
            disabled={!input.trim()}
            className="px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      )}

      {/* --------------- VOICE MODE FOOTER ---------------- */}
      {isListening && !showSettings && (
        <div className="p-3 text-center text-xs bg-violet-50 border-t border-violet-200">
          <div className="font-semibold mb-1">Status: {status}</div>
          {speaking ? "Durmah is speaking..." : "Listening..."}
        </div>
      )}
    </div>
  );
}
