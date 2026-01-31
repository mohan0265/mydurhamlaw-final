"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STARTER_TERMS, LexiconTerm } from "@/data/lexicon/starter-terms";
import { LexiconTermModal } from "./LexiconTermModal";
import { Sparkles, ArrowRight, BookOpen, Info } from "lucide-react";

interface LexiconRotatingBannerProps {
  mode?: "public" | "auth";
  className?: string;
}

export function LexiconRotatingBanner({
  mode = "public",
  className = "",
}: LexiconRotatingBannerProps) {
  const [terms, setTerms] = useState<LexiconTerm[]>(STARTER_TERMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<LexiconTerm | null>(null);

  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverPauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch from API if in auth mode (optional enhancement, sticking to starter terms for now for stability)
  useEffect(() => {
    if (mode === "auth") {
      fetch("/api/study/glossary/brainstorm")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (data && data.length > 0) {
            setTerms(data);
          }
        })
        .catch((err) => console.error("Failed to fetch terms:", err));
    }
  }, [mode]);

  // Rotation Logic
  useEffect(() => {
    if (isHovered) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      return;
    }

    rotationTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % terms.length);
    }, 5000);

    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isHovered, terms.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowMeaning(true);

    // Resume after 5 seconds even if still hovered?
    // User said: "mouse over... banner will stop rotating... in 5 secs (I think this is the time we decided)"
    // Interpreting: Pause rotation on hover. Show meaning. If they stay hovered, maybe it stays paused?
    // Actually "stop rotating in 5 secs" might mean the CYCLE is 5 secs, or it pauses FOR 5 secs.
    // "stop rotating... and a toast will display... student can click"
    // I'll pause INDEFINITELY while hovered to allow reading, but show the "Meaning" toast immediately.
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowMeaning(false);
  };

  const currentTerm = terms[currentIndex];

  return (
    <div className={`relative ${className}`}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setSelectedTerm(currentTerm)}
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-[#123733] border border-[#D5BF76]/20 p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-[#D5BF76]/10 hover:-translate-y-1"
      >
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D5BF76]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#D5BF76]/10 transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl -ml-12 -mb-12"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D5BF76]/20 flex items-center justify-center text-[#D5BF76] shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black text-[#D5BF76]/60 uppercase tracking-widest mb-1">
                <Sparkles size={12} className="animate-pulse" />
                Legal Eagle Vocabulary
              </div>
              <AnimatePresence mode="wait">
                <motion.h3
                  key={currentTerm.term}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-2xl font-black text-white tracking-tight"
                >
                  {currentTerm.term}
                </motion.h3>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <AnimatePresence>
              {showMeaning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 p-3 pr-5 rounded-2xl shadow-xl max-w-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-[#D5BF76] flex items-center justify-center text-[#123733] shrink-0">
                    <Info size={16} />
                  </div>
                  <p className="text-xs font-medium text-teal-50 leading-relaxed italic line-clamp-2">
                    {currentTerm.definition}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D5BF76] text-[#123733] font-bold text-sm hover:bg-white transition-colors">
              Master Entry <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar for Rotation */}
        {!isHovered && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-gradient-to-r from-purple-500 to-[#D5BF76]"
            />
          </div>
        )}
      </div>

      {/* Mobile/Tablet Meaning Toast */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="lg:hidden absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] bg-white dark:bg-[#0B1412] p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl z-50 text-center pointer-events-none"
          >
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed italic">
              "{currentTerm.definition}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <LexiconTermModal
        isOpen={!!selectedTerm}
        term={selectedTerm}
        onClose={() => setSelectedTerm(null)}
      />
    </div>
  );
}
