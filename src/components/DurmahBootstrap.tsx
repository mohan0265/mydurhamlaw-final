// src/components/DurmahBootstrap.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { isVoiceEnabled } from "@/lib/feature-flags";

// Load only on client
const DurmahWidget = dynamic(() => import("./DurmahWidget"), { ssr: false });

/** Minimal error boundary so widget errors never crash the page */
class DurmahErrorBoundary extends React.Component<
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
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Durmah widget crashed:", err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function DurmahBootstrap({ onReady }: { onReady?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const enabled = useMemo(
    () => (mounted ? isVoiceEnabled() : false),
    [mounted],
  );

  // Signal readiness when mounted and enabled (or if disabled, we still signal so wrapper knows we tried)
  useEffect(() => {
    if (mounted && onReady) {
      onReady();
    }
  }, [mounted, onReady]);

  if (!mounted || !enabled) return null;

  return (
    <DurmahErrorBoundary>
      <DurmahWidget />
    </DurmahErrorBoundary>
  );
}
