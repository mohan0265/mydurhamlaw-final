// src/components/lounge/SectionCard.tsx
import React from "react";

type Props = React.PropsWithChildren<{
  className?: string;
  title?: string;
  right?: React.ReactNode;
}>;

export default function SectionCard({ className, title, right, children }: Props) {
  return (
    <section className={`rounded-2xl border bg-white/70 shadow-sm ${className || ""}`}>
      {(title || right) && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {right ? <div className="text-xs text-gray-500">{right}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
