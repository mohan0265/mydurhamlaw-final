'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/supabase/AuthContext';
import { isAWYEnabled } from '@/lib/feature-flags';

const AWYWidget = dynamic(() => import('./awy/AWYWidget'), { ssr: false });

class AWYErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('AWY widget crashed:', error);
  }

  render() {
    if (this.state.hasError) return null;
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
    <AWYErrorBoundary>
      <AWYWidget />
    </AWYErrorBoundary>
  );
};

export default AWYBootstrap;
