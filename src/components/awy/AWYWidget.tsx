'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { isAWYEnabled } from '@/lib/feature-flags';
import { authedFetch } from '@/lib/api/authedFetch';
import { getSupabaseClient } from '@/lib/supabase/client';
import AWYSetupHint from './AWYSetupHint';

type Status = 'online' | 'offline' | 'busy';

type Conn = {
  id: string;
  email: string;
  display_name: string | null;
  relationship: string | null;
  status?: Status;
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

export default function AWYWidget() {
  const { user } = useAuth() || { user: null };
  const authed = Boolean(user?.id);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Conn[]>([]);
  const [presenceState, setPresenceState] = useState<Record<string, Status>>({});
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => setMounted(true), []);
  const featureEnabled = isAWYEnabled();
  const enabled = featureEnabled && authed;

  // 1. Load connections (friends/family)
  useEffect(() => {
    if (!mounted || !enabled) return;

    const loadConnections = async () => {
      try {
        setLoading(true);
        const response = await authedFetch('/api/awy/connections');
        if (response.status === 401) {
          setNeedsAuth(true);
          return;
        }
        if (!response.ok) throw new Error('Failed to load connections');
        
        const json = await response.json();
        const rows = Array.isArray(json?.connections) ? json.connections : [];
        
        const list: Conn[] = rows.map((row: any) => ({
          id: row.id ?? row.email,
          email: String(row.email || '').toLowerCase(),
          display_name: row.display_name ?? null,
          relationship: row.relationship_label ?? row.relationship ?? null,
        }));
        
        setConnections(list);
      } catch (err) {
        console.error('[AWY] Load connections failed', err);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [mounted, enabled]);

  // 2. Supabase Realtime Presence
  useEffect(() => {
    if (!mounted || !enabled || !user?.id) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Channel for global presence or a specific room
    // For simplicity, we'll use a global 'awy-presence' room, 
    // but in production this should be scoped or RLS protected.
    const channel = supabase.channel('awy-global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const map: Record<string, Status> = {};
        
        // Map presence state to our format
        // newState is { [userId]: [{ user_id: '...', online_at: '...' }, ...] }
        Object.values(newState).forEach((presences: any) => {
          for (const p of presences) {
             if (p.user_id) {
               map[p.user_id] = 'online'; // If they are in the channel, they are online
             }
             if (p.email) {
               map[p.email.toLowerCase()] = 'online';
             }
          }
        });
        setPresenceState(map);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track my own status
          await channel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString(),
            status: 'online'
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, enabled, user]);

  const onlineCount = useMemo(() => {
    return connections.reduce((count, conn) => {
      // Check if connection is online via presence map (by ID or Email)
      // Note: Realtime presence usually gives us user_ids. 
      // We need to match connections (which might have user_id) to presence keys.
      // Assuming we can match by email or some ID if available.
      // For now, let's assume we might not have their user_id in 'connections' list 
      // unless the API returns it.
      
      // If the API returns a user_id for the connection, use it.
      // Otherwise fallback to email if the presence payload includes it.
      const isOnline = presenceState[conn.id] === 'online' || presenceState[conn.email] === 'online';
      return count + (isOnline ? 1 : 0);
    }, 0);
  }, [connections, presenceState]);

  const startCall = async (email: string) => {
    // Stub for WebRTC call
    console.log('[AWY] Starting call with', email);
    // In a real app, this would create a room and send a notification
    const roomUrl = `/assistant/call/${btoa(email)}`; // Mock URL
    window.open(roomUrl, '_blank');
  };

  if (!mounted || !enabled) return null;

  const pos = computeBottomRight();

  return (
    <>
      <button
        aria-label="Open AWY"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl hover:bg-violet-700 focus:outline-none transition-transform hover:scale-105 active:scale-95"
        style={{ bottom: pos.bottom, right: pos.right }}
      >
        <span
          className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white transition-colors ${
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
          className="fixed z-[60] w-[320px] rounded-xl border bg-white/95 p-3 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{ bottom: pos.bottom + 72, right: pos.right - 6 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800">Always With You</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          {needsAuth && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Sign in to see your loved ones. <a href="/login" className="underline">Login</a>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
          ) : connections.length === 0 ? (
            <div className="py-4">
              <div className="mb-2 text-sm text-gray-600">No loved ones added yet.</div>
              <AWYSetupHint />
            </div>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {connections.map((c) => {
                const isOnline = presenceState[c.id] === 'online' || presenceState[c.email] === 'online';
                const status: Status = isOnline ? 'online' : 'offline';
                
                const initials = (c.display_name || c.email).substring(0, 2).toUpperCase();

                return (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                          {initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${ringClass(status)}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {c.display_name || c.relationship || 'Loved One'}
                        </div>
                        <div className="truncate text-xs text-gray-500">{c.email}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => startCall(c.email)}
                      disabled={!isOnline}
                      className={`ml-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isOnline 
                          ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
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
