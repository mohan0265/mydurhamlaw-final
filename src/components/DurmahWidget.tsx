'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { useGeminiLive } from '@/hooks/useGeminiLive';

type Msg = { role: 'durmah' | 'you'; text: string; ts: number };
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
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    const name = profile.data?.display_name || null;

    const tasks = await supabase
      .from('assignments')
      .select('id,title,due_at')
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(3);

    const upcoming: UpcomingItem[] = (tasks.data || []).map((task) => ({
      id: String(task.id),
      title: task.title || 'Upcoming item',
      due_at: task.due_at || null,
    }));

    return { name, upcoming };
  } catch {
    return { ...EMPTY_SNAPSHOT };
  }
}

function timeHello(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function composeOpener(
  name: string | null,
  memory: MemoryRecord,
  upcoming: UpcomingItem[]
) {
  const niceName = name ? `, ${name.split(' ')[0]}` : '';
  if (upcoming.length > 0) {
    const first = upcoming[0];
    if (first) {
      const when = first.due_at ? new Date(first.due_at).toLocaleDateString() : 'soon';
      const title = first.title || 'your next task';
      return `${timeHello()}${niceName}! I am here. I see "${title}" due ${when}. Want help planning or breaking it down?`;
    }
  }
  if (memory?.last_topic) {
    return `${timeHello()}${niceName}! Last time we talked about "${memory.last_topic}". Want to pick that up or start something new?`;
  }
  return `${timeHello()}${niceName}! I am Durmah - your study and wellbeing buddy. What would you like to work on right now?`;
}

function inferTopic(text: string) {
  return text.split(/\s+/).slice(0, 4).join(' ');
}

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const signedIn = !!user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<StudentSnapshot>({ ...EMPTY_SNAPSHOT });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Gemini Live Hook
  const { 
    connect, 
    disconnect, 
    startRecording, 
    stopRecording, 
    isConnected, 
    isStreaming: isVoiceStreaming, 
    isPlaying,
    error: voiceError,
  } = useGeminiLive({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    systemPrompt: "You are Durmah, a friendly, succinct voice mentor for Durham law students. Keep your responses short and conversational, like a phone call.",
    onTranscript: (text, source) => {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        const role = source === 'user' ? 'you' : 'durmah';
        
        // If the last message is from the same role and is recent, append to it (optional, but good for streaming)
        // For now, let's just add new bubbles for simplicity and to match the "chat" feel
        // But to avoid spamming bubbles for partial transcripts if they come in chunks:
        // The user's prompt implies "onTranscript" gives the full text or chunks. 
        // If it's chunks, we might need logic. 
        // Assuming "transcription" events are sentence-level or turn-level based on the SDK description.
        
        return [...prev, { role, text, ts: Date.now() }];
      });
    }
  });
  
  const [voiceMode, setVoiceMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let memory: MemoryRecord = null;

      try {
        const response = await fetch('/api/durmah/memory', { credentials: 'include' });
        if (response.ok) {
          const payload = await response.json().catch(() => null);
          if (payload && payload.ok !== false) {
            memory = payload.memory ?? null;
          }
        }
      } catch (error) {
        console.debug('[Durmah] memory GET failed:', error);
      }

      const context = await getStudentContext(user?.id);
      if (cancelled) return;

      setSnapshot(context);
      const opener = composeOpener(context.name, memory, context.upcoming);
      setMessages([{ role: 'durmah', text: opener, ts: Date.now() }]);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      streamControllerRef.current?.abort();
      disconnect();
    };
  }, [user?.id, disconnect]);

  // Sync voiceMode with connection state
  useEffect(() => {
    if (!isConnected && voiceMode) {
      setVoiceMode(false);
    }
  }, [isConnected, voiceMode]);

  const chips = useMemo(() => {
    if (snapshot.upcoming.length === 0) {
      return ['Review this week', 'Make a study plan', 'Practice quiz'];
    }
    return ['Plan task', 'Break into steps', 'Set reminder'];
  }, [snapshot.upcoming]);

  async function send() {
    if (!signedIn || !input.trim() || isStreaming) return;

    const userText = input.trim();
    const timestamp = Date.now();
    const userMessage: Msg = { role: 'you', text: userText, ts: timestamp };
    const assistantId = timestamp + 1;

    const history = [...messages, userMessage];
    setMessages([...history, { role: 'durmah', text: '', ts: assistantId }]);
    setInput('');
    setIsStreaming(true);

    const inferredTopic = inferTopic(userText);

    // Save memory asynchronously
    void (async () => {
      try {
        await fetch('/api/durmah/memory', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ last_topic: inferredTopic, last_message: userText }),
        });
      } catch (error) {
        console.debug('[Durmah] memory POST failed:', error);
      }
    })();

    const payloadMessages = history.map((message) => ({
      role: message.role === 'durmah' ? 'assistant' : 'user',
      content: message.text,
    }));

    try {
      const controller = new AbortController();
      streamControllerRef.current = controller;

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      if (!response.body) {
         return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const partial = assistantText;
        setMessages((current) =>
          current.map((message) =>
            message.ts === assistantId ? { ...message, text: partial } : message
          )
        );
      }

      assistantText += decoder.decode();
      const finalReply = assistantText.trim() || 'Okay.';
      setMessages((current) =>
        current.map((message) =>
          message.ts === assistantId ? { ...message, text: finalReply } : message
        )
      );
    } catch (error) {
      console.error('[DurmahWidget] chat failed:', error);
      setMessages((current) =>
        current.map((message) =>
          message.ts === assistantId
            ? { ...message, text: `Error: ${error instanceof Error ? error.message : String(error)}` }
            : message
        )
      );
    } finally {
      streamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  const toggleVoice = async () => {
    if (voiceMode) {
      stopRecording();
      disconnect();
      setVoiceMode(false);
      
      // Save session memory if needed (using last messages)
      if (messages.length > 0) {
         const lastUser = [...messages].reverse().find(m => m.role === 'you');
         if (lastUser) {
             const topic = inferTopic(lastUser.text);
             try {
                await fetch('/api/durmah/memory', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ last_topic: topic, last_message: lastUser.text }),
                });
             } catch (e) { console.error(e); }
         }
      }

    } else {
      await connect();
      await startRecording();
      setVoiceMode(true);
    }
  };

  const saveSession = async () => {
    // Already handled in toggleVoice or real-time
    setShowTranscript(false);
  };

  const discardSession = () => {
    setShowTranscript(false);
  };

  // Floating Widget UI
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        aria-label="Open Durmah Chat"
      >
        {/* Chat Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl sm:w-[400px]">
      <header className="flex items-center justify-between bg-violet-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="font-semibold">Durmah</div>
          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-medium text-white">Beta</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleVoice}
             className={`p-1.5 rounded-full transition-colors ${voiceMode ? 'bg-red-500 text-white animate-pulse' : 'text-violet-100 hover:bg-violet-500'}`}
             title={voiceMode ? "Stop Voice" : "Start Voice"}
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
               <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
               <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
           </button>
           <button 
             onClick={() => setIsOpen(false)}
             className="rounded-full p-1.5 text-violet-100 hover:bg-violet-500"
             aria-label="Close"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
               <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
             </svg>
           </button>
        </div>
      </header>

      {voiceError && (
        <div className={`px-4 py-3 text-xs ${voiceError.includes('quota') || voiceError.includes('1011') ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-600'}`}>
          {voiceError.includes('quota') || voiceError.includes('1011') ? (
            <>
              <strong>Usage Limit Reached (Google API)</strong>
              <p className="mt-1">
                The experimental voice model is currently rate-limited or your account quota is full.
                <br/>
                1. Check if your Billing Account is <strong>linked</strong> to this Project in Google Cloud.
                <br/>
                2. Try generating a <strong>new API Key</strong>.
              </p>
            </>
          ) : (
            <>Voice Error: {voiceError}</>
          )}
        </div>
      )}



      <div className="flex h-[400px] flex-col">
        {!ready ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">Connecting...</div>
        ) : !signedIn ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="mb-4 text-sm text-gray-600">
              Sign in to chat with Durmah, your personal study companion.
            </p>
            <a 
              href="/login" 
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Sign In
            </a>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div key={message.ts + ':' + index} className={`flex ${message.role === 'durmah' ? 'justify-start' : 'justify-end'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      message.role === 'durmah' 
                        ? 'bg-white text-gray-800 rounded-tl-none' 
                        : 'bg-violet-600 text-white rounded-tr-none'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-white p-3">
              {messages.length < 2 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => !input && setInput(chip)}
                      className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs text-violet-700 hover:bg-violet-100"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={voiceMode ? (isPlaying ? "Speaking..." : "Listening...") : "Type a message..."}
                  disabled={isStreaming || voiceMode}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                />
                <button
                  onClick={send}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                  disabled={!input.trim() || isStreaming || voiceMode}
                  aria-label="Send message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
