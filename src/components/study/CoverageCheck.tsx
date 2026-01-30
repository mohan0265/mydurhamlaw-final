import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Upload,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface CoverageRollup {
  total_topics: number;
  covered_topics: number;
  coverage_pct: number;
  missing_topics: { id: string; title: string }[];
  missing_high_importance: { id: string; title: string }[];
}

interface CoverageCheckProps {
  moduleId: string;
  moduleName?: string;
  onContinueAnyway?: () => void;
}

export default function CoverageCheck({
  moduleId,
  moduleName,
  onContinueAnyway,
}: CoverageCheckProps) {
  const [coverage, setCoverage] = useState<CoverageRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchCoverage() {
      try {
        const res = await fetch(`/api/modules/coverage?moduleId=${moduleId}`);
        if (res.ok) {
          const data = await res.json();
          setCoverage(data);
        }
      } catch (err) {
        console.error("Failed to fetch coverage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoverage();
  }, [moduleId]);

  if (loading || dismissed) return null;

  // Case 1: SyllabusShield™ not set up (no topics)
  if (coverage && coverage.total_topics === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">
            Enable SyllabusShield™
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Add your module topics in settings to let Durmah track your lecture
            coverage for better assignment support.
          </p>
          <Link
            href="/study/modules"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1 hover:underline"
          >
            Go to Module Settings <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: Incomplete coverage (guardrail threshold < 85% or high importance missing)
  const isMissingHighImportance =
    coverage && coverage.missing_high_importance.length > 0;
  const isLowCoverage = coverage && coverage.coverage_pct < 85;

  if (coverage && (isLowCoverage || isMissingHighImportance)) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-5 mb-6 shadow-sm border-l-4 border-l-amber-500 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-base font-black text-amber-900 dark:text-amber-100 flex items-center gap-2">
                CoverageCheck: Missing Lecture Data
                {isMissingHighImportance && (
                  <span className="bg-red-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-black tracking-tighter">
                    Critical
                  </span>
                )}
              </h4>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                {coverage.coverage_pct}% Covered
              </span>
            </div>

            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-4">
              Durmah is missing lectures for key syllabus topics in{" "}
              <strong>{moduleName || "this module"}</strong>. Starting an
              assignment now may lead to legal gaps or hallucinations.
            </p>

            {coverage.missing_topics.length > 0 && (
              <div className="mb-5 space-y-2">
                <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest block">
                  Missing Topics:
                </span>
                <div className="flex flex-wrap gap-2">
                  {coverage.missing_topics.slice(0, 3).map((topic) => (
                    <div
                      key={topic.id}
                      className="bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300"
                    >
                      {topic.title}
                    </div>
                  ))}
                  {coverage.missing_topics.length > 3 && (
                    <div className="text-[11px] font-bold text-amber-500 flex items-center">
                      +{coverage.missing_topics.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  (window.location.href = `/study/lectures?module=${moduleId}`)
                }
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
              >
                <Upload className="w-4 h-4" /> Upload Missing Lectures
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDismissed(true);
                  if (onContinueAnyway) onContinueAnyway();
                }}
                className="text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-100/50"
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
