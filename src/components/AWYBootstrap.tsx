'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/AuthContext';
import { isAWYEnabled } from '@/lib/feature-flags';

const AWYWidget = dynamic(() => import('./awy/AWYWidget'), { ssr: false });

class AWYErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('AWY widget crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="fixed bottom-24 right-24 z-[60] rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shadow">
            AWY widget unavailable
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const AWYBootstrap: React.FC = () => {
  const { user } = useAuth() || { user: null };
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const enabled = useMemo(() => {
    if (!mounted) return false;
    if (!user?.id) return false;
    return isAWYEnabled();
  }, [mounted, user?.id]);

  if (!enabled) {
    return null;
  }

  return (
    <AWYErrorBoundary
      fallback={
        <div className="fixed bottom-24 right-24 z-[60] rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 shadow">
          AWY widget unavailable
        </div>
      }
    >
      <AWYWidget />
    </AWYErrorBoundary>
  );
};

export default AWYBootstrap;
