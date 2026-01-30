"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Search,
  Book,
  ArrowLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  History,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthContext";
import toast from "react-hot-toast";
import { Loader2, Plus, Check } from "lucide-react";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  source_reference?: string;
  is_manual?: boolean;
  created_by_name?: string;
  lectures: { id: string; title: string }[];
}

export default function GlossaryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Manual Entry State
  const [isDefining, setIsDefining] = useState(false);
  const [aiDefinition, setAiDefinition] = useState<{
    term: string;
    definition: string;
  } | null>(null);
  const [manualReference, setManualReference] = useState("");

  const handleDefine = async () => {
    if (!searchQuery) return;
    setIsDefining(true);
    setAiDefinition(null);
    try {
      const res = await fetch("/api/study/glossary/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiDefinition(data);
        toast.success("AI Definition Generated!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to define term");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsDefining(false);
    }
  };

  const handleSaveManual = async () => {
    if (!aiDefinition) return;
    const toastId = toast.loading("Saving to your Lexicon...");
    try {
      const res = await fetch("/api/study/glossary/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: aiDefinition.term,
          definition: aiDefinition.definition,
          source_reference: manualReference || "Manual Reading/Research",
          created_by_name:
            user?.user_metadata?.display_name || user?.email || "Student",
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setTerms((prev) => [
          ...prev,
          {
            ...saved,
            lectures: [],
          },
        ]);
        setAiDefinition(null);
        setManualReference("");
        setSearchQuery("");
        toast.success("Successfully added to Lexicon!", { id: toastId });
      } else {
        toast.error("Failed to save term", { id: toastId });
      }
    } catch (err) {
      toast.error("Error saving term", { id: toastId });
    }
  };

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch("/api/study/glossary/list");
        if (res.ok) {
          const data = await res.json();
          setTerms(data);
        }
      } catch (err) {
        console.error("Failed to fetch glossary terms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filteredTerms = useMemo(() => {
    return terms.filter((t) => {
      const matchesSearch =
        t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter =
        !selectedLetter || t.term.toUpperCase().startsWith(selectedLetter);
      return matchesSearch && matchesLetter;
    });
  }, [terms, searchQuery, selectedLetter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <History className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading your Lexicon...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header Section */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <Button
          onClick={() => router.push("/study/lectures")}
          variant="ghost"
          className="mb-4 -ml-2 text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lectures
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <Book className="w-10 h-10 text-purple-600" />
              Caseway Lexicon
            </h1>
            <p className="text-lg text-gray-500 mt-2 max-w-2xl">
              Your master legal dictionary, automatically built from every
              lecture you attend. Track where concepts appear and master the
              language of law.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms or definitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Alphabet Filter */}
      <div className="flex flex-wrap gap-1 mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${!selectedLetter ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "text-gray-500 hover:bg-gray-50 hover:text-purple-600"}`}
        >
          ALL
        </button>
        {alphabet.map((letter) => {
          const hasTerms = terms.some((t) =>
            t.term.toUpperCase().startsWith(letter),
          );
          return (
            <button
              key={letter}
              disabled={!hasTerms}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedLetter === letter
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                  : hasTerms
                    ? "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
                    : "text-gray-200 cursor-not-allowed"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Terms Grid/List */}
      {filteredTerms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredTerms.map((t) => (
            <div
              key={t.id}
              className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                expandedTerm === t.id
                  ? "ring-2 ring-purple-500 border-transparent shadow-xl"
                  : "border-gray-200 hover:border-purple-200 hover:shadow-lg"
              }`}
            >
              <div
                className="p-6 cursor-pointer flex items-start justify-between"
                onClick={() =>
                  setExpandedTerm(expandedTerm === t.id ? null : t.id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {t.term}
                    </h3>
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {t.lectures.length}{" "}
                      {t.lectures.length === 1 ? "Source" : "Sources"}
                    </span>
                    {t.is_manual && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple-200">
                        Entered by {t.created_by_name || "Student"}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {t.definition}
                  </p>
                </div>
                <div className="ml-4 pt-1">
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedTerm === t.id ? "rotate-90 text-purple-600" : "group-hover:text-purple-400 group-hover:translate-x-1"}`}
                  />
                </div>
              </div>

              {expandedTerm === t.id && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-6 animate-in slide-in-from-top-2 duration-300">
                  {t.source_reference && (
                    <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-500/30">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                        <Book className="w-3.5 h-3.5" />
                        Manual Source / Reference
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                        {t.source_reference}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Info className="w-3.5 h-3.5" />
                    Lecture Appearances
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {t.lectures.map((lecture) => (
                      <Link
                        key={lecture.id}
                        href={`/study/lectures/${lecture.id}`}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-purple-500 hover:text-purple-700 hover:shadow-md transition-all group/link"
                      >
                        <FileText className="w-4 h-4 text-purple-400 group-hover/link:text-purple-600" />
                        {lecture.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity ml-1" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {aiDefinition && (
            <div className="bg-purple-50 border ring-2 ring-purple-200 border-purple-300 rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-500 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Check className="w-6 h-6 text-green-500" />
                  Define: {aiDefinition.term}
                </h3>
                <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-purple-200">
                  AI Generated
                </span>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-100 shadow-inner mb-6">
                <p className="text-lg text-gray-800 leading-relaxed italic">
                  &ldquo;{aiDefinition.definition}&rdquo;
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-purple-600 uppercase tracking-wider ml-1">
                    Context / Source (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    placeholder="e.g. My private research, textbook page 42..."
                    className="w-full bg-white border border-purple-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3 mt-2">
                  <Button
                    onClick={handleSaveManual}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                  >
                    Confirm & Save to Lexicon
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setAiDefinition(null)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    Discard definition
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {searchQuery ? `"${searchQuery}" not found` : "No terms found"}
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              {searchQuery
                ? "This concept isn't in your Lexicon yet. Would you like Durmah to define it for you?"
                : "Try adjusting your search or filters. Terms are automatically added when you upload new lectures."}
            </p>

            {searchQuery && !aiDefinition && (
              <Button
                disabled={isDefining}
                className="mt-8 bg-purple-600 border-none px-8 py-6 rounded-2xl shadow-xl shadow-purple-100 transition-all hover:-translate-y-1 active:scale-95 text-lg font-black"
                onClick={handleDefine}
              >
                {isDefining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Durmah Thinking...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add "{searchQuery}" to Lexicon
                  </>
                )}
              </Button>
            )}

            {!searchQuery && (
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLetter(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
            <Info className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Build your legal mastery</h3>
            <p className="text-gray-300 leading-relaxed max-w-xl">
              Consistent vocabulary is the secret of top-performing law
              students. Use the Lexicon to see how global concepts link back to
              your specific Durham curriculum.
              <strong> Pro tip:</strong> Use 'Ask Durmah' on a specific lecture
              page to query terms in their local context.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
