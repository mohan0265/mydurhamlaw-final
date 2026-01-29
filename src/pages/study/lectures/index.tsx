"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/lib/supabase/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, RefreshCw, FileAudio } from "lucide-react";
import dynamic from "next/dynamic";
import { useStudentOnly } from "@/hooks/useStudentOnly";
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
  status: "uploaded" | "transcribing" | "summarizing" | "ready" | "error";
  created_at: string;
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
    const hasProcessing = lectures.some(
      (l) =>
        l.status === "transcribing" ||
        l.status === "summarizing" ||
        l.status === "uploaded",
    );
    if (hasProcessing) {
      const interval = setInterval(fetchLectures, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [lectures, fetchLectures]);

  const [view, setView] = useState<"uploads" | "lecturers">("uploads");

  const handleUploadSuccess = () => {
    fetchLectures();
  };

  const readyLectures = lectures.filter((l) => l.status === "ready");
  const processingLectures = lectures.filter(
    (l) =>
      l.status === "transcribing" ||
      l.status === "summarizing" ||
      l.status === "uploaded",
  );
  const errorLectures = lectures.filter((l) => l.status === "error");

  // Nudge state
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    // Only verify client-side to avoid hydration mismatch
    const dismissed = localStorage.getItem("caseway_lectures_nudge_dismissed");
    // Show if not dismissed AND we have 0 ready lectures (or just 0 total to be safe/simple as requested)
    // User asked: "Auto-hide once user has >=1 lecture with status 'ready/processed' OR clicks Got it"
    // Let's use total length for simplicity first, or filter for success.
    // "visible until first successful lecture" -> implies ready/processed.
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
  const groupedModules = modules.reduce(
    (acc, mod) => {
      const year = mod.year_level || 1;
      if (!acc[year]) acc[year] = [];
      acc[year].push(mod);
      return acc;
    },
    {} as Record<number, Module[]>,
  );

  // Show loading while checking role or if loved one (redirecting)
  if (isRoleChecking || isLovedOne) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
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

        {/* Module Selector & Progress Strip */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Current Module
              </label>
              <select
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 min-w-[200px] outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
              >
                <option value="">Select a Module...</option>
                {Object.keys(groupedModules).map((year) => (
                  <optgroup key={year} label={`Year ${year}`}>
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

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Target:</span>
              <input
                type="number"
                className="w-16 p-1.5 border rounded-md text-sm text-center"
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
          </div>

          {selectedModuleId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Progress
              </span>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {
                  lectures.filter(
                    (l) =>
                      l.module_id === selectedModuleId ||
                      l.module_code ===
                        modules.find((m) => m.id === selectedModuleId)?.code,
                  ).length
                }{" "}
                Uploaded
              </div>
            </div>
          )}
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
                  <LectureCard key={lecture.id} lecture={lecture} />
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
                  <LectureCard key={lecture.id} lecture={lecture} />
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
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
                <FileAudio className="w-12 h-12 text-purple-100 mx-auto mb-4 bg-purple-600 rounded-xl p-2" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Add your first lecture
                </h3>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                  Transform your raw lecture materials into exam-ready notes.
                  Choose how you want to start:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
                  {/* Option 1 - Paste Transcript */}
                  <div
                    onClick={() => {
                      setShowUploadModal(true);
                      setInitialUploadMode("panopto");
                    }}
                    className="p-6 rounded-xl bg-purple-50 border border-purple-100 ring-1 ring-purple-200 hover:shadow-md transition cursor-pointer group relative flex flex-col"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                      Recommended
                    </div>
                    <div className="font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <span className="bg-purple-200 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      Paste Transcript
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">
                      Fastest & most accurate. Copy captions from Panopto and
                      paste them here.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-700 bg-purple-100/50 px-2 py-1 rounded w-fit mb-4">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{" "}
                      Saves DB Space
                    </div>
                    <button className="text-sm font-bold text-white bg-purple-600 w-full py-2.5 rounded-lg hover:bg-purple-700 transition shadow-sm">
                      Import Text
                    </button>
                  </div>

                  {/* Option 2 - Upload Audio */}
                  <div
                    onClick={() => {
                      setShowUploadModal(true);
                      setInitialUploadMode("audio");
                    }}
                    className="p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-200 transition cursor-pointer group flex flex-col"
                  >
                    <div className="font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <span className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      Upload Audio
                    </div>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-grow">
                      Have an MP3 or M4A? Upload it and we'll transcribe it for
                      you.
                    </p>
                    <div className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit mb-4">
                      Depends on clarity
                    </div>
                    <button className="text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 w-full py-2.5 rounded-lg hover:bg-white transition">
                      Select File
                    </button>
                  </div>

                  {/* Option 3 - Link */}
                  <div
                    onClick={() => {
                      setShowUploadModal(true);
                      setInitialUploadMode("panopto");
                    }}
                    className="p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-200 transition cursor-pointer group flex flex-col"
                  >
                    <div className="font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <span className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      Add Link
                    </div>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-grow">
                      Add a reference URL for <strong>1-click open</strong> in a
                      new tab.
                    </p>
                    <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit mb-4">
                      Reference Only
                    </div>
                    <button className="text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 w-full py-2.5 rounded-lg hover:bg-white transition">
                      Add Link
                    </button>
                  </div>
                </div>

                {/* Pro Tip Card */}
                <div className="mt-8 max-w-2xl mx-auto bg-blue-50 border border-blue-100 rounded-xl p-4 text-left flex gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600">
                    <span className="text-xl">💡</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">
                      Pro tip: Save the Panopto link
                    </h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      When you’re reviewing your summary or key points, the link
                      lets you jump back to the exact lecture quickly in a new
                      tab.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center gap-8 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Generates Summary
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Extracts Cases
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                    Creates Quiz
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {readyLectures.map((lecture) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
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
