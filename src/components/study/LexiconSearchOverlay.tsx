"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  Book,
  Zap,
  Plus,
  Loader2,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

interface LexiconSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LexiconSearchOverlay({
  isOpen,
  onClose,
}: LexiconSearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDefining, setIsDefining] = useState(false);
  const [aiDefinition, setAiDefinition] = useState<{
    term: string;
    definition: string;
  } | null>(null);
  const [sourceRef, setSourceRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchQuery("");
      setAiDefinition(null);
      setSourceRef("");
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  // Handle search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/study/glossary/list");
        if (res.ok) {
          const allTerms: any[] = await res.json();
          const filtered = allTerms
            .filter(
              (t) =>
                t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.definition.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .slice(0, 5);
          setResults(filtered);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDefineWithAI = async () => {
    if (!searchQuery.trim()) return;
    setIsDefining(true);
    setError(null);
    setAiDefinition(null);

    try {
      const res = await fetch("/api/study/glossary/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: searchQuery }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiDefinition(data);
      } else {
        setError(data.error || "Failed to define term.");
      }
    } catch (err) {
      setError("AI service unavailable. Please try again later.");
    } finally {
      setIsDefining(false);
    }
  };

  const handleSaveToLexicon = async () => {
    if (!aiDefinition) return;
    setLoading(true);
    try {
      const res = await fetch("/api/study/glossary/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aiDefinition,
          source_reference: sourceRef,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("Failed to save to Lexicon.");
      }
    } catch (err) {
      setError("Database connection error.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 md:px-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input Area */}
        <div className="relative p-6 border-b border-gray-100 dark:border-white/5">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Lexicon or enter a new legal term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length === 0 && !isDefining) {
                handleDefineWithAI();
              }
            }}
            className="w-full pl-14 pr-12 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-lg font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            onClick={onClose}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
              <p className="text-sm">Scanning Lexicon...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Existing Matches
              </p>
              {results.map((t) => (
                <Link
                  key={t.id}
                  href="/study/glossary"
                  onClick={onClose}
                  className="group flex flex-col p-4 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all border border-transparent hover:border-purple-100 dark:hover:border-purple-500/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      {t.term}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {t.definition}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* AI Definition Flow */}
          {searchQuery.trim().length > 1 &&
            results.length === 0 &&
            !isDefining &&
            !aiDefinition &&
            !error && (
              <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Not in your Lexicon yet?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto mb-6">
                  Durmah can define "{searchQuery}" and save it to your master
                  list permanently.
                </p>
                <Button
                  onClick={handleDefineWithAI}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 px-8 rounded-xl"
                >
                  Define with Durmah ⚡
                </Button>
              </div>
            )}

          {isDefining && (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Book className="w-12 h-12 text-purple-200" />
                  <Loader2 className="absolute top-0 right-0 w-12 h-12 text-purple-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white animate-pulse">
                Consulting legal context...
              </h3>
            </div>
          )}

          {aiDefinition && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 rounded-3xl border border-purple-100 dark:border-purple-500/30 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3">
                <CheckCircle size={14} />
                Durmah Definition
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {aiDefinition.term}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic mb-4">
                "{aiDefinition.definition}"
              </p>

              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Add Context / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Donoghue v Stevenson, Textbook Ch 4..."
                  value={sourceRef}
                  onChange={(e) => setSourceRef(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {!saveSuccess ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveToLexicon}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-base font-bold"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      <Plus size={18} className="mr-2" />
                    )}
                    Save to My Lexicon
                  </Button>
                  <Button
                    onClick={() => setAiDefinition(null)}
                    variant="ghost"
                    className="rounded-xl px-6"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-2xl font-bold">
                  <CheckCircle size={20} />
                  Saved to Lexicon!
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-500/30 text-center animate-shake">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                {error}
              </p>
              <Button
                onClick={() => setError(null)}
                variant="ghost"
                className="mt-4 text-xs font-bold uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <span className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded shadow-sm">
                Enter
              </span>
              <span>to Select</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <span className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded shadow-sm">
                Esc
              </span>
              <span>to Close</span>
            </div>
          </div>
          <Link
            href="/study/glossary"
            onClick={onClose}
            className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] hover:underline"
          >
            Open Full Lexicon &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
