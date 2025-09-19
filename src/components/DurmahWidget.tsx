// src/components/DurmahWidget.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getStudentContext, composeOpener, type StudentContext } from '@/lib/durmah/service';

type ThreadMessage = {
  id: string;
  role: 'durmah' | 'student';
  content: string;
  timestamp: string;
};

const GENERAL_SUGGESTIONS = [
  { label: 'Review this week', prompt: 'Can you help me review this week and spot any gaps?' },
  { label: 'Make a study plan', prompt: 'Help me make a study plan for this week.' },
  { label: 'Practice quiz', prompt: 'Could you give me a short practice quiz?' },
];

const EMPTY_CONTEXT: StudentContext = {
  userId: null,
  name: null,
  yearOfStudy: null,
  upcoming: [],
  lastMemory: null,
};

function classNames(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(' ');
}

function inferTopic(ctx: StudentContext | null, text: string): string | null {
  const fallback = ctx?.upcoming?.[0]?.title;
  if (fallback) return fallback;

  const cleaned = text
    .replace(/[.!?]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');

  if (!cleaned) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildFollowUp(topic: string | null): string {
  if (topic) {
    return `Thanks for sharing. Shall we map out the next steps for "${topic}"?`;
  }
  return 'Got it. Want me to outline a quick plan or highlight useful resources?';
}

export default function DurmahWidget() {
  const [context, setContext] = useState<StudentContext>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isAuthed = Boolean(context.userId);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const ctx = await getStudentContext();
        if (!active) return;
        setContext(ctx);
        const opener = composeOpener(ctx);
        setMessages([
          {
            id: 'durmah-opener',
            role: 'durmah',
            content: opener,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn('[DurmahWidget] context load failed:', (err as Error)?.message || err);
        if (active) {
          setContext(EMPTY_CONTEXT);
          setMessages([
            {
              id: 'durmah-opener',
              role: 'durmah',
              content: composeOpener(EMPTY_CONTEXT),
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const quickActions = useMemo(() => {
    if (context.upcoming.length > 0) {
      const next = context.upcoming[0];
      if (next) {
        const due = next.dueAt ? new Date(next.dueAt).toLocaleDateString() : 'soon';
        const title = next.title || 'this task';
        return [
          { label: 'Plan task', prompt: `Help me plan "${title}" before ${due}.` },
          { label: 'Break into steps', prompt: `Can you break "${title}" into manageable steps?` },
          { label: 'Set reminder', prompt: `Remind me to work on "${title}" tomorrow evening.` },
        ];
      }
    }
    return GENERAL_SUGGESTIONS;
  }, [context.upcoming]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthed) return;

    const text = input.trim();
    if (!text) return;

    const userMessage: ThreadMessage = {
      id: `student-${Date.now()}`,
      role: 'student',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSubmitting(true);

    const topic = inferTopic(context, text);

    fetch('/api/durmah/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_topic: topic ?? context.upcoming[0]?.title ?? null,
        last_message: text,
      }),
    }).catch((err) => {
      console.warn('[DurmahWidget] memory save failed:', err);
    }).finally(() => {
      setSubmitting(false);
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `durmah-${Date.now()}`,
        role: 'durmah',
        content: buildFollowUp(topic),
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleChipClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-violet-500">Durmah Wellbeing</p>
            <h2 className="text-xl font-semibold text-gray-900">Your steady check-in buddy</h2>
            {context.yearOfStudy && (
              <p className="text-sm text-gray-600">Year {context.yearOfStudy} • Here for your rhythm</p>
            )}
          </div>
          <div className="hidden sm:block rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-600">
            Always with you
          </div>
        </header>

        <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-violet-100" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-violet-100" />
            </div>
          ) : (
            <div className="space-y-3 text-sm leading-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={classNames(
                    'flex',
                    message.role === 'student' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <span
                    className={classNames(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      message.role === 'student'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-violet-100 text-violet-900'
                    )}
                  >
                    {message.content}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActions.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip.prompt)}
              className="rounded-full border border-violet-100 bg-white px-3 py-1 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="durmah-input" className="text-xs font-medium text-gray-500">
            Share what's on your mind
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3 py-2 shadow-sm focus-within:border-violet-300">
            <input
              id="durmah-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isAuthed ? 'I want to focus on…' : 'Sign in to start a personalised chat'}
              disabled={!isAuthed || submitting}
              className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={!isAuthed || submitting || !input.trim()}
              className={classNames(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                !isAuthed || submitting || !input.trim()
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              Send
            </button>
          </div>
          {!isAuthed && (
            <p className="text-xs text-gray-500">
              Sign in to get personalised check-ins, save your reflections, and keep Durmah in sync with your timetable.
            </p>
          )}
        </form>

        {context.upcoming.length > 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 text-sm text-gray-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-500">
              Next up for you
            </p>
            <ul className="space-y-2">
              {context.upcoming.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex items-start justify-between gap-3">
                  <span className="font-medium text-gray-900">{item.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.dueAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-violet-100 bg-white/50 p-4 text-sm text-gray-600">
            Let me know what you'd like to work on next and I'll keep you gently on track.
          </div>
        )}
      </div>
    </section>
  );
}
