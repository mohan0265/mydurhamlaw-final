// src/components/awy/AWYWidget.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { isAWYEnabled } from '@/lib/feature-flags';
import { authedFetch } from '@/lib/api/authedFetch';
import AWYSetupHint from './AWYSetupHint';

type Status = 'online' | 'offline' | 'busy';

type PresenceMap = Record<string, Status>;

type Conn = {
  id: string;
  peer_id?: string | null;
  email: string;
  relationship: string | null;
  display_name: string | null;
  status: string | null;
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

function toPresenceMap(raw: any): PresenceMap {
  if (!raw) return {};

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
  const { user } = useAuth() || { user: null };
  console.debug('[AWY] mounting with authed=' + Boolean(user?.id));
  const authed = Boolean(user?.id);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Conn[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [needsAuth, setNeedsAuth] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const needsAuthRef = useRef(false);

  useEffect(() => {
    needsAuthRef.current = needsAuth;
  }, [needsAuth]);

  useEffect(() => setMounted(true), []);
  const featureEnabled = isAWYEnabled();
  const enabled = featureEnabled && authed;

  useEffect(() => {
    if (!mounted || !enabled) return;
    const handler = () => setOpen(true);
    window.addEventListener('awy:open', handler);
    return () => window.removeEventListener('awy:open', handler);
  }, [mounted, enabled]);

  useEffect(() => {
    if (!mounted || !enabled) {
      if (!authed) {
        setConnections([]);
        setPresence({});
      }
      setLoading(false);
      setNeedsAuth(false);
      setFetchError(false);
      return;
    }

    if (needsAuth) {
      setLoading(false);
      return;
    }

    let stop = false;
    const safe = (fn: () => void) => {
      if (!stop) fn();
    };

    const loadConnections = async () => {
      safe(() => {
        setLoading(true);
        setFetchError(false);
      });

      try {
        const response = await authedFetch('/api/awy/connections');

        if (stop) return;

        if (response.status === 401) {
          safe(() => {
            setNeedsAuth(true);
            setConnections([]);
            setPresence({});
            setLoading(false);
          });
          return;
        }

        if (!response.ok) {
          console.debug('[AWY] connections status:', response.status);
          safe(() => {
            setFetchError(true);
            setConnections([]);
            setLoading(false);
          });
          return;
        }

        const json = await response.json().catch(() => null);
        if (stop) return;

        const rows = Array.isArray(json?.connections) ? json.connections : [];
        const list: Conn[] = rows.map((row: any) => ({
          id: row.id ?? `${row.peer_id || row.email || row.loved_email || 'unknown'}`,
          peer_id: row.peer_id ?? null,
          email: String(row.email || row.loved_email || '').toLowerCase(),
          relationship: row.relationship_label ?? row.relationship ?? null,
          display_name: row.display_name ?? null,
          status: row.status ?? null,
        }));

        safe(() => {
          setConnections(list);
          setNeedsAuth(false);
          setLoading(false);
        });
      } catch (error) {
        console.debug('[AWY] load connections failed:', error);
        if (stop) return;
        safe(() => {
          setFetchError(true);
          setConnections([]);
          setLoading(false);
        });
      }
    };

    const loadPresence = async () => {
      if (needsAuthRef.current) return;
      try {
        const response = await authedFetch('/api/awy/presence');

        if (stop) return;

        if (response.status === 401) {
          safe(() => {
            setNeedsAuth(true);
            setPresence({});
          });
          return;
        }

        if (!response.ok) {
          console.debug('[AWY] presence status:', response.status);
          safe(() => {
            setFetchError(true);
            setPresence({});
          });
          return;
        }

        const payload = await response.json().catch(() => null);
        if (stop) return;

        const nextPresence = payload && payload.ok === false ? {} : toPresenceMap(payload);
        safe(() => {
          setPresence(nextPresence);
        });
      } catch (error) {
        console.debug('[AWY] presence fetch failed:', error);
        if (stop) return;
        safe(() => {
          setFetchError(true);
          setPresence({});
        });
      }
    };

    loadConnections().then(() => {
      if (!needsAuthRef.current) {
        loadPresence();
      }
    });

    const intervalId = setInterval(() => {
      if (!needsAuthRef.current) {
        loadPresence();
      }
    }, 20000);

    return () => {
      stop = true;
      clearInterval(intervalId);
    };
  }, [mounted, enabled, authed, needsAuth]);

  const presenceFor = (c: Conn): Status | undefined =>
    (c.peer_id && presence[c.peer_id]) || presence[c.email];

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
      const response = await authedFetch('/api/awy/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.status === 401) {
        setNeedsAuth(true);
        return;
      }

      if (!response.ok) {
        console.warn('[AWY] call start status:', response.status);
        setFetchError(true);
        return;
      }

      const res = (await response.json().catch(() => ({}))) as {
        roomUrl?: string;
        callId?: string;
        url?: string;
      };

      const url = res.roomUrl || res.url || (res.callId ? `/assistant/call/${res.callId}` : null);
      if (url) {
        window.location.href = url;
      } else {
        console.warn('[AWY] call start returned no URL', res);
      }
    } catch (error) {
      console.error('[AWY] call start failed:', error);
      setFetchError(true);
    }
  };

  if (!mounted || !enabled) return null;

  const noConnections = !loading && connections.length === 0;
  const pos = computeBottomRight();

  try {
    return (
    <>
      <button
        aria-label="Open AWY"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 focus:outline-none"
        style={{ bottom: pos.bottom, right: pos.right }}
      >
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

          {needsAuth && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Sign in to enable Always-With-You presence.{' '}
              <a className="font-medium text-amber-900 underline" href="/login">
                Sign in
              </a>
            </div>
          )}

          {!needsAuth && fetchError && (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              Unable to refresh presence right now. We'll retry automatically.
            </div>
          )}

          {needsAuth ? (
            <div className="py-4 text-sm text-gray-600">
              We could not confirm your session. Please sign in again to reach your loved ones.
            </div>
          ) : loading ? (
            <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
          ) : noConnections ? (
            <div className="py-4">
              <div className="mb-2 text-sm text-gray-600">
                You haven't added any loved ones yet.
              </div>
              <AWYSetupHint />
            </div>
          ) : (
            <ul className="space-y-2">
              {connections.map((c) => {
                const st = presenceFor(c);
                const initials =
                  (c.display_name || c.email || '?')
                    .split(/[^A-Za-z0-9]+/)
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
  } catch (e) {
    console.error('[AWY] render failed:', e);
    return (
      <div className="fixed bottom-24 right-24 z-[60] rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shadow">
        AWY widget unavailable
      </div>
    );
  }
}
