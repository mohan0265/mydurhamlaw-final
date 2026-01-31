"use client";

import React, { useState, useEffect } from "react";
import {
  Book,
  Search,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Command,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface GlossaryTerm {
  term: string;
  definition: string;
}

export default function LexiconQuickWidget() {
  const [brainstormTerms, setBrainstormTerms] = useState<GlossaryTerm[]>([]);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [recentTerms, setRecentTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLexiconData = async () => {
    setLoading(true);
    try {
      const [brainstormRes, recentRes] = await Promise.all([
        fetch("/api/study/glossary/brainstorm"),
        fetch("/api/study/glossary/list"),
      ]);

      if (brainstormRes.ok) {
        const terms = await brainstormRes.json();
        setBrainstormTerms(terms);
        setCurrentTermIndex(0);
      }
      if (recentRes.ok) {
        const all = await recentRes.json();
        setRecentTerms(all.slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to fetch Lexicon data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Rotation Logic
  useEffect(() => {
    if (brainstormTerms.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTermIndex((prev) => (prev + 1) % brainstormTerms.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [brainstormTerms]);

  useEffect(() => {
    fetchLexiconData();
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border border-white/20 bg-white flex items-center justify-center">
            <img
              src="/images/icons/learn.png"
              className="w-full h-full object-cover"
              alt="Lexicon"
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Law Lexicon</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Master Your Vocab
            </p>
          </div>
        </div>
        <button
          onClick={fetchLexiconData}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Term of the Day / Featured (Now Rotating Brainstorming Box) */}
        <div className="relative min-h-[120px]">
          <AnimatePresence mode="wait">
            {brainstormTerms.length > 0 ? (
              <motion.div
                key={brainstormTerms[currentTermIndex].term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="relative p-5 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-gray-800/50 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20 overflow-hidden"
              >
                <div className="absolute -top-1 -right-1 opacity-10 rotate-12">
                  <Sparkles size={48} className="text-indigo-600" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">
                  <Sparkles size={10} />
                  Memory Kindling
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {brainstormTerms[currentTermIndex].term}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic line-clamp-3">
                  "{brainstormTerms[currentTermIndex].definition}"
                </p>
              </motion.div>
            ) : (
              !loading && (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">
                    Add lectures to build your lexicon.
                  </p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Mini List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Recent Terms
            </span>
            <Link
              href="/study/glossary"
              className="text-[10px] font-bold text-purple-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {recentTerms.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl transition cursor-default"
              >
                <span className="text-sm font-semibold text-gray-700 truncate mr-4">
                  {t.term}
                </span>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Search CTA */}
      <div className="p-4 bg-gray-50/80 border-t border-gray-100">
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-lexicon-search"))
          }
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-purple-300 hover:text-purple-600 transition shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-purple-500" />
            Quick Lookup...
          </div>
          <div className="flex items-center gap-1 opacity-50 px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">
            <Command size={10} />K
          </div>
        </button>
      </div>
    </div>
  );
}
