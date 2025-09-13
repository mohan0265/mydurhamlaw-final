// src/components/awy/AWYSetupHint.tsx
import Link from "next/link";
import React from "react";

export default function AWYSetupHint() {
  return (
    <Link
      href="/settings/awy"
      className="fixed bottom-28 right-6 z-[60] rounded-full border bg-white/90 px-4 py-2 text-sm shadow-md backdrop-blur hover:bg-white"
    >
      Add loved ones →
    </Link>
  );
}
