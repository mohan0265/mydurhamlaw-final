'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

type Msg = { role: 'durmah' | 'you'; text: string; ts: number };
type UpcomingItem = { id: string; title: string; due_at?: string | null };

type MemoryRecord = { last_topic?: string; last_message?: string } | null;

type StudentSnapshot = {
  name: string | null;
  upcoming: UpcomingItem[];
};

const EMPTY_SNAPSHOT: StudentSnapshot = { name: null, upcoming: [] };

async function fetchMemory(): Promise<MemoryRecord> {
  try {
    const response = await fetch('/api/durmah/memory');
    const json = await response.json().catch(() => null);
    if (!json || json.ok === false) return null;
    return json.memory ?? null;
  } catch {
    return null;
  }
}

async function saveMemory(last_topic?: string, last_message?: string) {
  try {
    await fetch('/api/durmah/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_topic, last_message }),
    });
  } catch {
    // soft fail
  }
}

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const memory = await fetchMemory();
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
    };
  }, [user?.id]);

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

    saveMemory(inferTopic(userText), userText);

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
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        const json = await response.json().catch(() => ({ text: 'Okay.' }));
        const fallback = (json?.text || json?.content || 'Okay.').toString();
        setMessages((current) =>
          current.map((message) =>
            message.ts === assistantId ? { ...message, text: fallback } : message
          )
        );
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
            ? {
                ...message,
                text: 'Hmm, I am having trouble right now, but I saved your note.',
              }
            : message
        )
      );
    } finally {
      streamControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="font-semibold text-violet-800">Durmah</div>
        <div className="text-xs text-violet-600">Always here for you</div>
      </header>

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
          <div className="space-y-2">
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
              placeholder="Tell me what you are working on..."
              disabled={isStreaming}
            />
            <button
              onClick={send}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              disabled={!input.trim() || isStreaming}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
