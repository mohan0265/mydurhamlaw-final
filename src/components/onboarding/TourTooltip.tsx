import React, { useState, useEffect } from "react";
import { TooltipRenderProps } from "react-joyride";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useTour } from "./TourProvider";

export const TourTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) => {
  const { setShouldPersist } = useTour();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Sync checkbox state with provider
  useEffect(() => {
    setShouldPersist(dontShowAgain);
  }, [dontShowAgain, setShouldPersist]);

  return (
    <div
      {...tooltipProps}
      className="max-w-md bg-white rounded-2xl shadow-xl border border-white/20 flex flex-col relative z-50 animate-tour-slide-up"
      style={{
        width: "320px",
        padding: "0",
      }}
    >
      {/* Dynamic Style Injection for Micro-animations */}
      <style>{`
        @keyframes tour-slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tour-pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .animate-tour-slide-up {
          animation: tour-slide-up 180ms ease-out forwards;
        }
        .tour-highlight-pulse {
          animation: tour-pulse 2s infinite;
        }
      `}</style>

      {/* Header / Close */}
      <div className="flex justify-between items-start p-4 pb-2">
        {step.title && (
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {step.title}
          </h3>
        )}
        <button
          {...closeProps}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 -mr-2 -mt-2"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-2 text-sm text-gray-600 leading-relaxed">
        {step.content}
      </div>

      {/* Footer */}
      <div className="p-4 pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3">
        {/* Progress & Controls Row */}
        <div className="flex justify-between items-center">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Step {index + 1} of {size}
          </div>

          <div className="flex gap-2">
            {index > 0 && (
              <button
                {...backProps}
                className="text-gray-500 hover:text-gray-800 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              {...primaryProps}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1"
            >
              {isLastStep ? (
                <>
                  Checking <Check size={14} />
                </>
              ) : (
                <>
                  Next <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Don't Show Again Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition cursor-pointer"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors select-none">
              Don&apos;t show this tour again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
