"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, RefreshCw, Brain } from "lucide-react";

// Dynamic import of the main bootstrap component
const DurmahBootstrap = dynamic(() => import("../DurmahBootstrap"), {
  ssr: false,
});

/**
 * GlobalDurmahSafe
 *
 * A resilient wrapper for the global Durmah widget.
 * Features:
 * - Environment flag to disable globally.
 * - 4s timeout for initialization.
 * - Error boundary & graceful degradation (pill fallback).
 * - Non-blocking dynamic loading.
 */
export default function GlobalDurmahSafe() {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "disabled"
  >("loading");
  const [hasLogged, setHasLogged] = useState(false);

  const isGloballyDisabled =
    process.env.NEXT_PUBLIC_DISABLE_DURMAH_GLOBAL === "true";

  useEffect(() => {
    if (isGloballyDisabled) {
      setStatus("disabled");
      return;
    }

    const timer = setTimeout(() => {
      setStatus((prev) => {
        if (prev === "loading") {
          if (!hasLogged) {
            console.warn(
              "[GLOBAL_DURMAH_SAFE] Durmah failed to initialize within 4s timeout.",
            );
            setHasLogged(true);
          }
          return "error";
        }
        return prev;
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [isGloballyDisabled, hasLogged]);

  const handleRetry = () => {
    setStatus("loading");
    setHasLogged(false);
  };

  const handleReady = () => {
    setStatus((prev) => (prev === "loading" ? "ready" : prev));
  };

  if (status === "disabled") return null;

  if (status === "error") {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/90 backdrop-blur-md border border-amber-200/50 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-amber-900 ring-1 ring-black/5">
          <div className="bg-amber-100 p-2 rounded-xl">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
              System Alert
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Durmah temporarily unavailable
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="ml-2 bg-amber-600 text-white px-3 py-2 rounded-xl hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-200 flex items-center justify-center font-bold text-xs gap-2"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <DurmahBootstrap onReady={handleReady} />
    </Suspense>
  );
}
