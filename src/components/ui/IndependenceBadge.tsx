import React from "react";
import { ShieldAlert } from "lucide-react";

interface Props {
  variant?: "hero" | "header" | "footer";
  className?: string;
}

export function IndependenceBadge({ variant = "hero", className = "" }: Props) {
  const text =
    "Independent platform — not affiliated with or endorsed by Durham University.";

  if (variant === "header") {
    // Compact for header
    return (
      <div
        className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 ${className}`}
        aria-label="Independence Disclaimer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
        {text}
      </div>
    );
  }

  if (variant === "footer") {
    // Just the text via props effectively, but we'll use a span for styling consistency if needed
    // Actually, full footer text is usually handled by the footer component itself
    // but this badge can be used for the short version if needed there too.
    return (
      <div
        className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}
      >
        <ShieldAlert className="w-4 h-4" />
        {text}
      </div>
    );
  }

  // Default: Hero (Prominent)
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-black/30 backdrop-blur border border-gray-200 dark:border-white/10 shadow-sm ${className}`}
    >
      <ShieldAlert className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
        {text}
      </span>
    </div>
  );
}
