// src/pages/debug/context.tsx
"use client";

import React from "react";
import { useDurmah } from "@/lib/durmah/context";

export default function DebugContextPage() {
  const ctx = useDurmah();
  const winCtx =
    typeof window !== "undefined" ? (window as any).__mdlStudentContext : null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Debug • Context</h1>

      <section>
        <h2 className="font-medium mb-2">useDurmah()</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
          {JSON.stringify(ctx, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="font-medium mb-2">window.__mdlStudentContext</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
          {JSON.stringify(winCtx, null, 2)}
        </pre>
      </section>
    </div>
  );
}