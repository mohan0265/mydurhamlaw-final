'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Robust dynamic import: resolve default if present; fall back to module.
// Cast to a React component so JSX (<ClientAWY />) type-checks cleanly.
const ClientAWY = dynamic(
  () =>
    import('./awy/AWYWidget').then((m: any) => (m?.default ? m.default : m)) as Promise<
      React.ComponentType<any>
    >,
  { ssr: false, loading: () => null }
) as React.FC;

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') return null;

  return (
    <ErrorBoundary>
      <ClientAWY />
    </ErrorBoundary>
  );
}

export default function AWYBootstrap() {
  // Mount once; widget is already client-only via dynamic() and AWYMountSafe
  return (
    <>
      <AWYMountSafe />
      {/* Accessibility ping */}
      <span
        style={{ display: 'none' }}
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
      >
        Always With You floating widget loaded
      </span>
    </>
  );
}
