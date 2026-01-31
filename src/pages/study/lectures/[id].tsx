"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  FileAudio,
  Calendar,
  User,
  Book,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  GraduationCap,
  BookOpen,
  Loader2,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
// ... imports
import { QuizMeCard } from "@/components/quiz/QuizMeCard";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthContext";
import LectureChatWidget from "@/components/study/LectureChatWidget";
import dynamic from "next/dynamic";

import { LectureQuizHistory } from "@/components/quiz/LectureQuizHistory";
import { EmbeddedQuizSession } from "@/components/quiz/EmbeddedQuizSession";

const LectureUploadModal = dynamic(
  () => import("@/components/lectures/LectureUploadModal"),
  { ssr: false },
);
// ... existing imports

interface ExamSignal {
  signal_strength: number;
  topic_title: string;
  why_it_matters: string;
  what_to_master: string[];
  common_traps: string[];
  evidence_quotes?: string[];
  practice_prompts: { type: string; prompt: string }[];
}

interface LectureDetail {
  id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  panopto_url?: string;
  status: string;
  processing_state?:
    | "uploaded"
    | "queued"
    | "processing"
    | "processed"
    | "verified"
    | "failed";
  processing_error?: any;
  verification_results?: any;
  transcript?: string;
  word_count?: number;
  error_message?: string;
  notes?: {
    summary?: string;
    key_points?: string[];
    discussion_topics?: string[];
    exam_prompts?: string[];
    glossary?: Array<{ term: string; definition: string }>;
    engagement_hooks?: string[];
    exam_signals?: ExamSignal[];
  };
  progress?: number;
}

