'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/api/authedFetch';

type RawConnection = {
  id: string;
  email?: string | null;
  loved_email?: string | null;
  relationship?: string | null;
  relationship_label?: string | null;
  display_name?: string | null;
  status?: string | null;
};

type Connection = {
  id: string;
  email: string;
  relationship: string;
  displayName: string | null;
  status: string | null;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  connections?: RawConnection[];
};

async function getJson(url: string, init?: RequestInit) {
  const response = await authedFetch(url, init);
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function normalise(row: RawConnection): Connection {
  return {
    id: String(row.id),
    email: (row.email || row.loved_email || '').toLowerCase(),
    relationship: row.relationship || row.relationship_label || 'Loved one',
    displayName: row.display_name || null,
    status: row.status || null,
  };
}

const MAX_CONNECTIONS = 3;
const RELATIONSHIP_OPTIONS = ['Mum', 'Dad', 'Guardian', 'Partner', 'Family'];

export default function AWYSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<string>(RELATIONSHIP_OPTIONS[0] ?? '');
  const [displayName, setDisplayName] = useState('');

  const refresh = async () => {
    setLoading(true);
    setNeedsAuth(false);
    try {
      const data = (await getJson('/api/awy/connections')) as ApiResponse;
      if (data?.ok === false && data?.error === 'unauthenticated') {
        setNeedsAuth(true);
        setConnections([]);
        return;
      }
      const items = Array.isArray(data?.connections) ? data.connections : [];
      setConnections(items.map(normalise));
    } catch (err) {
      console.warn('[AWY settings] load failed:', err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const usedSlots = connections.length;
  const canAddMore = usedSlots < MAX_CONNECTIONS;

  const handleAdd = async () => {
    if (!canAddMore) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    try {
      const result = await getJson('/api/awy/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          relationship: relationship.trim(),
          displayName: displayName.trim() || undefined,
        }),
      });

      if (result?.ok === false) {
        alert(result?.error || 'Could not add loved one.');
        return;
      }

      setEmail('');
      setRelationship(RELATIONSHIP_OPTIONS[0] ?? '');
      setDisplayName('');
      alert('Loved one added. They can log in immediately.');
      await refresh();
    } catch (err) {
      console.error('[AWY settings] add loved one failed:', err);
      alert('Could not add loved one.');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this loved one?')) return;
    try {
      const result = await getJson('/api/awy/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (result?.ok === false) {
        alert(result?.error || 'Could not remove loved one.');
        return;
      }

      await refresh();
    } catch (err) {
      console.error('[AWY settings] remove loved one failed:', err);
      alert('Could not remove loved one.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Always With You - Settings</h1>
      <p className="mb-6 text-sm text-gray-600">
        Add up to three loved ones to show their presence in the AWY widget. You can update or remove them at any time.
      </p>

      {needsAuth && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Please <Link href="/login" className="font-medium underline">sign in</Link> to manage your loved ones.
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-white p-4">
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Loved one's email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!canAddMore || needsAuth}
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Relationship</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            disabled={!canAddMore || needsAuth}
          >
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Display name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            placeholder="Mum / Dad / Uncle Ravi"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={!canAddMore || needsAuth}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">You have added {usedSlots} of {MAX_CONNECTIONS}</span>
          <button
            className={`rounded px-4 py-2 text-white ${
              canAddMore && !needsAuth ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleAdd}
            disabled={!canAddMore || needsAuth}
          >
            Add loved one
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-medium">Your loved ones</h2>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : connections.length === 0 ? (
          <div className="text-sm text-gray-600">No loved ones yet.</div>
        ) : (
          <ul className="space-y-3">
            {connections.map((conn) => (
              <li key={conn.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{conn.relationship}</div>
                  <div className="truncate text-xs text-gray-600">{conn.email}</div>
                  {conn.status && (
                    <div className="mt-1 text-xs text-gray-500">Status: {conn.status}</div>
                  )}
                </div>
                <button
                  className="rounded px-3 py-1 text-sm hover:bg-gray-100"
                  onClick={() => handleRemove(conn.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 text-right">
        <Link href="/" className="text-sm text-violet-600 underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
