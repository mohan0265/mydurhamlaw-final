// src/components/demo/DemoBanner.tsx
import React from "react";
import { Info, ExternalLink } from "lucide-react";
import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="bg-indigo-600 text-white py-2 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest z-[100] relative shadow-lg">
      <div className="flex items-center gap-2">
        <div className="bg-white/20 p-1 rounded">
          <Info className="w-3.5 h-3.5" />
        </div>
        <span>Caseway Demo Experience — Data is simulated</span>
      </div>
      <Link
        href="/signup"
        className="flex items-center gap-1.5 hover:underline bg-white/10 px-3 py-1 rounded-full transition-colors"
      >
        Try the real thing <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
