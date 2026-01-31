"use client";

import { useState, useEffect, useCallback } from "react";
import { LECTURE_STATUSES } from "@/lib/lectures/status";
import { useRouter } from "next/router";
import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/lib/supabase/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  FileAudio,
  ExternalLink,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useStudentOnly } from "@/hooks/useStudentOnly";
import { useUndoToast } from "@/hooks/useUndoToast";
import { getSupabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import LecturerList from "@/components/lecturers/LecturerList";

const LectureUploadModal = dynamic(
  () => import("@/components/lectures/LectureUploadModal"),
  { ssr: false },
);
const LectureCard = dynamic(() => import("@/components/lectures/LectureCard"), {
  ssr: false,
});

import { useFamiliarity } from "@/hooks/useFamiliarity";
import ClarityCard, { ClarityNudge } from "@/components/ui/ClarityCard";

interface Lecture {
  id: string;
  title: string;
  module_id?: string;
  module_code?: string;
  module_name?: string;
  lecturer_name?: string;
  lecture_date?: string;
  status:
    | "uploaded"
    | "queued"
    | "processing"
    | "transcribing"
    | "summarizing"
    | "ready"
    | "failed"
    | "error";
  created_at: string;
  last_processed_at?: string;
}

interface Module {
  id: string;
  title: string;
  code: string;
  year_level: number;
}

interface LectureSet {
  uploaded_count: number;
  expected_count: number;
  is_complete: boolean;
}

export default function LecturesPage() {
  const router = useRouter();
  const { getDashboardRoute } = useContext(AuthContext);
  const {
    familiarity,
    loading: familiarityLoading,
    markAsFamiliar,
  } = useFamiliarity();
  const [showFamiliarityGuidance, setShowFamiliarityGuidance] = useState(false);

  // Protect from loved ones
  const { isChecking: isRoleChecking, isLovedOne } = useStudentOnly();

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lectureSet, setLectureSet] = useState<LectureSet | null>(null);

  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [initialUploadMode, setInitialUploadMode] = useState<
    "panopto" | "audio"
  >("panopto");
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Modules
  useEffect(() => {
    fetch("/api/modules")
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        if (data.length > 0) setSelectedModuleId(data[0].id);
      })
      .catch((err) => console.error("Failed to load modules", err));
  }, []);

  // Fetch Lecture Set Status when module changes
  useEffect(() => {
    if (!selectedModuleId) return;

    // We can assume the list endpoint might optionally return this,
    // or we fetch separate. For now, let's just calc from list or assume API enhancement later
    // Actually, let's fetch the set targets
    // Simplified: We will just filter the list client side and show progress based on local state if needed
    // But real implementation needs the target from DB
  }, [selectedModuleId]);

  const fetchLectures = useCallback(async () => {
    try {
      const res = await fetch("/api/lectures/list");
      if (res.ok) {
        const data = await res.json();
        setLectures(data.lectures || []);
      }
    } catch (error) {
      console.error("Failed to fetch lectures:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  // Auto-refresh if any lectures are processing
  useEffect(() => {
    const hasProcessing = lectures.some((l) => {
      if (
        ![
          LECTURE_STATUSES.TRANSCRIBING,
          LECTURE_STATUSES.SUMMARIZING,
          LECTURE_STATUSES.UPLOADED,
          LECTURE_STATUSES.PROCESSING,
          LECTURE_STATUSES.QUEUED,
        ].includes(l.status as any)
      ) {
        return false;
      }

      // Stop condition: if it's been processing for more than 10 minutes,
      // stop refreshing for this item to avoid infinite loops on Netlify timeouts.
      const startTime =
        l.last_processed_at || l.created_at || new Date().toISOString();
      const processingTimeMs = Date.now() - new Date(startTime).getTime();
      const tenMinutes = 10 * 60 * 1000;

      if (processingTimeMs > tenMinutes) {
        console.warn(
          `[lectures] Process for ${l.id} timed out (>10m), stopping poll.`,
        );
        return false;
      }
      return true;
    });

    if (hasProcessing) {
      const interval = setInterval(fetchLectures, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [lectures, fetchLectures]);

  const [view, setView] = useState<"uploads" | "lecturers">("uploads");

  const [selectedLecturer, setSelectedLecturer] = useState<string>("");

  const handleUploadSuccess = () => {
    fetchLectures();
    toast.success("Lecture saved."); // L-SUCCESS-1
  };

  const { showUndoToast } = useUndoToast();

  const handleDelete = async (id: string) => {
    const lectureToDelete = lectures.find((l) => l.id === id);
    if (!lectureToDelete) return;

    if (!confirm(`Are you sure you want to delete "${lectureToDelete.title}"?`))
      return;

    const supabase = getSupabaseClient();
    try {
      const { error } = await supabase.from("lectures").delete().eq("id", id);
      if (error) throw error;

      toast.success("Lecture removed");
      fetchLectures();

      showUndoToast(async () => {
        const { error: restoreError } = await supabase
          .from("lectures")
          .insert(lectureToDelete);

        if (restoreError) {
          toast.error("Failed to restore lecture");
        } else {
          toast.success("Lecture restored");
          fetchLectures();
        }
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete lecture");
    }
  };

  // Derived unique lecturers from ALL lectures (not just filtered)
  const availableLecturers = Array.from(
    new Set(lectures.map((l) => l.lecturer_name).filter(Boolean)),
  ).sort();

  // FILTERED LISTS
  const filteredBase = lectures.filter((l) => {
    // 1. Module Filter
    // 1. Module Filter
    if (selectedModuleId) {
      // Find the module object we are filtering by
      // Note: 'modules' state only has API modules. We need to check the comprehensive list or just match broadly.
      // Easiest is to match: Does l.module_id == selected || l.module_code == selected (if selected is code)
      // Actually, we stored 'id' in dropdown. For derived modules, 'id' might be the code.

      const isIdMatch = l.module_id === selectedModuleId;
      // If selectedModuleId is a code (e.g. from derived), check code match
      const isCodeMatch = l.module_code === selectedModuleId;

      // Also check if selectedModuleId maps to a code in our API list
      const apiMod = modules.find((m) => m.id === selectedModuleId);
      const isApiCodeMatch = apiMod && l.module_code === apiMod.code;

      if (!isIdMatch && !isCodeMatch && !isApiCodeMatch) return false;
    }
    // 2. Lecturer Filter
    if (selectedLecturer && l.lecturer_name !== selectedLecturer) {
      return false;
    }
    return true;
  });

  const readyLectures = filteredBase.filter((l) => l.status === "ready");
  const processingLectures = filteredBase.filter(
    (l) =>
      l.status === "transcribing" ||
      l.status === "summarizing" ||
      l.status === "uploaded",
  );
  const errorLectures = filteredBase.filter((l) => l.status === "error");

  // Nudge state
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    // Only verify client-side to avoid hydration mismatch
    const dismissed = localStorage.getItem("caseway_lectures_nudge_dismissed");
    const hasSuccessful = lectures.some((l) =>
      ["ready", "processed"].includes(l.status),
    );

    if (!dismissed && !hasSuccessful && !loading) {
      setShowNudge(true);
    } else {
      setShowNudge(false);
    }
  }, [lectures, loading]);

  const dismissNudge = () => {
    setShowNudge(false);
    localStorage.setItem("caseway_lectures_nudge_dismissed", "1");
  };

  // Helper to group modules by year
  // Merge API modules with derived modules from lectures
  const allModuleOptionMap = new Map<string, Module>();

  // 1. Add API modules
  modules.forEach((m) => allModuleOptionMap.set(m.code, m));

  // 2. Add derived modules from lectures (if not already present)
  lectures.forEach((l) => {
    if (l.module_code && !allModuleOptionMap.has(l.module_code)) {
      allModuleOptionMap.set(l.module_code, {
        id: l.module_id || l.module_code,
        code: l.module_code,
        title: l.module_name || l.module_code,
        year_level: 0, // "Other" or "Detected"
      });
    }
  });

  const uniqueModules = Array.from(allModuleOptionMap.values());

  const groupedModules = uniqueModules.reduce(
    (acc, mod) => {
      const year = mod.year_level || 0;
      if (!acc[year]) acc[year] = [];
      acc[year].push(mod);
      return acc;
    },
    {} as Record<number, Module[]>,
  );

  // Show loading while checking role or if loved one (redirecting)
  if (!mounted || isRoleChecking || isLovedOne) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">
          Securing your session...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Nudge Banner */}
      {showNudge && (
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 fade-in duration-500">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              ⚡ Quick win
            </h3>
            <p className="text-sm text-purple-100 mt-1 max-w-xl">
              Paste a transcript once — Caseway can then generate summaries, key
              points, and exam prep instantly.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={dismissNudge}
              className="text-xs font-semibold text-purple-200 hover:text-white px-3 py-2 transition"
            >
              Got it
            </button>
            <button
              onClick={() => {
                setShowUploadModal(true);
                setInitialUploadMode("panopto");
              }}
              className="text-xs font-bold bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition shadow-sm whitespace-nowrap flex-1 sm:flex-none text-center"
            >
              Add Lecture
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push(getDashboardRoute?.() || "/dashboard")}
              variant="ghost"
              className="mb-2 text-sm flex items-center gap-1 text-gray-600 hover:text-purple-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                🎓 My Lectures
              </h1>
              {!familiarity.lectures && !loading && (
                <ClarityNudge
                  label="How this works"
                  onClick={() => setShowFamiliarityGuidance(true)}
                />
              )}
              {familiarity.lectures && (
                <ClarityNudge
                  label="How this works"
                  onClick={() => setShowFamiliarityGuidance(true)}
                />
              )}
            </div>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lecture
          </Button>
        </div>

        {/* Filter Bar (Module & Lecturer) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Module Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Filter by Module
                </label>
                <select
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 min-w-[200px] outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                >
                  <option value="">All Modules</option>
                  {Object.keys(groupedModules).map((year) => (
                    <optgroup
                      key={year}
                      label={
                        year === "0" ? "Detected from Uploads" : `Year ${year}`
                      }
                    >
                      {(groupedModules[parseInt(year)] || []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="hidden md:block h-10 w-px bg-gray-200 mx-2"></div>

              {/* Lecturer Filter */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Filter by Lecturer
                </label>
                <select
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 min-w-[180px] outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedLecturer}
                  onChange={(e) => setSelectedLecturer(e.target.value)}
                  disabled={availableLecturers.length === 0}
                >
                  <option value="">All Lecturers</option>
                  {availableLecturers.map((name) => (
                    <option key={name as string} value={name as string}>
                      {name as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target & Progress (Only show if filtering by module, optional) */}
            {selectedModuleId && (
              <div className="flex items-center gap-4 border-l pl-4 border-gray-100">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Target
                  </label>
                  <input
                    type="number"
                    className="w-16 p-1.5 border rounded-md text-sm text-center bg-gray-50"
                    placeholder="0"
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (selectedModuleId && !isNaN(val)) {
                        fetch("/api/module-lecture-set", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            module_id: selectedModuleId,
                            expected_count: val,
                          }),
                        }).then(() => fetchLectures());
                      }
                    }}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Progress
                  </label>
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    {readyLectures.length} / ?
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showFamiliarityGuidance || (!familiarity.lectures && !loading)) && (
        <ClarityCard
          title="Mastering Your Lectures"
          description="Upload your lecture recordings and let Durmah handle the heavy lifting. We transform audio into structured, exam-ready knowledge."
          steps={[
            "Upload your MP3/WAV/M4A lecture recording.",
            "Durmah transcribes and extracts key legal principles.",
            "Review your structured summary & case highlights.",
            "Click 'Quiz Me' to test your memory of this specific lecture.",
          ]}
          onDismiss={() => {
            markAsFamiliar("lectures");
            setShowFamiliarityGuidance(false);
          }}
          watchDemoHref="/demo/my-lectures"
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setView("uploads")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${view === "uploads" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Uploads & Notes
        </button>
        <button
          onClick={() => setView("lecturers")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${view === "lecturers" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Lecturers{" "}
          <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">
            New
          </span>
        </button>
        <Link
          href="/study/glossary"
          className="pb-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-purple-700 transition flex items-center gap-1"
        >
          Lexicon
          <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-bold">
            NEW
          </span>
        </Link>
      </div>

      {view === "lecturers" ? (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 h-fit">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Teaching Style Insights
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Durmah analyzes your lecture transcripts to identify each
                lecturer's style, pace, and emphasis areas. This helps you adapt
                your note-taking and revision strategy.
              </p>
            </div>
          </div>
          <LecturerList />
        </div>
      ) : (
        <>
          {/* Processing Section */}
          {processingLectures.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                <h2 className="text-sm font-medium text-gray-700">
                  Processing ({processingLectures.length})
                </h2>
              </div>
              <div className="space-y-3">
                {processingLectures.map((lecture) => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Section */}
          {errorLectures.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-red-600 mb-3">
                Failed ({errorLectures.length})
              </h2>
              <div className="space-y-3">
                {errorLectures.map((lecture) => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ready Lectures */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Your Lectures ({readyLectures.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : readyLectures.length === 0 &&
              processingLectures.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center shadow-sm">
                <div className="bg-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileAudio className="w-10 h-10 text-purple-600" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {selectedModuleId
                    ? "No lectures for this module yet."
                    : "No lectures yet."}
                </h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  {selectedModuleId
                    ? "Add the first one to start summaries and revision tools."
                    : "Upload your first lecture in about 30 seconds."}
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                  >
                    <FileAudio size={18} />
                    {selectedModuleId ? "Add lecture" : "Upload lecture"}
                  </button>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Audio, transcript, or a lecture link — any one works.
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center gap-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Summary
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Cases
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    Quiz
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {readyLectures.map((lecture) => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
            <Link
              href="/quiz"
              prefetch={false}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 group"
            >
              Ready to test your knowledge?{" "}
              <span className="underline group-hover:no-underline">
                Go to Quiz Me
              </span>{" "}
              →
            </Link>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <LectureUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
        preSelectedModuleId={selectedModuleId}
        initialMode={initialUploadMode}
      />
    </div>
  );
}
