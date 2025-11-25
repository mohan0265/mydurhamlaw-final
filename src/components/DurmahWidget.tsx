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
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const name = profile.data?.full_name || null;

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

  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<StudentSnapshot>({ ...EMPTY_SNAPSHOT });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Gemini Live Hook
  // Note: Using NEXT_PUBLIC_GEMINI_API_KEY for client-side demo. 
  // In production, you should proxy the WebSocket handshake to hide the key.
  const { connect, disconnect, startRecording, stopRecording, isConnected, isStreaming: isVoiceStreaming, error: voiceError } = useGeminiLive(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const [voiceMode, setVoiceMode] = useState(false);

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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (!response.body) {
         // ... fallback logic
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
            ? { ...message, text: 'Hmm, I am having trouble right now, but I saved your note.' }
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
    } else {
      await connect();
      await startRecording();
      setVoiceMode(true);
    }
  };

  return (
    <section className="rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="font-semibold text-violet-800">Durmah</div>
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleVoice}
             className={`p-2 rounded-full transition-colors ${voiceMode ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600'}`}
             title={voiceMode ? "Stop Voice" : "Start Voice"}
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
               <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
               <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
             </svg>
           </button>
           <div className="text-xs text-violet-600">Always here</div>
        </div>
      </header>

      {voiceError && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50">
          Voice Error: {voiceError}
        </div>
      )}

      {!ready ? (
        <div className="px-4 pb-6 text-sm text-gray-500">Connecting...</div>
      ) : !signedIn ? (
        <div className="px-4 pb-6">
          <div className="mb-3 text-sm text-gray-700">
            Please <a className="underline" href="/login">sign in</a> to get personalized check-ins.
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
            {messages[0]?.text}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button key={chip} className="rounded-full border px-3 py-1 text-xs text-gray-700" disabled>
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={message.ts + ':' + index} className={message.role === 'durmah' ? 'text-violet-800' : 'text-gray-900'}>
                <div className={`inline-block max-w-full rounded-2xl px-3 py-2 text-sm ${message.role === 'durmah' ? 'bg-violet-50' : 'bg-gray-50'}`}>
                  <strong className="mr-1">{message.role === 'durmah' ? 'Durmah:' : (snapshot.name ? snapshot.name.split(' ')[0] : 'You') + ':'}</strong>
                  <span>{message.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => !input && setInput(chip)}
                className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-700 hover:bg-violet-50"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={voiceMode ? "Listening..." : "Tell me what you are working on..."}
              disabled={isStreaming || voiceMode}
            />
            <button
              onClick={send}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              disabled={!input.trim() || isStreaming || voiceMode}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
