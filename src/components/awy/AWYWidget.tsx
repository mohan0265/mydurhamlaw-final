// src/components/awy/AWYWidget.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAWYEnabled } from '@/lib/feature-flags';
import { authedFetch } from '@/lib/api/authedFetch';
import AWYSetupHint from './AWYSetupHint';

type Status = 'online' | 'offline' | 'busy';

/**
 * Presence is stored in a flexible map where the key can be either:
 *  - a peer/user id (preferred), or
 *  - an email (legacy)
 *
 * We’ll look up by peer_id first, and fall back to email.
 */
type PresenceMap = Record<string, Status>;

type Conn = {
  id: string;
  peer_id?: string | null;           // <-- NEW (preferred key for presence)
  email: string;                     // lowercased
  relationship: string | null;
  display_name: string | null;
  status: string | null;             // pending | active | ...
};

const ringClass = (s?: Status) => {
  switch (s) {
    case 'busy':
      return 'bg-amber-500';
    case 'online':
      return 'bg-green-500';
    default:
      return 'bg-gray-400 opacity-60';
  }
};

const computeBottomRight = () => ({ bottom: 24, right: 24 });

async function api<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await authedFetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    try {
      const j = txt ? JSON.parse(txt) : null;
      const msg =
        j?.error || j?.message || txt || `${init?.method || 'GET'} ${input} -> ${r.status}`;
      throw new Error(msg);
    } catch {
      throw new Error(txt || `${init?.method || 'GET'} ${input} -> ${r.status}`);
    }
  }
  return (await r.json()) as T;
}

/** Normalize unknown presence payloads into a PresenceMap.
 * Supports:
 *  - { [idOrEmail]: 'online' | 'offline' | 'busy' }
 *  - { [idOrEmail]: { status: 'online' | ... } }
 *  - { lovedOnes: [{ email, online|connected|status }] }
 *  - [{ email|loved_email, online|connected|status }]
 */
function toPresenceMap(raw: any): PresenceMap {
  if (!raw) return {};

  // Plain map object (by id or email)
  if (typeof raw === 'object' && !Array.isArray(raw) && !('lovedOnes' in raw)) {
    const out: PresenceMap = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!k) continue;
      if (typeof v === 'string') {
        out[k.toLowerCase?.() ?? k] =
          (v.toLowerCase() as Status) in { online: 1, offline: 1, busy: 1 }
            ? (v.toLowerCase() as Status)
            : 'offline';
      } else if (v && typeof v === 'object' && 'status' in v) {
        const s = String((v as any).status || '').toLowerCase();
        out[k.toLowerCase?.() ?? k] =
          (s as Status) in { online: 1, offline: 1, busy: 1 } ? (s as Status) : 'offline';
      }
    }
    return out;
  }

  // lovedOnes array { email, online|connected|status }
  if (raw && typeof raw === 'object' && Array.isArray(raw.lovedOnes)) {
    const map: PresenceMap = {};
    for (const lo of raw.lovedOnes) {
      const key = String(lo?.email || '').toLowerCase();
      if (!key) continue;
      const s =
        lo?.online === true || lo?.connected === true
          ? 'online'
          : String(lo?.status || '').toLowerCase() === 'online'
          ? 'online'
          : 'offline';
      map[key] = s;
    }
    return map;
  }

  // Array of entries with email/loved_email OR id/status
  if (Array.isArray(raw)) {
    const map: PresenceMap = {};
    for (const it of raw) {
      const idKey = (it && (it.id || it.user_id)) as string | undefined;
      const emailKey = String(it?.email || it?.loved_email || '').toLowerCase();
      const s =
        it?.online === true || it?.connected === true
          ? 'online'
          : String(it?.status || '').toLowerCase() === 'online'
          ? 'online'
          : 'offline';
      if (idKey) map[idKey] = s;
      if (emailKey) map[emailKey] = s;
    }
    return map;
  }

  return {};
}