export default function LectureDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "summary" | "keypoints" | "hooks" | "discussion" | "exam" | "glossary"
  >("summary");

  // URL Editing State
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState("");

  // Full Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  // New State for Filters and UI
  const [signalFilter, setSignalFilter] = useState<
    "All" | "High" | "Medium" | "Low"
  >("All");
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [activeQuizSessionId, setActiveQuizSessionId] = useState<string | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id) return;

    // Check for Demo Mode (Client Side)
    const isDemo =
      typeof window !== "undefined" &&
      (window.location.search.includes("demo=true") ||
        window.location.pathname.startsWith("/demo"));

    if (isDemo) {
      const { DEMO_DATA } = require("@/lib/demo/demoData");
      const mockLecture = DEMO_DATA.lectures.find((l: any) => l.id === id);
      if (mockLecture) {
        console.log("[Demo] Injecting mock lecture data:", id);
        setLecture(mockLecture);
        setLoading(false);
        return;
      }
    }

    let pollInterval: NodeJS.Timeout;

    const fetchLecture = async (isPoll = false) => {
      try {
        const res = await fetch(`/api/lectures/get?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (isPoll) {
            console.log("[lecture] poll result", {
              status: data.lecture.status,
            });
          }
          setLecture(data.lecture);
          setEditedUrl(data.lecture.panopto_url || "");

          // Stop polling if terminal state reached
          if (
            data.lecture.processing_state === "verified" ||
            data.lecture.processing_state === "failed" ||
            data.lecture.status === "ready" ||
            data.lecture.status === "error"
          ) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Failed to fetch lecture:", error);
      } finally {
        if (!isPoll) setLoading(false);
      }
    };

    fetchLecture();

    // Set up polling if not ready
    pollInterval = setInterval(() => {
      fetchLecture(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [id]);

  const handleUpdateUrl = async () => {
    if (!lecture) return;
    const supabase = getSupabaseClient();
    const toastId = toast.loading("Updating source link...");

    try {
      const { error } = await supabase
        .from("lectures")
        .update({ panopto_url: editedUrl })
        .eq("id", lecture.id);

      if (error) throw error;

      setLecture({ ...lecture, panopto_url: editedUrl });
      setIsEditingUrl(false);
      toast.success("Source link updated", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update link", { id: toastId });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ... handleAddToRevision ...
  // Handle embedded quiz start
  const handleStartQuiz = async (mode: "text" | "voice") => {
    if (!lecture) return;
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please log in to start a quiz");
      return;
    }

    const toastId = toast.loading("Preparing session...");

    try {
      // Create new session linked to this lecture (academic_item_id)
      const { data: session, error } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: user.id,
          quiz_type: "lecture",
          target_id: lecture.id, // Legacy compatibility
          // academic_item_id: lecture.academic_item_id // TODO: Once FE uses academic_items, use this
          status: "active",
          performance_metadata: {
            mode: mode,
            quiz_style: "quick",
            target_title: lecture.title,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setActiveQuizSessionId(session.id);
      toast.success("Ready to practice!", { id: toastId });
    } catch (err) {
      console.error("Failed to start quiz:", err);
      toast.error("Could not start session", { id: toastId });
    }
  };

  const handleAddToRevision = async (signal: ExamSignal) => {
    // ... existing implementation
    const toastId = toast.loading("Adding to revision...");
    try {
      const res = await fetch("/api/study/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecture_id: lecture?.id,
          topic_title: signal.topic_title,
          notes: `Why it matters: ${signal.why_it_matters}`,
        }),
      });
      if (res.ok) {
        toast.success("Added to Revision list", { id: toastId });
      } else {
        toast.error("Failed to add", { id: toastId });
      }
    } catch (e) {
      toast.error("Error adding to revision", { id: toastId });
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="text-gray-500 animate-pulse">
          Loading lecture details...
        </p>
      </div>
    );
  }
  if (!lecture)
    return (
      <div className="max-w-4xl mx-auto py-8 text-center text-gray-500">
        Lecture not found
      </div>
    );

  const notes = lecture.notes;

  // Normalize signals to handle both legacy array and new object format
  const rawSignals: any = notes?.exam_signals || [];
  let displaySignals: ExamSignal[] = [];

  if (Array.isArray(rawSignals)) {
    // Legacy format
    displaySignals = rawSignals;
  } else if (typeof rawSignals === "object" && rawSignals.signals) {
    // New OpenAI Strict Schema format
    // Map overall strength (0-100) to 1-5 scale for badge compatibility
    const overallStrength = Math.ceil((rawSignals.signal_strength || 50) / 20); // 0-100 -> 1-5

    displaySignals = rawSignals.signals.map((s: any) => ({
      topic_title: s.topic,
      why_it_matters: s.why_it_matters,
      what_to_master: s.likely_exam_angles || [],
      common_traps: [], // Not present in new schema
      signal_strength: overallStrength,
      evidence_quotes: s.evidence_quotes || [],
      practice_prompts: s.practice_prompts || [],
    }));
  }

  const filteredSignals = displaySignals.filter((s) => {
    if (signalFilter === "All") return true;
    if (signalFilter === "High") return s.signal_strength >= 4;
    if (signalFilter === "Medium") return s.signal_strength === 3;
    if (signalFilter === "Low") return s.signal_strength <= 2;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        onClick={() => router.push("/study/lectures")}
        variant="ghost"
        className="mb-4 text-sm flex items-center gap-1 text-gray-600 hover:text-purple-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Lectures
      </Button>

      {/* Processing State Banner */}
      {lecture.processing_state === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-800 font-bold text-sm">
              Processing Failed
            </h3>
            <p className="text-red-700 text-sm mt-1">
              {lecture.error_message ||
                "An unknown error occurred during AI analysis."}
            </p>
            {lecture.processing_error && (
              <details className="mt-2 text-xs text-red-600/70">
                <summary className="cursor-pointer hover:underline">
                  Technical Details
                </summary>
                <pre className="mt-1 bg-red-100/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(lecture.processing_error, null, 2)}
                </pre>
              </details>
            )}
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100"
                onClick={async () => {
                  const toastId = toast.loading("Restarting processing...");
                  try {
                    const res = await fetch("/api/lectures/process", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        lectureId: lecture.id,
                        force: true,
                      }),
                    });
                    if (res.ok) {
                      toast.success("Processing restarted", { id: toastId });
                      router.reload();
                    } else {
                      throw new Error("Failed to restart");
                    }
                  } catch (e) {
                    toast.error("Retry failed", { id: toastId });
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {lecture.processing_state &&
        !["verified", "failed"].includes(lecture.processing_state) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-800 font-bold text-sm uppercase tracking-wide">
                  {lecture.processing_state === "queued"
                    ? "In Queue"
                    : "Processing..."}
                </p>
                <p className="text-blue-700 text-xs">
                  Generating AI summaries and exam signals.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-100/50 px-2 py-1 rounded">
              EST. 2-3 MIN
            </span>
          </div>
        )}

      {lecture.processing_state === "verified" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-xs font-bold uppercase tracking-widest">
              Platform Verified
            </span>
          </div>
          {lecture.verification_results && (
            <div className="flex gap-3">
              {Object.entries(lecture.verification_results).map(
                ([key, val]) => {
                  if (typeof val === "boolean") {
                    return (
                      <span
                        key={key}
                        className="text-[10px] text-green-600/70 font-medium"
                      >
                        {val ? "✓" : "✗"} {key.toUpperCase()}
                      </span>
                    );
                  }
                  return null;
                },
              )}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileAudio className="w-7 h-7 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {lecture.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                  {lecture.module_code && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Book className="w-4 h-4" />
                      {lecture.module_code}
                    </span>
                  )}
                  {lecture.lecturer_name && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      {lecture.lecturer_name}
                    </span>
                  )}
                  {lecture.lecture_date && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(lecture.lecture_date)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                Edit Details
              </Button>
            </div>

            {/* SOURCE LINK ROW */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Source Link:
              </span>

              {isEditingUrl ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editedUrl}
                    onChange={(e) => setEditedUrl(e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="https://durham.cloud.panopto.eu/..."
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateUrl}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingUrl(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {lecture.panopto_url ? (
                    <a
                      href={lecture.panopto_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline category-link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {lecture.panopto_url.includes("panopto")
                        ? "Watch on Panopto"
                        : "Open Source Link"}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">
                      No source link provided
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setIsEditingUrl(true);
                      setEditedUrl(lecture.panopto_url || "");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                    title="Edit URL"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      {notes ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 shadow-sm overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { key: "summary", label: "Summary", icon: BookOpen },
              { key: "keypoints", label: "Key Points", icon: Lightbulb },
              { key: "hooks", label: "✨ Why It Matters", icon: Sparkles },
              { key: "discussion", label: "Discussion", icon: MessageSquare },
              { key: "exam", label: "Exam Prep", icon: GraduationCap },
              { key: "glossary", label: "Glossary", icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-purple-600 text-purple-600 bg-purple-50/50 dark:bg-purple-900/20" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* EXISTING TABS OMITTED FOR BREVITY, WILL KEEP IN FINAL FILE */}
            {activeTab === "summary" && notes?.summary && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {notes.summary}
              </p>
            )}
            {activeTab === "keypoints" &&
              notes?.key_points?.map((p, i) => (
                <div key={i} className="mb-4 flex gap-3 group">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {p}
                  </p>
                </div>
              ))}

            {/* EXAM PREP TAB */}
            {activeTab === "exam" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Quiz Me Embedded Experience */}
                {activeQuizSessionId && user ? (
                  <EmbeddedQuizSession
                    sessionId={activeQuizSessionId}
                    userId={user.id}
                    onClose={() => setActiveQuizSessionId(null)}
                    title={lecture!.title}
                  />
                ) : (
                  <>
                    <QuizMeCard
                      lectureId={lecture!.id}
                      moduleCode={lecture!.module_code}
                      targetTitle={lecture!.title}
                      className="mb-8"
                      onStart={handleStartQuiz}
                    />

                    <LectureQuizHistory
                      lectureId={lecture!.id}
                      currentSessionId={activeQuizSessionId}
                      onResume={setActiveQuizSessionId}
                    />
                  </>
                )}

                {/* Tab Header & Subtitle */}
                <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h3 className="text-purple-900 dark:text-purple-100 font-bold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" /> Exam Prep
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                    Practise understanding, application, and structure — aligned
                    to what you learned in this lecture.
                  </p>
                </div>

                {/* 1. ACADEMIC INTEGRITY DISCLAIMER */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                  <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold mb-1">
                      Built for academic integrity
                    </p>
                    <p className="opacity-90">
                      We highlight lecturer emphasis to guide revision. We don’t
                      predict exam papers or generate work to submit as your
                      own.{" "}
                      <a
                        href="#"
                        className="underline hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        Read our Integrity Guidelines
                      </a>
                    </p>
                  </div>
                </div>

                {/* 2. SIGNALS SECTION */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        Lecturer Emphasis & Exam Signals
                        <span
                          className="text-gray-400 cursor-help"
                          title="We detect emphasis cues in the lecture (e.g., repeated points, 'key distinction', 'common mistake', assessment-related phrasing). This helps you focus revision on what was stressed — not 'guess' the exam."
                        >
                          <HelpCircle className="w-4 h-4" />
                        </span>
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Highlights concepts your lecturer strongly emphasized —
                        with evidence from the transcript and practice prompts.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {["All", "High", "Medium", "Low"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setSignalFilter(f as any)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${signalFilter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                          {f === "High"
                            ? "High emphasis"
                            : f === "Medium"
                              ? "Medium"
                              : f === "Low"
                                ? "Low"
                                : "All"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredSignals.length > 0 ? (
                    <div className="space-y-4">
                      {filteredSignals.map((signal, idx) => {
                        // Badge Logic
                        let badgeColor =
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                        let badgeText = "Possible relevance (Strength 1)";
                        if (signal.signal_strength >= 5) {
                          badgeColor =
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                          badgeText = "High emphasis (Strength 5)";
                        } else if (signal.signal_strength === 4) {
                          badgeColor =
                            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
                          badgeText = "Strong emphasis (Strength 4)";
                        } else if (signal.signal_strength === 3) {
                          badgeColor =
                            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
                          badgeText = "Noted emphasis (Strength 3)";
                        } else if (signal.signal_strength === 2) {
                          badgeColor =
                            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                          badgeText = "Light emphasis (Strength 2)";
                        }

                        return (
                          <div
                            key={idx}
                            className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all shadow-sm bg-white dark:bg-gray-900 group"
                          >
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span
                                    className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${badgeColor}`}
                                  >
                                    {badgeText}
                                  </span>
                                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                    {signal.topic_title}
                                  </h4>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 inline-block max-w-full">
                                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                    Evidence from transcript
                                  </span>
                                  <span className="italic">
                                    &quot;
                                    {signal.evidence_quotes?.[0] ||
                                      "Evidence missing"}
                                    &quot;
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setExpandedSignal(
                                    expandedSignal === signal.topic_title
                                      ? null
                                      : signal.topic_title,
                                  )
                                }
                                className="text-gray-400 hover:text-purple-600"
                              >
                                {expandedSignal === signal.topic_title
                                  ? "Hide details"
                                  : "Show details"}
                                {expandedSignal === signal.topic_title ? (
                                  <ChevronUp className="w-4 h-4 ml-1" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                )}
                              </Button>
                            </div>

                            {expandedSignal === signal.topic_title && (
                              <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-5 animate-fadeIn">
                                {/* Why it matters */}
                                <div>
                                  <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                                    Why it matters
                                  </h5>
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {signal.why_it_matters}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* What to Master */}
                                  <div>
                                    <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />{" "}
                                      What to master
                                    </h5>
                                    <ul className="space-y-2">
                                      {signal.what_to_master.map((m, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                        >
                                          <div className="w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full mt-1.5 shrink-0" />
                                          <span>{m}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Common Traps */}
                                  {signal.common_traps &&
                                    signal.common_traps.length > 0 && (
                                      <div>
                                        <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-red-500" />{" "}
                                          Common traps
                                        </h5>
                                        <ul className="space-y-2">
                                          {signal.common_traps.map((m, i) => (
                                            <li
                                              key={i}
                                              className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                            >
                                              <div className="w-1.5 h-1.5 bg-red-300 rounded-full mt-1.5 shrink-0" />
                                              <span>{m}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                </div>

                                {/* Practice Prompts */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                  <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                                    Practice prompts
                                  </h5>
                                  <div className="space-y-3">
                                    {signal.practice_prompts.map((p, i) => (
                                      <div
                                        key={i}
                                        className="flex gap-3 items-baseline bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                      >
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 shrink-0 min-w-[5rem]">
                                          {p.type}
                                        </span>
                                        <span className="text-gray-800 dark:text-gray-200">
                                          {p.prompt}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-3">
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                                    >
                                      Practise
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAddToRevision(signal)
                                      }
                                      className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                                    >
                                      <PlusCircle className="w-4 h-4 mr-2" />{" "}
                                      Add to Revision
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />{" "}
                                      Ask Durmah
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Empty State
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No strong emphasis signals detected
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        This lecture may have been evenly distributed across
                        topics. Use Key Points and Practice Prompts to revise
                        effectively.
                      </p>
                      <Button variant="outline">
                        Generate practice prompts
                      </Button>
                    </div>
                  )}
                </div>

                {/* Footer Safety Line */}
                <div className="border-t pt-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Revision is about mastery. These insights help you focus on
                    what was taught — not “guess” the exam.
                  </p>
                </div>

                {/* ORIGINAL EXAM PROMPTS (If available and no signals, maybe show them? Or just hide for now to declutter) */}
              </div>
            )}
            {/* OTHER TABS */}
            {activeTab === "glossary" &&
              notes.glossary?.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row mb-4 border-b border-gray-100 dark:border-gray-800 pb-2"
                >
                  <dt className="font-bold w-full md:w-1/3 text-purple-700 dark:text-purple-400">
                    {item.term}
                  </dt>
                  <dd className="w-full md:w-2/3 text-gray-700 dark:text-gray-300">
                    {item.definition}
                  </dd>
                </div>
              ))}
            {activeTab === "hooks" &&
              notes.engagement_hooks?.map((h, i) => (
                <div
                  key={i}
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 mb-3 border-l-4 border-purple-400 dark:border-purple-600 rounded-r-lg text-gray-700 dark:text-gray-300"
                >
                  {h}
                </div>
              ))}
            {activeTab === "discussion" &&
              notes.discussion_topics?.map((h, i) => (
                <li
                  key={i}
                  className="mb-3 text-gray-700 dark:text-gray-300 list-disc ml-5 leading-relaxed"
                >
                  {h}
                </li>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center mb-6 shadow-sm">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
            {lecture.status === "error" || lecture.status === "failed" ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : (
              <Sparkles className="w-8 h-8 animate-pulse" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {lecture.status === "error"
              ? "Analysis Failed"
              : lecture.status === "ready" && !notes
                ? "Analysis Missing"
                : lecture.status === "uploaded" ||
                    lecture.status === "queued" ||
                    lecture.status === "processing"
                  ? "Lecture Processing (OpenAI)..."
                  : lecture.status === "transcribing"
                    ? "Transcribing Audio..."
                    : lecture.status === "summarizing"
                      ? "Generating AI Breakdown..."
                      : "AI Breakdown in Progress"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            {lecture.status === "error"
              ? lecture.error_message ||
                "Something went wrong during AI analysis."
              : lecture.status === "ready" && !notes
                ? "The AI analysis didn't save correctly. Please try reprocessing."
                : "We're generating your summary, key points, and exam prep. This usually takes 30-60 seconds for large lectures."}
          </p>

          <div className="flex justify-center gap-3">
            {lecture.status === "error" ||
            (lecture.status === "ready" && !notes) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="gap-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                Edit & Reprocess
              </Button>
            ) : (
              <div className="w-full max-w-xs flex flex-col items-center gap-3">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-500 ease-out"
                    style={{ width: `${lecture.progress || 10}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-mono uppercase tracking-wider text-xs">
                    {lecture.progress ? `${lecture.progress}% ` : ""}
                    {lecture.status === "transcribing"
                      ? "Transcribing Audio..."
                      : lecture.status === "processing"
                        ? "Generating AI Analysis..."
                        : lecture.status === "summarizing"
                          ? "Summarizing..."
                          : `Processing (${lecture.status})...`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Logic */}
      {lecture.transcript && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mt-6 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex justify-between p-4 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Full Transcript</span>
            {showTranscript ? <ChevronUp /> : <ChevronDown />}
          </button>
          {showTranscript && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 h-96 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50">
              {lecture.transcript}
            </div>
          )}
        </div>
      )}

      {/* EMBEDDED CHAT WIDGET */}
      <LectureChatWidget lectureId={lecture.id} title={lecture.title} />

      {/* Edit Modal */}
      {showEditModal && (
        <LectureUploadModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            // Refresh lecture data
            const fetchLecture = async () => {
              try {
                const res = await fetch(`/api/lectures/get?id=${id}`);
                if (res.ok) {
                  const data = await res.json();
                  setLecture(data.lecture);
                  setEditedUrl(data.lecture.panopto_url || "");
                }
              } catch (e) {
                console.error(e);
              }
            };
            fetchLecture();
            toast.success("Lecture updated!");
          }}
          initialData={{
            id: lecture!.id,
            title: lecture!.title,
            transcript: lecture!.transcript,
            panopto_url: lecture!.panopto_url,
            module_code: lecture!.module_code,
            module_name: lecture!.module_name,
            lecturer_name: lecture!.lecturer_name,
            lecture_date: lecture!.lecture_date,
            // We don't have user_module_id on the frontend 'lecture' object typically unless mapped
            // But 'module_code' is enough for display usually.
            // However, LectureUploadModal prefers user_module_id for dropdown.
            // If we don't pass it, it might default to Manual mode or just show code.
            // This is acceptable.
          }}
        />
      )}
    </div>
  );
}
