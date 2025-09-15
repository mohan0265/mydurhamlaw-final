// src/components/PresenceBadge.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { isAWYEnabled } from '@/lib/feature-flags';

type PresenceState = 'offline' | 'online' | 'connecting' | 'error';

export default function PresenceBadge() {
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [awyPresence, setAwyPresence] = useState<PresenceState>('offline');

  // 1) Track auth state (signed in/out)
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      setSignedIn(false);
      return;
    }

    // Initial fetch
    sb.auth
      .getSession()
      .then(({ data }) => setSignedIn(!!data?.session))
      .catch(() => setSignedIn(false));

    // Subscribe to auth state changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => {
      try {
        sub.subscription.unsubscribe();
      } catch {
        /* no-op */
      }
    };
  }, []);

  // 2) If AWY is enabled & signed in, probe the presence endpoint
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let aborted = false;

    async function checkPresence() {
      if (!isAWYEnabled() || !signedIn) {
        setAwyPresence(signedIn ? 'online' : 'offline');
        return;
      }

      const sb = getSupabaseClient();
      if (!sb) {
        setAwyPresence('error');
        return;
      }

      setAwyPresence('connecting');

      try {
        const { data } = await sb.auth.getSession();
        const token = data?.session?.access_token;

        const res = await fetch('/api/awy/presence', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Expecting something like { connected: boolean } or an array that indicates online
        const connected =
          (typeof json?.connected === 'boolean' && json.connected) ||
          (Array.isArray(json) &&
            json.some((x: any) => x?.me || x?.online || x?.connected));

        setAwyPresence(connected ? 'online' : 'offline');
      } catch {
        setAwyPresence('error');
      }
    }

    // Poll every 20s while signed in & awy on
    const loop = async () => {
      if (aborted) return;
      await checkPresence();
      if (aborted) return;
      timer = setTimeout(loop, 20000);
    };

    loop();

    return () => {
      aborted = true;
      if (timer) clearTimeout(timer);
    };
  }, [signedIn]);

  const label = useMemo(() => {
    if (!signedIn) return 'Offline';
    if (!isAWYEnabled()) return 'Online';
    if (awyPresence === 'connecting') return 'Connecting…';
    if (awyPresence === 'error') return 'Online (AWY err)';
    return awyPresence === 'online' ? 'Online' : 'Online (AWY off)';
  }, [signedIn, awyPresence]);

  const isGreen =
    signedIn &&
    (awyPresence === 'online' || !isAWYEnabled() || awyPresence === 'error');

  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        background: isGreen ? 'rgba(34,197,94,.12)' : 'rgba(107,114,128,.12)',
        color: isGreen ? '#059669' : '#4b5563',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: isGreen ? '#10b981' : '#9ca3af',
        }}
      />
      {label}
    </span>
  );
}
