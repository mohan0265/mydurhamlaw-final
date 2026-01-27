import React from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GuideCalloutProps {
  title: string;
  body: string;
  ctaText: string;
  ctaHref: string;
  secondaryText?: string;
  secondaryHref?: string;
  icon?: LucideIcon;
  variant?: "indigo" | "orange" | "purple" | "emerald";
}

export default function GuideCallout({
  title,
  body,
  ctaText,
  ctaHref,
  secondaryText,
  secondaryHref,
  icon: Icon,
  variant = "indigo",
}: GuideCalloutProps) {
  const variants = {
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      iconBg: "bg-white",
      iconColor: "text-indigo-500",
      button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-100",
      iconBg: "bg-white",
      iconColor: "text-orange-500",
      button: "bg-orange-600 hover:bg-orange-700 shadow-orange-100",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      iconBg: "bg-white",
      iconColor: "text-purple-500",
      button: "bg-purple-600 hover:bg-purple-700 shadow-purple-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconBg: "bg-white",
      iconColor: "text-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={`not-prose my-12 p-8 ${style.bg} rounded-3xl border ${style.border} shadow-sm relative overflow-hidden`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{body}</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link href={ctaHref} prefetch={false}>
              <button
                className={`inline-flex items-center gap-2 px-6 py-3 ${style.button} text-white font-bold rounded-xl transition shadow-lg`}
              >
                {ctaText} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            {secondaryText && secondaryHref && (
              <Link
                href={secondaryHref}
                prefetch={false}
                className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors border-b border-gray-300 hover:border-gray-900 pb-0.5"
              >
                {secondaryText}
              </Link>
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={`hidden md:block p-4 ${style.iconBg} rounded-2xl shadow-sm border ${style.border}`}
          >
            <Icon className={`w-12 h-12 ${style.iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}
