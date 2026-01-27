import React from "react";
import { X, Play, Info, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import Link from "next/link";

interface ClarityCardProps {
  title: string;
  description: string;
  steps: string[];
  watchDemoHref?: string;
  onDismiss: () => void;
  icon?: React.ReactNode;
}

export default function ClarityCard({
  title,
  description,
  steps,
  watchDemoHref,
  onDismiss,
  icon = <Info className="w-5 h-5" />,
}: ClarityCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 transition-colors p-1"
        title="Got it, don't show again"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed max-w-2xl">
            {description}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={onDismiss}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-lg shadow-indigo-100 transition-all border-none"
            >
              Got it — don&apos;t show again
            </Button>

            {watchDemoHref && (
              <Link href={watchDemoHref} prefetch={false}>
                <Button
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-100/50 font-bold rounded-xl px-6 py-2.5 transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Watch 45s
                  Walkthrough
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="md:w-72 shrink-0">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" /> Quick Workflow
          </h3>
          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-gray-700 font-medium"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ClarityNudge({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition"
    >
      <Info className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
