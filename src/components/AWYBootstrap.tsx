'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { getSupabaseClient } from '@/lib/supabase/client';

// Dynamically import the AWYWidget to avoid SSR issues
const ClientAWY = dynamic(
  () => import('./awy/AWYWidget').then(mod => ({ default: mod.AWYWidget })),
  { ssr: false, loading: () => null }
);

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => setMounted(true), []);

  // NEW: once we have a session, call the idempotent activator RPC.
  useEffect(() => {
    if (!mounted || !supabase) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user || cancelled) return;
        // Will activate any pending awy_connections for this email (no-op for students)
        await supabase.rpc('awy_activate_loved_one');
      } catch {
        // ignore – completely safe to fail silently here
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, supabase]);

  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') return null;

  return (
    <ErrorBoundary>
      <ClientAWY />
    </ErrorBoundary>
  );
}

export default AWYMountSafe;
