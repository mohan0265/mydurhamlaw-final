"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRealtimeVoice, VoiceTurn } from "@/hooks/useRealtimeVoice";

type Msg = { role: "durmah" | "you"; text: string; ts: number };
type UpcomingItem = { id: string; title: string; due_at?: string | null };
type MemoryRecord = { last_topic?: string; last_message?: string } | null;

type StudentSnapshot = {
  name: string | null;
  upcoming: UpcomingItem[];
};

const EMPTY_SNAPSHOT: StudentSnapshot = { name: null, upcoming: [] };

async function getStudentContext(userId?: string | null): Promise<StudentSnapshot> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return { ...EMPTY_SNAPSHOT };

  try {
    const profile = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    const name = profile.data?.display_name || null;

    const tasks = await supabase
      .from("assignments")
      .select("id,title,due_at")
      .gte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(3);

    const upcoming: UpcomingItem[] = (tasks.data || []).map((task) => ({
      id: String(task.id),
      title: task.title || "your next task",
      due_at: task.due_at || null,
    }));

    return { name, upcoming };
  } catch {
    return { ...EMPTY_SNAPSHOT };
  }
}

function timeHello(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function composeOpener(name: string | null, memory: MemoryRecord, upcoming: UpcomingItem[]) {
  const niceName = name ? `, ${name.split(" ")[0]}` : "";

  if (upcoming.length > 0) {
    const first = upcoming[0];
    if (!first) {
      return `${timeHello()}${niceName}! I am Durmah - your study & wellbeing buddy. What would you like to work on right now?`;
    }
    const when = first.due_at ? new Date(first.due_at).toLocaleDateString() : "soon";
    const title = first.title || "your next task";
    return `${timeHello()}${niceName}! I see "${title}" due ${when}. Want help planning it?`;
  }

  if (memory?.last_topic) {
    return `${timeHello()}${niceName}! Last time we talked about "${memory.last_topic}". Want to continue?`;
  }

  return `${timeHello()}${niceName}! I am Durmah - your study & wellbeing buddy. What would you like to work on right now?`;
}

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(" ");
}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const signedIn = !!user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<StudentSnapshot>({ ...EMPTY_SNAPSHOT });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [callTranscript, setCallTranscript] = useState<Msg[]>([]);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);

  const streamControllerRef = useRef<AbortController | null>(null);

  // NEW REALTIME VOICE HOOK
  const {
    connected,
    speaking,
    error,
    connect,
    disconnect,
    startTalking,
    stopTalking,
  } = useRealtimeVoice({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
    systemPrompt:
      "You are Durmah, a warm, supportive legal study companion. Speak naturally and concisely. Maintain a calm, friendly tone.",
    onTranscript: (turn: VoiceTurn) => {
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

  // Greeting + context loader
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let memory: MemoryRecord = null;

      try {
        const response = await fetch("/api/durmah/memory", { credentials: "include" });
        if (response.ok) {
          const payload = await response.json().catch(() => null);
          if (payload && payload.ok !== false) memory = payload.memory ?? null;
        }
      } catch {}

      const context = await getStudentContext(user?.id);
      if (cancelled) return;

      setSnapshot(context);
      const opener = composeOpener(context.name, memory, context.upcoming);
      setMessages([{ role: "durmah", text: opener, ts: Date.now() }]);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      streamControllerRef.current?.abort();
    };
  }, [user?.id]);

  const chips = useMemo(() => {
    if (snapshot.upcoming.length === 0) {
      return ["Review this week", "Make a study plan", "Practice quiz"];
    }
    return ["Plan task", "Break into steps", "Set reminder"];
  }, [snapshot.upcoming]);

  // ----------------------------
  // VOICE SESSION HANDLING
  // ----------------------------
  async function toggleVoice() {
    if (!connected) {
      setCallTranscript([]);
      setShowVoiceTranscript(false);
      await connect();
      startTalking();
      return;
    }

    stopTalking();
    await disconnect();
    setShowVoiceTranscript(true);

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
      } catch {}
    }
  }

  const saveVoiceTranscript = () => {
    if (callTranscript.length > 0) {
      setMessages((prev) => [...prev, ...callTranscript]);
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
    if (!signedIn || !input.trim() || isStreaming || connected) return;

    const userText = input.trim();
    const now = Date.now();
    const userMsg: Msg = { role: "you", text: userText, ts: now };
    const assistantId = now + 1;

    const history = [...messages, userMsg];
    setMessages([...history, { role: "durmah", text: "", ts: assistantId }]);
    setInput("");
    setIsStreaming(true);

    const inferredTopic = inferTopic(userText);

    void (async () => {
      try {
        await fetch("/api/durmah/memory", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_topic: inferredTopic, last_message: userText }),
        });
      } catch {}
    })();

    const payloadMessages = history.map((m) => ({
      role: m.role === "durmah" ? "assistant" : "user",
      content: m.text,
    }));

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

        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-1.5 rounded-full ${
              connected ? "bg-red-600 text-white" : "bg-violet-500 text-white"
            }`}
          >
            Mic
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-violet-500 hover:text-white"
          >
            X
          </button>
        </div>
      </header>

      {/* --------------- VOICE TRANSCRIPT ---------------- */}
      {showVoiceTranscript && callTranscript.length > 0 && (
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

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-y border-red-100">
          Voice error: {error}
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
      {!connected && (
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
      {!connected && (
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
      {connected && (
        <div className="p-3 text-center text-xs bg-violet-50 border-t border-violet-200">
          {speaking ? "Durmah is speaking..." : "Listening..."}
        </div>
      )}
    </div>
  );
}
