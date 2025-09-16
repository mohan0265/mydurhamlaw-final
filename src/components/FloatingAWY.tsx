// src/components/FloatingAWY.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAWYEnabled } from '@/lib/feature-flags';
import { authedFetch } from '@/lib/api/authedFetch';

type Status = 'online' | 'offline' | 'busy';
type PresenceMap = Record<string, Status>;

type Conn = {
  id: string;
  email: string;
  relationship: string | null;
  display_name: string | null;
  status: string | null;
};

const POLL_MS = 20_000;

// ---- helpers ---------------------------------------------------------------

async function api<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await authedFetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    try {
      const j = t ? JSON.parse(t) : null;
      throw new Error(j?.error || j?.message || t || `HTTP ${r.status}`);
    } catch {
      throw new Error(t || `HTTP ${r.status}`);
    }
  }
  return (await r.json()) as T;
}

function normalizePresence(raw: any): PresenceMap {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && !('connected' in raw)) {
    return raw as PresenceMap;
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw.lovedOnes)) {
    const map: PresenceMap = {};
    for (const lo of raw.lovedOnes) {
      const email = String(lo?.email || '').toLowerCase();
      if (!email) continue;
      const online =
        lo?.online === true || lo?.connected === true || String(lo?.status || '').toLowerCase() === 'online';
      map[email] = online ? 'online' : 'offline';
    }
    return map;
  }
  if (Array.isArray(raw)) {
    const map: PresenceMap = {};
    for (const it of raw) {
      const email = String(it?.email || it?.loved_email || '').toLowerCase();
      if (!email) continue;
      const online =
        it?.online === true || it?.connected === true || String(it?.status || '').toLowerCase() === 'online';
      map[email] = online ? 'online' : 'offline';
    }
    return map;
  }
  return {};
}

function nameFromConn(c: Conn): string {
  if (c.display_name && c.display_name.trim()) return c.display_name.trim();
  if (c.relationship && c.relationship.trim()) return c.relationship.trim(); // e.g., Mum, Dad
  const nick = c.email.split('@')[0] || c.email;
  return nick.replace(/[._-]+/g, ' ');
}

function dispatchOpen() {
  try {
    window.dispatchEvent(new Event('awy:open'));
  } catch {
    /* no-op */
  }
}

// ---- component -------------------------------------------------------------

export default function FloatingAWY() {
  const [mounted, setMounted] = useState(false);
  const [connections, setConnections] = useState<Conn[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [hovering, setHovering] = useState(false);

  useEffect(() => setMounted(true), []);
  const enabled = isAWYEnabled();
  if (!mounted || !enabled) return null;

  // Load connections once & poll presence
  useEffect(() => {
    let stop = false;
    const loadConnections = async () => {
      try {
        const data = await api<{ ok?: boolean; connections?: any[] }>('/api/awy/connections');
        const rows = (data?.connections || []).map((row) => ({
          id: row.id ?? `${row.email || row.loved_email || 'unknown'}`,
          email: String(row.email || row.loved_email || '').toLowerCase(),
          relationship: row.relationship_label ?? row.relationship ?? null,
          display_name: row.display_name ?? null,
          status: row.status ?? null,
        })) as Conn[];
        if (!stop) setConnections(rows);
      } catch {
        if (!stop) setConnections([]);
      }
    };

    const loadPresence = async () => {
      try {
        const p = await api<any>('/api/awy/presence');
        if (!stop) setPresence(normalizePresence(p));
      } catch {
        /* quiet */
      }
    };

    loadConnections().then(loadPresence);
    const id = setInterval(loadPresence, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const onlineLoved = useMemo(() => {
    const list = connections.filter((c) => {
      const st = presence[c.email];
      return st === 'online' || st === 'busy';
    });
    return list.slice(0, 3).map((c) => nameFromConn(c));
  }, [connections, presence]);

  const anyOnline = onlineLoved.length > 0;

  // ---- UI ------------------------------------------------------------------

  return (
    <div
      className="fixed bottom-6 right-6 z-[70] select-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Hover card */}
      <div
        className={`absolute -top-3 right-0 mb-2 translate-y-[-100%] ${hovering ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-150`}
      >
        <div className="w-max max-w-xs rounded-2xl border bg-white/95 px-3 py-2 text-sm shadow-2xl backdrop-blur">
          {anyOnline ? (
            <div className="space-y-1">
              <div className="font-medium text-gray-800">Online now</div>
              {onlineLoved.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400 ring-2 ring-gray-200" />
              No loved ones online
            </div>
          )}
        </div>
      </div>

      {/* Heart button */}
      <button
        onClick={dispatchOpen}
        aria-label="Open Always With You"
        title={anyOnline ? `${onlineLoved.join(', ')} online` : 'AWY — no one online'}
        className="relative block h-16 w-16 focus:outline-none"
      >
        {/* SVG heart with premium gradient */}
        <svg
          viewBox="0 0 64 64"
          className="h-16 w-16 drop-shadow-[0_6px_14px_rgba(99,102,241,0.35)]"
        >
          <defs>
            <linearGradient id="awyHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />   {/* purple-500 */}
              <stop offset="50%" stopColor="#a78bfa" />  {/* purple-400 */}
              <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
            </linearGradient>
            <radialGradient id="awyGloss" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Heart shape */}
          <path
            d="M32 56s-3.2-2.61-11.6-9.17C11.2 40.84 6 35.6 6 28.5 6 21.04 12.04 15 19.5 15c4.39 0 8.28 2.13 10.5 5.41C32.22 17.13 36.11 15 40.5 15 47.96 15 54 21.04 54 28.5c0 7.1-5.2 12.34-14.4 18.33C35.2 53.39 32 56 32 56z"
            fill="url(#awyHeartGradient)"
          />
          {/* subtle gloss */}
          <path
            d="M32 56s-3.2-2.61-11.6-9.17C11.2 40.84 6 35.6 6 28.5 6 21.04 12.04 15 19.5 15c4.39 0 8.28 2.13 10.5 5.41C32.22 17.13 36.11 15 40.5 15 47.96 15 54 21.04 54 28.5c0 7.1-5.2 12.34-14.4 18.33C35.2 53.39 32 56 32 56z"
            fill="url(#awyGloss)"
            opacity="0.4"
          />

          {/* Inner presence orb backdrop */}
          <circle cx="32" cy="34" r="10" fill="rgba(255,255,255,0.85)" />

          {/* Presence orb */}
          <circle
            cx="32"
            cy="34"
            r="7"
            fill={anyOnline ? '#10b981' : '#9ca3af'} // emerald-500 or gray-400
          />

          {/* Glow ring (only when online) */}
          {anyOnline && (
            <>
              <circle
                cx="32"
                cy="34"
                r="9.5"
                fill="none"
                stroke="#10b981"
                strokeOpacity="0.65"
                className="animate-pulse"
              />
              <circle
                cx="32"
                cy="34"
                r="7"
                fill="none"
                stroke="#10b981"
                strokeOpacity="0.35"
                className="animate-ping"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
