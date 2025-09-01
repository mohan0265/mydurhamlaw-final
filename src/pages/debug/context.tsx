import dynamic from "next/dynamic";
import React from "react";
import { useDurmah } from "../../lib/durmah/context";
function DebugContextInner() {
  const ctx = useDurmah();
  const winCtx =
    typeof window !== "undefined" ? (window as any).__mdlStudentContext : undefined;

  return (
    <div className="p-6 space-y-6 text-sm">
      <h1 className="text-xl font-semibold">Debug  Context</h1>

      <section>
        <h2 className="font-medium mb-2">useDurmah()</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
{JSON.stringify(ctx, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="font-medium mb-2">window.__mdlStudentContext</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto">
{JSON.stringify(winCtx, null, 2)}
        </pre>
      </section>
    </div>
  );
}

// Disable SSR so we can safely read window.*
export default dynamic(() => Promise.resolve(DebugContextInner), { ssr: false });
