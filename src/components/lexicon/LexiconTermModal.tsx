"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LexiconTerm {
  term: string;
  definition: string;
  durmah_explanation?: string;
}

interface LexiconTermModalProps {
  term: LexiconTerm | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LexiconTermModal({
  term,
  isOpen,
  onClose,
}: LexiconTermModalProps) {
  if (!term) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1412]/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#123733] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-[#D5BF76]/20 overflow-hidden"
          >
            {/* Header / Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-[#D5BF76] to-indigo-600"></div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-8 md:p-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-[#D5BF76]/60 uppercase tracking-widest">
                    <Sparkles size={12} />
                    Lexicon Master Entry
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {term.term}
                  </h2>
                </div>
              </div>

              <div className="space-y-8">
                {/* Core Definition */}
                <section>
                  <label className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-3">
                    Legal Definition
                  </label>
                  <p className="text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed italic border-l-4 border-purple-500 pl-6 py-1">
                    "{term.definition}"
                  </p>
                </section>

                {/* Durmah's Explanation */}
                {term.durmah_explanation && (
                  <section className="bg-purple-50 dark:bg-purple-900/20 rounded-3xl p-8 border border-purple-100 dark:border-purple-500/10 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 opacity-5 rotate-12">
                      <MessageSquare size={120} className="text-purple-600" />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 mb-4">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-white/10 shadow-sm">
                        <img
                          src="/images/durmah_barrister.png"
                          alt="Durmah"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      Durmah's Context
                    </div>

                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
                      {term.durmah_explanation}
                    </p>
                  </section>
                )}

                <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-medium">
                    This term is part of your core Durham Law vocabulary.
                  </p>
                  <Button
                    onClick={onClose}
                    className="bg-gray-900 dark:bg-white text-white dark:text-[#123733] hover:scale-105 transition-transform rounded-xl px-8 font-bold"
                  >
                    Got it, Back to Work
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
