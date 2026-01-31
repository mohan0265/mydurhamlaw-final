import React, { useEffect, useState } from "react";
import { ShieldCheck, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ModuleRollup {
  module_id: string;
  coverage_pct: number;
  total_topics: number;
  covered_topics: number;
  module_catalog?: {
    title: string;
    code: string;
  };
}

export default function ModuleReadinessWidget() {
  const [data, setData] = useState<ModuleRollup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch("/api/modules/coverage");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load readiness", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 h-full shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          SyllabusShield™
        </h3>
        <Link
          href="/study/modules"
          className="text-[10px] font-bold text-gray-500 hover:text-purple-600 uppercase tracking-widest flex items-center gap-1 transition"
        >
          Settings <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* BIG CIRCULAR PROGRESS (Landing Page Style) */}
        {data.length > 0 && (
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 58}
                strokeDashoffset={
                  2 * Math.PI * 58 * (1 - data[0].coverage_pct / 100)
                }
                fill="transparent"
                strokeLinecap="round"
                className="text-purple-600 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                {data[0].coverage_pct}%
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">
                Syllabus Readiness
              </span>
            </div>
          </div>
        )}

        <div className="w-full space-y-4">
          {data.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 mb-2">
                No coverage data yet.
              </p>
              <Link
                href="/study/modules"
                className="text-[10px] font-black text-purple-600 uppercase underline"
              >
                Add Syllabus Topics
              </Link>
            </div>
          ) : (
            data.slice(0, 2).map((mod) => (
              <div key={mod.module_id} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
                      {mod.module_catalog?.code || "MDL"}
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">
                      {mod.module_catalog?.title || "Module"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-black ${mod.coverage_pct >= 85 ? "text-green-600" : mod.coverage_pct > 50 ? "text-amber-500" : "text-rose-500"}`}
                    >
                      {mod.coverage_pct}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${mod.coverage_pct >= 85 ? "bg-green-500" : mod.coverage_pct > 50 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${mod.coverage_pct}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center gap-2">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded-lg">
          <AlertCircle className="w-3 h-3 text-purple-600" />
        </div>
        <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400 italic">
          &ldquo;Better coverage means more accurate Durmah support.&rdquo;
        </p>
      </div>
    </div>
  );
}
