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
import { Settings, X, ArrowRight, AlertTriangle, Lock } from "lucide-react";

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
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end group">
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
          aria-label="Durmah - Your Legal Eagle Buddy"
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${
            isListening 
              ? "bg-gradient-to-r from-red-500 to-pink-600 ring-4 ring-red-200 animate-pulse" 
              : "bg-gradient-to-br from-violet-600 to-indigo-700 hover:shadow-violet-500/50"
          }`}
        >
          <span className="font-serif text-3xl font-bold text-white italic">D</span>
          {/* Listening Ring Animation */}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-ping"></span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl sm:w-[400px] animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Premium Header Ribbon */}
      <header className="flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 px-5 py-4 text-white shadow-md">
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
          {signedIn && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Voice Settings"
            >
              <Settings size={18} />
            </button>
          )}

          {signedIn && (
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
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* --------------- SETTINGS MODAL ---------------- */}
      {showSettings && (
        <div className="absolute inset-0 z-20 bg-white/98 p-5 flex flex-col animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h3 className="font-bold text-lg text-gray-800">Durmah Settings</h3>
            <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Voice Style</label>
              <div className="space-y-3">
                {availablePresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateVoice(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      voiceId === p.id 
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500 shadow-sm" 
                        : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900 mb-1">{p.label}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------- VOICE TRANSCRIPT ---------------- */}
      {showVoiceTranscript && callTranscript.length > 0 && !showSettings && (
        <div className="p-4 bg-violet-50/80 backdrop-blur-sm border-b border-violet-100">
          <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Live Transcript
          </div>

          <div className="max-h-48 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
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

          <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-violet-200/50">
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

      {voiceError && !showSettings && (
        <div className="px-4 py-3 text-xs font-medium text-red-600 bg-red-50 border-y border-red-100 flex items-center gap-2">
           <AlertTriangle size={14} /> {voiceError}
        </div>
      )}

      {/* --------------- NOT SIGNED IN STATE ---------------- */}
      {!signedIn && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
             <Lock className="w-10 h-10 text-violet-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Unlock Your Legal Buddy</h3>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed max-w-[260px]">
            Please log in or start your trial to use your Legal Eagle Buddy.
          </p>
          <div className="flex flex-col gap-3 w-full">
             <a href="/login" className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
               Log In
               <ArrowRight size={16} />
             </a>
             <a href="/signup" className="w-full py-3 bg-white text-violet-600 border border-violet-200 rounded-xl font-bold hover:bg-violet-50 transition-all">
               Start Free Trial
             </a>
          </div>
        </div>
      )}

      {/* --------------- CHAT HISTORY ---------------- */}
      {signedIn && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
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
        </div>
      )}

      {/* --------------- QUICK REPLY CHIPS ---------------- */}
      {signedIn && !isListening && !showSettings && (
        <div className="flex gap-2 overflow-x-auto p-3 border-t border-gray-100 bg-white no-scrollbar">
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
      {signedIn && !isListening && !showSettings && (
        <div className="border-t border-gray-100 p-4 flex gap-3 items-center bg-white">
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
        <div className="p-6 text-center bg-white border-t border-gray-100">
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
