import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { isValid, startOfDay, format, addDays } from "date-fns";
import dynamic from "next/dynamic";

const parseISO = (date: string) => new Date(date + "T00:00:00.000Z");
import { getEventsForWeek } from "@/lib/calendar/useCalendarData";
import { getDefaultPlanByStudentYear } from "@/data/durham/llb";
import { getStudentYear, parseYearKey, YEAR_LABEL } from "@/lib/calendar/links";
import type { YearKey } from "@/lib/calendar/links";
import type { NormalizedEvent } from "@/lib/calendar/normalize";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Book,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Modals
import PersonalItemModal from "@/components/calendar/PersonalItemModal";
import { PlanEventModal } from "@/components/calendar/PlanEventModal";
import SimpleAssignmentEditModal from "@/components/calendar/SimpleAssignmentEditModal";

function getTermInfo(date: Date, yearKey: YearKey) {
  const plan = getDefaultPlanByStudentYear(yearKey);
  const dateISO = format(date, "yyyy-MM-dd");

  // Check which term the date falls in
  if (
    dateISO >= plan.termDates.michaelmas.start &&
    dateISO <= plan.termDates.michaelmas.end
  ) {
    const weekIndex = plan.termDates.michaelmas.weeks.findIndex((weekStart) => {
      const weekStartDate = new Date(weekStart + "T00:00:00.000Z");
      const weekEndDate = addDays(weekStartDate, 6);
      return date >= weekStartDate && date <= weekEndDate;
    });
    return {
      term: "Michaelmas",
      week: weekIndex >= 0 ? `W${weekIndex + 1}` : null,
      label: `Michaelmas ${weekIndex >= 0 ? `• W${weekIndex + 1}` : ""}`,
    };
  }

  if (
    dateISO >= plan.termDates.epiphany.start &&
    dateISO <= plan.termDates.epiphany.end
  ) {
    const weekIndex = plan.termDates.epiphany.weeks.findIndex((weekStart) => {
      const weekStartDate = new Date(weekStart + "T00:00:00.000Z");
      const weekEndDate = addDays(weekStartDate, 6);
      return date >= weekStartDate && date <= weekEndDate;
    });
    return {
      term: "Epiphany",
      week: weekIndex >= 0 ? `W${weekIndex + 1}` : null,
      label: `Epiphany ${weekIndex >= 0 ? `• W${weekIndex + 1}` : ""}`,
    };
  }

  if (
    dateISO >= plan.termDates.easter.start &&
    dateISO <= plan.termDates.easter.end
  ) {
    const weekIndex = plan.termDates.easter.weeks.findIndex((weekStart) => {
      const weekStartDate = new Date(weekStart + "T00:00:00.000Z");
      const weekEndDate = addDays(weekStartDate, 6);
      return date >= weekStartDate && date <= weekEndDate;
    });
    return {
      term: "Easter",
      week: weekIndex >= 0 ? `W${weekIndex + 1}` : null,
      label: `Easter ${weekIndex >= 0 ? `• W${weekIndex + 1}` : ""}`,
    };
  }

  return {
    term: "Vacation",
    week: null,
    label: "Vacation",
  };
}

function getEventIcon(kind: NormalizedEvent["kind"]) {
  switch (kind) {
    case "topic":
      return <Book className="w-4 h-4 text-blue-600" />;
    case "assessment":
      return <AlertCircle className="w-4 h-4 text-orange-600" />;
    case "exam":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Calendar className="w-4 h-4 text-gray-600" />;
  }
}

function getEventStyle(kind: NormalizedEvent["kind"]) {
  switch (kind) {
    case "topic":
      return "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100";
    case "assessment":
      return "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100";
    case "exam":
      return "bg-red-100 text-red-900 border-red-300 hover:bg-red-200";
    default:
      return "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100";
  }
}

