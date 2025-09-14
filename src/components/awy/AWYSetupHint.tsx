// src/components/awy/AWYSetupHint.tsx
import Link from "next/link";

export default function AWYSetupHint() {
  return (
    <Link
      href="/settings/awy"
      className="inline-flex items-center gap-1 rounded-full border bg-white/90 px-3 py-1.5 text-sm shadow-sm backdrop-blur hover:bg-white"
    >
      Add loved ones →
    </Link>
  );
}
