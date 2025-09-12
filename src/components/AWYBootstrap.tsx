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

// Fire once after auth: parents with a pending email are activated.
// Safe no-op for students or already-activated users.
async function activateLovedOneOnLogin() {
  const supabase = getSupabaseClient();
  // Guard for TypeScript (client always exists in our app, but keeps TS happy)
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc('awy_activate_loved_one_on_login');
  } catch {
    // don't block UI on this helper
  }
}

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Call the activator once after we know we're mounted and feature is enabled
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
