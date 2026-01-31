"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LexiconTerm {
  term: string;
  definition: string;
  durmah_explanation?: string;
  id?: string;
  userNotes?: string;
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
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState(term?.userNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!term) return null;

  const handleSaveNote = async () => {
    if (!term.id) return;

    setIsSaving(true);
    try {
      // TODO: Call API to save note to lexicon_user_stars
      await fetch("/api/lexicon/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId: term.id,
          notes: noteText,
        }),
      });

      // Close note editor after save
      setShowNoteEditor(false);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

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

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-white/5 gap-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-medium">
                    This term is part of your core Durham Law vocabulary.
                  </p>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setShowNoteEditor(!showNoteEditor)}
                      className="flex-1 sm:flex-none rounded-xl border-gray-200 dark:border-white/10 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                    >
                      <Sparkles size={16} className="mr-2" />
                      {showNoteEditor ? "Cancel" : "Add Note"}
                    </Button>
                    <Button
                      onClick={onClose}
                      className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md border-0"
                    >
                      Got it, Back to Work
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Inline Note Editor */}
                <AnimatePresence>
                  {showNoteEditor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5"
                    >
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Your Personal Notes
                      </label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your notes, insights, or examples here..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B1412]/30 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={handleSaveNote}
                          disabled={isSaving}
                          className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
                        >
                          <Save size={16} className="mr-2" />
                          {isSaving ? "Saving..." : "Save Note"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```
