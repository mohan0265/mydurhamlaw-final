'use client';

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the AWYWidget to avoid SSR issues
const AWYWidget = dynamic(() => import("./awy/AWYWidget"), { ssr: false });

export default function AWYBootstrap() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only include the widget if feature flag is on (guarded inside AWYWidget anyway)
  if (!isClient) {
    // Show nothing while waiting for hydration
    return null;
  }

  return (
    <>
      <AWYWidget />
      {/* No fallback UI here—AWYWidget will handle fallback (signed out, etc) */}
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
