"use client";
import React, { Suspense } from "react";
import ErrorBoundary from "./ErrorBoundary";
export default function Safe({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading…</div>}>{children}</Suspense>
    </ErrorBoundary>
  );
}