export default function AWYWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [connections, setConnections] = useState<Conn[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});

  useEffect(() => setMounted(true), []);
  const enabled = isAWYEnabled();

  // Allow other components (e.g., a floating heart) to open this panel
  useEffect(() => {
    if (!mounted) return;
    const handler = () => setOpen(true);
    window.addEventListener('awy:open', handler);
    return () => window.removeEventListener('awy:open', handler);
  }, [mounted]);

  // initial load + presence polling
  useEffect(() => {
    if (!mounted || !enabled) return;

    let stop = false;

    const loadConnections = async () => {
      try {
        setLoading(true);
        const data = await api<{ connections: any[] }>('/api/awy/connections');

        const list: Conn[] = (data?.connections || []).map((row) => ({
          id: row.id ?? `${row.peer_id || row.email || row.loved_email || 'unknown'}`,
          peer_id: row.peer_id ?? null, // preferred for presence lookups
          email: String(row.email || row.loved_email || '').toLowerCase(),
          relationship: row.relationship_label ?? row.relationship ?? null,
          display_name: row.display_name ?? null,
          status: row.status ?? null,
        }));

        if (!stop) setConnections(list);
      } catch (e) {
        console.error('[AWY] load connections failed:', e);
        if (!stop) setConnections([]);
      } finally {
        if (!stop) setLoading(false);
      }
    };

    const loadPresence = async () => {
      try {
        const p = await api<any>('/api/awy/presence');
        if (!stop) setPresence(toPresenceMap(p));
      } catch (e) {
        // Presence not critical; keep quiet in UI
        // eslint-disable-next-line no-console
        console.debug('[AWY] presence fetch failed:', e);
      }
    };

    loadConnections().then(loadPresence);
    const id = setInterval(loadPresence, 20000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [mounted, enabled]);

  const presenceFor = (c: Conn): Status | undefined => {
    // Prefer peer_id (user_id-based presence), then fall back to email-based presence
    return (c.peer_id && presence[c.peer_id]) || presence[c.email];
  };

  const onlineCount = useMemo(
    () =>
      connections.reduce((n, c) => {
        const s = presenceFor(c);
        return n + (s === 'online' || s === 'busy' ? 1 : 0);
      }, 0),
    [connections, presence]
  );

  const startCall = async (email: string) => {
    try {
      const res = await api<{ roomUrl?: string; callId?: string; url?: string }>(
        '/api/awy/calls',
        { method: 'POST', body: JSON.stringify({ email }) }
      );

      const url = res.roomUrl || res.url || (res.callId ? `/assistant/call/${res.callId}` : null);
      if (url) {
        window.location.href = url;
      } else {
        alert('Call created, but no room URL was returned.');
      }
    } catch (e: any) {
      console.error('[AWY] call start failed:', e);
      alert(e?.message || 'Could not start the call. Please try again.');
    }
  };

  if (!mounted || !enabled) return null;

  const noConnections = !loading && connections.length === 0;
  const pos = computeBottomRight();

  return (
    <>
      {/* Toggle button */}
      <button
        aria-label="Open AWY"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 focus:outline-none"
        style={{ bottom: pos.bottom, right: pos.right }}
      >
        {/* little presence indicator */}
        <span
          className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
            onlineCount > 0 ? 'bg-green-500' : 'bg-gray-400 opacity-70'
          }`}
          title={onlineCount > 0 ? `${onlineCount} online` : 'No one online'}
        />
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-3.33 0-6 2.24-6 5v1h12v-1c0-2.76-2.67-5-6-5Z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[60] w-[320px] rounded-xl border bg-white/95 p-3 shadow-2xl backdrop-blur"
          style={{ bottom: pos.bottom + 72, right: pos.right - 6 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Always With You</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">Loading…</div>
          ) : noConnections ? (
            <div className="py-4">
              <div className="mb-2 text-sm text-gray-600">
                You haven&apos;t added any loved ones yet.
              </div>
              <AWYSetupHint />
            </div>
          ) : (
            <ul className="space-y-2">
              {connections.map((c) => {
                const st = presenceFor(c);
                const initials =
                  (c.display_name || c.email || '?')
                    .split(/[^\p{L}\p{N}]+/u)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s: string) => s[0]?.toUpperCase())
                    .join('') || '?';

                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border px-2 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold">
                          {initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${ringClass(
                            st
                          )}`}
                          title={st || 'offline'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {c.display_name || c.relationship || 'Loved one'}
                        </div>
                        <div className="truncate text-xs text-gray-600">{c.email}</div>
                      </div>
                    </div>

                    <button
                      className="ml-2 shrink-0 rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      onClick={() => startCall(c.email)}
                      disabled={!st || st === 'offline'}
                      title={st === 'offline' ? 'User is offline' : 'Start a call'}
                    >
                      Call
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
