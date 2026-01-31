"use client";

import React from "react";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InterventionBannerProps {
  isVisible: boolean;
  message: string;
  suggestion?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  variant?: "warning" | "info" | "success";
}

export default function InterventionBanner({
  isVisible,
  message,
  suggestion,
  actionLabel,
  onAction,
  onDismiss,
  variant = "warning",
}: InterventionBannerProps) {
  const bgColor = {
    warning:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  }[variant];

  const iconColor = {
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
    success: "text-green-600 dark:text-green-400",
  }[variant];

  const textColor = {
    warning: "text-amber-800 dark:text-amber-200",
    info: "text-blue-800 dark:text-blue-200",
    success: "text-green-800 dark:text-green-200",
  }[variant];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: "auto", opacity: 1, marginTop: 12 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          className={`overflow-hidden rounded-xl border ${bgColor} shadow-sm`}
        >
          <div className="p-4 flex gap-4 items-start">
            <div className={`mt-0.5 ${iconColor}`}>
              <AlertCircle size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold mb-1 ${textColor}`}>
                {message}
              </p>
              {suggestion && (
                <p className="text-sm opacity-80 leading-relaxed mb-3">
                  {suggestion}
                </p>
              )}

              <div className="flex items-center gap-3">
                {onAction && actionLabel && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onAction();
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-gray-950 border border-current rounded-md hover:bg-current hover:text-white transition-colors flex items-center gap-1.5"
                    style={{ borderColor: "currentColor", color: "inherit" }}
                  >
                    {actionLabel}
                    <ArrowRight size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDismiss();
                  }}
                  className="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  <X size={12} />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
