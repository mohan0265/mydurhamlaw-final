'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

type Msg = { role: 'durmah' | 'you'; text: string; ts: number };
type UpcomingItem = { id: string; title: string; due_at?: string | null };

async function fetchMemory(): Promise<{ last_topic?: string; last_message?: string } | null> {
  try {
    const r = await fetch('/api/durmah/memory');
    const j = await r.json();
    if (!j?.ok) return null;
    return j?.memory ?? null;
  } catch { return null; }
}

async function saveMemory(last_topic?: string, last_message?: string) {
  try {
    await fetch('/api/durmah/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_topic, last_message }),
    });
  } catch { /* fail-soft */ }
}

async function getStudentContext(userId?: string | null) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return { name: null as string | null, upcoming: [] as UpcomingItem[] };

  try {
    const prof = await supabase.from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const name = prof.data?.full_name || null;

    // Adapt table name if different
    const tasks = await supabase
      .from('assignments')
      .select('id,title,due_at')
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(3);

    const upcoming: UpcomingItem[] = (tasks.data || []).map((t) => ({
      id: String(t.id),
      title: t.title ?? 'Upcoming item',
      due_at: t.due_at ?? null,
    }));

    return { name, upcoming };
  } catch {
    return { name: null as string | null, upcoming: [] as UpcomingItem[] };
  }
}

function timeHello(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function composeOpener(
  name?: string | null,
  memory?: { last_topic?: string; last_message?: string } | null,
  upcoming: UpcomingItem[] = []
) {
  const niceName = name?.trim() ? `, ${name.split(' ')[0]}` : '';
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

export default function DurmahWidget() {
  const { user } = useAuth() || { user: null };
  const [ready, setReady] = useState(false);
  const [ctxName, setCtxName] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');

  const signedIn = !!user?.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mem = await fetchMemory();
      const ctx = await getStudentContext(user?.id);
      if (cancelled) return;
      setCtxName(ctx.name);
      setUpcoming(ctx.upcoming);
      const opener = composeOpener(ctx.name, mem, ctx.upcoming);
      setMessages([{ role: 'durmah', text: opener, ts: Date.now() }]);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const chips = useMemo(() => {
    if (upcoming.length === 0) return ['Review this week', 'Make a study plan', 'Practice quiz'];
    return ['Plan task', 'Break into steps', 'Set reminder'];
  }, [upcoming]);

  function inferTopic(text: string) {
    return text.split(/\s+/).slice(0, 4).join(' ');
  }

  async function send() {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'you', text: userText, ts: Date.now() }]);
    saveMemory(inferTopic(userText), userText);
    const follow = 'Got it - want me to draft steps, set a small timer, or add a reminder?';
    setMessages((m) => [...m, { role: 'durmah', text: follow, ts: Date.now() + 1 }]);
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
            {chips.map((c) => (
              <button key={c} className="rounded-full border px-3 py-1 text-xs text-gray-700" disabled>
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={m.ts + ':' + i} className={m.role === 'durmah' ? 'text-violet-800' : 'text-gray-900'}>
                <div className={`inline-block max-w-full rounded-2xl px-3 py-2 text-sm ${m.role === 'durmah' ? 'bg-violet-50' : 'bg-gray-50'}`}>
                  <strong className="mr-1">{m.role === 'durmah' ? 'Durmah:' : (ctxName ? ctxName.split(' ')[0] : 'You') + ':'}</strong>
                  <span>{m.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => setInput((p) => (p ? p : c))}
                className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-700 hover:bg-violet-50"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you are working on..."
            />
            <button
              onClick={send}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              disabled={!input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
