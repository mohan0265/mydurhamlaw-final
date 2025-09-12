'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { getSupabaseClient } from '@/lib/supabase/client';

const ClientAWY = dynamic(
  () => import('./awy/AWYWidget').then(mod => ({ default: mod.AWYWidget })),
  { ssr: false, loading: () => null }
);

async function activateLovedOneOnLogin() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc('awy_activate_loved_one_on_login');
  } catch {
    /* swallow – helper only */
  }
}

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') return;
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
