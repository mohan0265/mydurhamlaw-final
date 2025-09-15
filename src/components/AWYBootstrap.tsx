'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

// Load the actual widget only on the client to avoid hydration issues
const AWYWidget = dynamic(() => import('./awy/AWYWidget'), { ssr: false });

/**
 * Robust feature gate for AWY.
 * - Honors either NEXT_PUBLIC_ENABLE_AWY or NEXT_PUBLIC_FEATURE_AWY
 *   with values "1" or "true" (case-insensitive).
 * - Allows local overrides via:
 *   • URL param ?awy=1
 *   • localStorage key "awy:enabled" === "1"
 */
function isAWYEnabled(): boolean {
  // Env flags are inlined at build time
  const envA = (process.env.NEXT_PUBLIC_ENABLE_AWY ?? '').toString().toLowerCase();
  const envB = (process.env.NEXT_PUBLIC_FEATURE_AWY ?? '').toString().toLowerCase();
  const envOn = envA === '1' || envA === 'true' || envB === '1' || envB === 'true';

  if (typeof window === 'undefined') return envOn;

  try {
    const url = new URL(window.location.href);
    const urlOverride = url.searchParams.get('awy');
    if (urlOverride === '1') return true;

    const ls = window.localStorage?.getItem('awy:enabled');
    if (ls === '1') return true;
  } catch {
    // ignore
  }

  return envOn;
}

/**
 * Tiny error boundary so a widget error never crashes the page.
 */
class AWYErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Surface to console so we can diagnose quickly
    // (Netlify/Next logs will also capture this)
    // eslint-disable-next-line no-console
    console.error('AWY widget crashed:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const AWYBootstrap: React.FC = () => {
  // Ensure we only render on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evaluate the gate once per mount
  const enabled = useMemo(() => (mounted ? isAWYEnabled() : false), [mounted]);

  if (!mounted || !enabled) {
    return null;
  }

  return (
    <AWYErrorBoundary>
      <AWYWidget />
    </AWYErrorBoundary>
  );
};

export default AWYBootstrap;
