'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Dynamically import the AWYWidget to avoid SSR issues
const ClientAWY = dynamic(() => import('./awy/AWYWidget').then(mod => ({ default: mod.AWYWidget })), { 
  ssr: false,
  loading: () => null
});

function AWYMountSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_FEATURE_AWY !== "1") return null;

  return (
    <ErrorBoundary>
      <ClientAWY />
    </ErrorBoundary>
  );
}

export default AWYMountSafe;