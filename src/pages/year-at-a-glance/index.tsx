import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/common/EmptyState";
import YearView from "@/components/calendar/YearView";
import UnifiedAddModal from "@/components/calendar/UnifiedAddModal";
import { useFamiliarity } from "@/hooks/useFamiliarity";
import ClarityCard, { ClarityNudge } from "@/components/ui/ClarityCard";

type UserEvent = {
  id: string;
  title: string;
  start_at: string;
  module_code: string | null;
};

type UserAssessment = {
  id: string;
  title: string;
  due_at: string;
  module_code: string | null;
  assessment_type: string | null;
};

export default function YearAtAGlancePage() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    familiarity,
    loading: familiarityLoading,
    markAsFamiliar,
  } = useFamiliarity();
  const [showFamiliarityGuidance, setShowFamiliarityGuidance] = useState(false);

  // Year State
  const [activeYear, setActiveYear] = useState<number>(1); // Default to Year 1
  const [viewYear, setViewYear] = useState<number>(1);

  // Determine view year from URL or active year
  useEffect(() => {
    if (!router.isReady) return;

    // Parse ?view= param
    const { view } = router.query;
    let targetYear = activeYear;

    if (view === "foundation") targetYear = 0;
    else if (view === "y1") targetYear = 1;
    else if (view === "y2") targetYear = 2;
    else if (view === "y3") targetYear = 3;

    setViewYear(targetYear);
  }, [router.isReady, router.query, activeYear]);

  // Fetch real active year from profile
  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data } = await supabase
        .from("profiles")
        .select("academic_level, year_group")
        .eq("id", user.id)
        .single();

      // Heuristic to determine numeric year from profile strings
      // Examples: 'Level 1', 'Year 1', 'Foundation'
      if (data) {
        let yr = 1;
        const s = (data.academic_level || data.year_group || "").toLowerCase();
        if (s.includes("foundation") || s.includes("level 0")) yr = 0;
        else if (s.includes("year 1") || s.includes("level 1")) yr = 1;
        else if (s.includes("year 2") || s.includes("level 2")) yr = 2;
        else if (s.includes("year 3") || s.includes("level 3")) yr = 3;

        setActiveYear(yr);
        // Also update view year if no param is set?
        // We rely on the other useEffect for param priority.
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Fetch data ONLY if viewing active year
  const isReadOnly = viewYear !== activeYear;

  const fetchData = async () => {
    if (!user?.id) return;

    // If read-only mode, don't fetch personal events
    if (isReadOnly) {
      setEvents([]);
      setAssessments([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      setLoading(true);
      // Academic year 2025-26: Sept 1, 2025 - Aug 31, 2026
      const yearStart = "2025-09-01";
      const yearEnd = "2026-08-31";

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("user_events")
        .select("id, title, start_at, module_code")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("start_at", yearStart)
        .lte("start_at", yearEnd)
        .order("start_at", { ascending: true });

      if (eventsError) {
        console.error("[YAAG] Error fetching events:", eventsError);
      }

      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("user_assessments")
        .select("id, title, due_at, module_code, assessment_type")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("due_at", yearStart)
        .lte("due_at", yearEnd)
        .order("due_at", { ascending: true });

      if (assessmentsError) {
        console.error("[YAAG] Error fetching assessments:", assessmentsError);
      }

      console.log(
        "[YAAG] Loaded real data:",
        eventsData?.length || 0,
        "events,",
        assessmentsData?.length || 0,
        "assessments",
      );

      setEvents(eventsData || []);
      setAssessments(assessmentsData || []);
    } catch (error) {
      console.error("[YAAG] Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, viewYear, activeYear]); // Re-fetch when switching views (to clear/load)

  const handleYearChange = (yr: number) => {
    // Map number to query param
    let v = "y1";
    if (yr === 0) v = "foundation";
    else if (yr === 1) v = "y1";
    else if (yr === 2) v = "y2";
    else if (yr === 3) v = "y3";

    router.push(
      { pathname: "/year-at-a-glance", query: { view: v } },
      undefined,
      { shallow: true },
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-6 h-96 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          icon={<Calendar size={48} />}
          title="Login Required"
          description="Please log in to view your year at a glance"
          actionLabel="Go to Login"
          actionHref="/login"
        />
      </div>
    );
  }

  // Check if user has imported data (only relevant if not read-only)
  const hasData = !isReadOnly && (events.length > 0 || assessments.length > 0);

  const yearLabel = (y: number) => {
    if (y === 0) return "Foundation";
    return `Year ${y}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {(showFamiliarityGuidance ||
        (!familiarity.yaag && !familiarityLoading)) && (
        <ClarityCard
          title="Year at a Glance (YAAG)"
          description="The backbone of your academic life. YAAG maps your entire degree path, from Foundation to graduation, showing exactly where you are and what is ahead."
          steps={[
            "Sync your Blackboard calendar to see your unique schedule.",
            "Click any week to drill down into daily tasks.",
            "Visualise assessment deadlines before they surprise you.",
            "Navigate between academic years to see your progression.",
          ]}
          onDismiss={() => {
            markAsFamiliar("yaag");
            setShowFamiliarityGuidance(false);
          }}
          watchDemoHref="/demo/year-at-a-glance"
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Year at a Glance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Eagle-eye view of your Durham Law pathway
            <span className="ml-4">
              <ClarityNudge
                label="How this works"
                onClick={() => setShowFamiliarityGuidance(true)}
              />
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && !hasData && (
            <Link
              href="/onboarding/calendar"
              className="px-4 py-2 rounded-xl border border-purple-200 text-purple-600 bg-white hover:bg-purple-50 text-sm font-medium transition-all"
            >
              ➕ Import Calendar
            </Link>
          )}
          {/* Calendar View Button - Disabled if ReadOnly */}
          {isReadOnly ? (
            <div
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed border border-gray-200"
              title="Detailed drilldown is only enabled for your current year."
            >
              📅 Open Calendar View
            </div>
          ) : (
            <Link
              href="/year-at-a-glance/calendar"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              📅 Open Calendar View
            </Link>
          )}
        </div>
      </div>

      {/* Year Navigation Controls */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-2 mb-6 shadow-sm max-w-2xl">
        <button
          onClick={() => handleYearChange(viewYear - 1)}
          disabled={viewYear <= 0}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Viewing:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[0, 1, 2, 3].map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearChange(yr)}
                className={`px-3 py-1 text-sm rounded-md transition font-medium ${viewYear === yr ? "bg-white shadow text-purple-700" : "text-gray-500 hover:text-gray-900"}`}
              >
                {yearLabel(yr)}
              </button>
            ))}
          </div>
          {/* Active Badge */}
          {viewYear === activeYear && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
              Your Active Year
            </span>
          )}
        </div>

        <button
          onClick={() => handleYearChange(viewYear + 1)}
          disabled={viewYear >= 3}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Eagle-Eye 3-Term Layout - Always shown, even if empty */}
      <YearView
        userYearOfStudy={viewYear}
        userEvents={events}
        userAssessments={assessments}
        isReadOnly={isReadOnly}
      />

      {/* Empty state hint (shown inside the view when no data) */}
      {!isReadOnly && !hasData && (
        <div className="mt-6 text-center bg-white/80 backdrop-blur-sm rounded-xl py-4 px-6 border border-gray-100 max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            💡 <span className="font-medium">Tip:</span> Click on any week to
            see details. Once you import your calendar, events will appear in
            their respective weeks.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 text-center">
        {isReadOnly ? (
          <p className="text-xs text-gray-400">
            Detailed calendar is available for your current year of study.
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            💡 Click any week to view details • Click assignments to open Widget
            • Use + to add items
          </p>
        )}
        <div className="mt-8">
          <Link
            href="/exam-prep"
            prefetch={false}
            className="text-xs font-bold text-gray-400 hover:text-purple-600 transition flex items-center justify-center gap-2 group"
          >
            Long-term goals set?{" "}
            <span className="underline group-hover:no-underline font-black text-purple-500">
              Prepare for exams
            </span>{" "}
            →
          </Link>
        </div>
      </div>

      {/* Floating + Button - Only for active year */}
      {!isReadOnly && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition-all flex items-center justify-center z-40 group"
          title="Add item (Personal or Assignment)"
        >
          <Plus size={28} />
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
            Add Personal Item or Assignment
          </span>
        </button>
      )}

      {/* Unified Add Modal */}
      <UnifiedAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => {
          // Refresh data after save
          fetchData();
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
