'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { getSupabaseClient } from '@/lib/supabase/client';

// Dynamically import the AWYWidget to avoid SSR issues
const ClientAWY = dynamic(
  () => import('./awy/AWYWidget').then((mod) => ({ default: mod.AWYWidget })),
  { ssr: false, loading: () => null }
);

async function activateLovedOneOnLogin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return; // <-- guard fixes "possibly null"

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return;

    // Safe, idempotent no-op for student logins; activates pending links for parents
    await supabase.rpc('awy_activate_loved_one_on_login');
  } catch {
    // Intentionally swallow – we don't block UI on this helper
  }
}

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') return;

    // Fire and forget; avoid lint "floating promise"
    void activateLovedOneOnLogin();
  }, [mounted]);

  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') return null;

  return (
    <ErrorBoundary>
      <ClientAWY />
    </ErrorBoundary>
  );
}

export default AWYMountSafe;
