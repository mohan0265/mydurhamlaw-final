'use client';

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Dynamically import the AWYWidget to avoid SSR issues
const ClientAWY = dynamic(() => import("./awy/AWYWidget"), { ssr: false });

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

export default function AWYBootstrap() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only include the widget if feature flag is on and client is ready
  if (!isClient) {
    // Show nothing while waiting for hydration
    return null;
  }

  return (
    <>
      <AWYMountSafe />
      {/* Ensure proper ARIA landmark for widget */}
      <span
        style={{ display: "none" }}
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
      >
        Always With You floating widget loaded
      </span>
    </>
  );
}
