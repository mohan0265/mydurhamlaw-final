'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { withAuthProtection } from '@/lib/withAuthProtection';
import { ArrowLeft, BookOpen, Loader2, Plus, Send, Search } from 'lucide-react';

type JournalEntry = {
  id: string;
  content: string;
  created_at: string;
};

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e => (e.content || '').toLowerCase().includes(q));
  }, [entries, query]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/journal');
      if (!res.ok) throw new Error('Failed to load journal');
      const data = (await res.json()) as JournalEntry[];
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't load journal.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const saveEntry = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSaving(true);

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) throw new Error('Save failed');
      const saved = (await res.json()) as JournalEntry;

      setEntries(prev => [saved, ...prev]);
      setContent('');
      setIsWriting(false);
      toast.success('Saved.');
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Memory Journal - MyDurhamLaw</title>
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <button
              onClick={() => setIsWriting(true)}
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Memory Journal</h1>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-snug">
                  Capture one thing you learned today — it compounds faster than you think.
                </p>
              </div>

              {/* Search */}
              <div className="w-full sm:w-[320px]">
                <label className="sr-only">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entries…"
                    className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Composer */}
            {isWriting && (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Write a short entry
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What one thing did you understand better today? Any misconception you corrected?"
                  className="w-full min-h-[140px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                  autoFocus
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setIsWriting(false);
                      setContent('');
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-purple-700 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveEntry}
                    disabled={saving || !content.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="mt-5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    {entries.length === 0 ? 'No entries yet.' : 'No matches found.'}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {entries.length === 0
                      ? 'Write one small insight today and build a personal knowledge bank.'
                      : 'Try a different keyword.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</div>
                      <div className="mt-2 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Journal entries sync to your Dashboard “Memory Journal” widget.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default withAuthProtection(JournalPage);