export default function DayPage() {
  const router = useRouter();
  const { y: yParam, d: dParam } = router.query;

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(
    null,
  );
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  const yearKey: YearKey = useMemo(() => {
    return parseYearKey(typeof yParam === "string" ? yParam : undefined);
  }, [yParam]);

  const targetDate = useMemo(() => {
    const d = typeof dParam === "string" ? dParam : "";
    if (d && isValid(parseISO(d))) {
      return startOfDay(parseISO(d));
    }
    // Default to today clamped to academic year
    return startOfDay(new Date());
  }, [dParam]);

  const targetISO = format(targetDate, "yyyy-MM-dd");
  const termInfo = getTermInfo(targetDate, yearKey);

  // Get day's events
  const weekEvents = getEventsForWeek(
    yearKey,
    format(targetDate, "yyyy-MM-dd"),
  );
  const dayEvents = weekEvents.filter((e) => e.date === targetISO);

  // Get next 7 days of upcoming deadlines/assessments
  const next7Days = useMemo(() => {
    const upcoming: NormalizedEvent[] = [];
    const plan = getDefaultPlanByStudentYear(yearKey);

    for (let i = 1; i <= 7; i++) {
      const futureDate = addDays(targetDate, i);
      const futureDateISO = format(futureDate, "yyyy-MM-dd");

      // Check if future date is within any term window
      const isWithinTerm =
        (futureDateISO >= plan.termDates.michaelmas.start &&
          futureDateISO <= plan.termDates.michaelmas.end) ||
        (futureDateISO >= plan.termDates.epiphany.start &&
          futureDateISO <= plan.termDates.epiphany.end) ||
        (futureDateISO >= plan.termDates.easter.start &&
          futureDateISO <= plan.termDates.easter.end);

      if (isWithinTerm) {
        const futureWeekEvents = getEventsForWeek(yearKey, futureDateISO);
        const futureAssessments = futureWeekEvents.filter(
          (e) =>
            e.date === futureDateISO &&
            (e.kind === "exam" || e.kind === "assessment"),
        );
        upcoming.push(...futureAssessments);
      }
    }

    return upcoming.slice(0, 5); // Limit to 5 items
  }, [targetDate, yearKey]);

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter((e) => !e.start || e.allDay);
  const timedEvents = dayEvents.filter((e) => e.start && !e.allDay);

  // Navigation handlers
  const handleWeekView = useCallback(() => {
    router.push(`/year-at-a-glance/week?y=${yearKey}&ws=${targetISO}`);
  }, [router, yearKey, targetISO]);

  const handleMonthView = useCallback(() => {
    const ym = format(targetDate, "yyyy-MM");
    router.push(`/year-at-a-glance/month?y=${yearKey}&ym=${ym}`);
  }, [router, yearKey, targetDate]);

  const handleBack = useCallback(() => {
    router.push(`/year-at-a-glance?y=${yearKey}`);
  }, [router, yearKey]);

  // GUARDAIL: HASH NAVIGATION & AUTO-HIGHLIGHT
  // ============================================
  // Critical for Dashboard alignment:
  // 1. Reads #event-{id} from URL
  // 2. Auto-scrolls to element
  // 3. Applies golden highlight flash
  // 4. Fallback: If element not found, do nothing (prevent crash)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const eventId = window.location.hash.substring(1); // e.g., "event-123"

      // Wait for DOM to fully render
      setTimeout(() => {
        // SAFETY CHECK: Ensure element exists before accessing classList
        const element = document.getElementById(eventId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-flash");

          // Remove highlight after animation
          setTimeout(() => {
            element.classList.remove("highlight-flash");
          }, 2000);
        } else {
          console.warn("[DayPage] Auto-scroll target not found:", eventId);
        }
      }, 100);
    }
  }, []);

  // Event Click Handler
  const handleEventClick = (event: NormalizedEvent) => {
    setSelectedEvent(event);
    const source = event.meta?.source;

    if (source === "assignment") {
      setIsAssignmentModalOpen(true);
    } else if (source === "personal" || source === "plan_override") {
      setIsPersonalModalOpen(true);
    } else if (source === "plan") {
      setIsPlanModalOpen(true);
    } else if (event.kind === "topic") {
      // Typically plan topics
      setIsPlanModalOpen(true);
    } else {
      // Fallback for assessment/exam from plan
      setIsPlanModalOpen(true);
    }
  };

  const handleRefresh = () => {
    router.replace(router.asPath);
  };

  return (
    <>
      <Head>
        <title>Day • {format(targetDate, "MMM d, yyyy")} • Caseway</title>
        <style jsx global>{`
          .highlight-flash {
            animation: highlight-flash 2s ease-in-out;
          }
          @keyframes highlight-flash {
            0%,
            100% {
              background-color: transparent;
            }
            50% {
              background-color: rgba(255, 215, 0, 0.4);
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
          }
        `}</style>
        <meta
          name="description"
          content={`Daily schedule and upcoming deadlines for ${YEAR_LABEL[yearKey]}`}
        />
      </Head>

      <div className="mx-auto max-w-6xl p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Year
          </button>

          <h1 className="text-2xl font-semibold flex items-center gap-3">
            Day • {format(targetDate, "EEEE, MMM d, yyyy")}
            <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
              {termInfo.label}
            </span>
          </h1>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleWeekView}>
              Week View
            </Button>
            <Button variant="outline" size="sm" onClick={handleMonthView}>
              Month View
            </Button>
          </div>
        </header>

        {/* Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All-day Events */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All-Day Events
            </h2>

            {allDayEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No all-day events scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {allDayEvents.map((event) => {
                  const isRange =
                    !!event?.allDay && !!event?.date && !!event?.endDate;
                  const label =
                    event?.subtype === "exam_window" && isRange
                      ? `${event.title} (${format(parseISO(event.date), "d MMM")}-${format(parseISO(event.endDate!), "d MMM")})`
                      : event.title;

                  return (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => handleEventClick(event)}
                      className={`p-3 rounded border ${getEventStyle(event.kind)} transition-all duration-300 cursor-pointer hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        {getEventIcon(event.kind)}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {label}
                          </div>
                          {event.module && (
                            <div className="text-xs opacity-75 mb-1">
                              {event.module}
                            </div>
                          )}
                          {event.details && (
                            <div className="text-xs opacity-60">
                              {event.details}
                            </div>
                          )}
                          {event.subtype === "exam_window" && (
                            <div className="text-xs opacity-60 mt-1">
                              Dates TBA within exam window
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timed Events */}
          <div className="bg-white rounded-2xl shadow border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timed Schedule
            </h2>

            {timedEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No timed events scheduled</p>
            ) : (
              <div className="space-y-3">
                {timedEvents
                  .sort((a, b) =>
                    (a.start || "").localeCompare(b.start || "", undefined, {
                      numeric: true,
                    }),
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => handleEventClick(event)}
                      className={`p-3 rounded border ${getEventStyle(event.kind)} transition-all duration-300 cursor-pointer hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        {getEventIcon(event.kind)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">
                              {event.start}
                              {event.end && `-${event.end}`}
                            </span>
                            <span className="font-medium text-sm">
                              {event.title}
                            </span>
                          </div>
                          {event.module && (
                            <div className="text-xs opacity-75 mb-1">
                              {event.module}
                            </div>
                          )}
                          {event.details && (
                            <div className="text-xs opacity-60">
                              {event.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            What's Next (Next 7 Days)
          </h2>

          {next7Days.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No upcoming deadlines within term windows
            </p>
          ) : (
            <div className="space-y-3">
              {next7Days.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`p-3 rounded border ${getEventStyle(event.kind)} cursor-pointer hover:shadow-md transition-all`}
                >
                  <div className="flex items-start gap-3">
                    {getEventIcon(event.kind)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {event.title}
                        </span>
                        <span className="text-xs font-medium opacity-75">
                          {format(parseISO(event.date), "EEE, MMM d")}
                        </span>
                      </div>
                      {event.module && (
                        <div className="text-xs opacity-75 mb-1">
                          {event.module}
                        </div>
                      )}
                      {event.details && (
                        <div className="text-xs opacity-60">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modals */}
      <PersonalItemModal
        isOpen={isPersonalModalOpen}
        onClose={() => setIsPersonalModalOpen(false)}
        onSave={handleRefresh}
        mode="edit"
        existingItem={
          selectedEvent?.meta?.source === "personal" ||
          selectedEvent?.meta?.source === "plan_override"
            ? {
                id: selectedEvent.meta.personalItemId,
                title: selectedEvent.title,
                type: selectedEvent.meta.type || "study",
                start_at:
                  selectedEvent.start_at ||
                  `${selectedEvent.date}T${selectedEvent.start || "09:00"}:00Z`,
                end_at: selectedEvent.end_at || null,
                is_all_day: selectedEvent.allDay || false,
                priority: selectedEvent.meta.priority || "medium",
                notes: selectedEvent.meta.notes || "",
                completed: selectedEvent.meta.completed || false,
              }
            : undefined
        }
      />

      <PlanEventModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSave={handleRefresh}
        event={selectedEvent}
      />

      <SimpleAssignmentEditModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onSave={handleRefresh}
        assignment={selectedEvent}
      />
    </>
  );
}
