"use client";
import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, Calendar, Clock, Target, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getStudentYear } from "@/lib/syllabus/fetch";
import { fmtRange } from "@/lib/date/format";
import { 
  DURHAM_LLB_2025_26,
  AcademicYearPlan
} from "@/data/durham/llb";
import { Assessment } from "@/data/durham/llb/academic_year_2025_26";

type YearKey = "foundation" | "year1" | "year2" | "year3";
type AcademicYearLabel = "2024-25" | "2025-26" | "2026-27";

interface YearViewState {
  currentAcademicYear: AcademicYearLabel;
  studentYearLevel: YearKey;
  isCurrentYear: boolean;
  canDrillDown: boolean;
}

interface PersonalAssignment {
  id: string;
  title: string;
  due_date: string;
  module_code?: string;
  type: "essay" | "exam" | "coursework" | "presentation";
  status: "not_started" | "in_progress" | "submitted" | "graded";
  priority: "low" | "medium" | "high";
}

interface TermProgress {
  completed_topics: number;
  total_topics: number;
  upcoming_deadlines: number;
  overdue_items: number;
}

const ACADEMIC_YEARS: AcademicYearLabel[] = ["2024-25", "2025-26", "2026-27"];
const CURRENT_ACADEMIC_YEAR: AcademicYearLabel = "2025-26";

export default function YearAtAGlanceView() {
  const router = useRouter();
  const [viewState, setViewState] = useState<YearViewState>({
    currentAcademicYear: CURRENT_ACADEMIC_YEAR,
    studentYearLevel: "year1",
    isCurrentYear: true,
    canDrillDown: true
  });
  const [personalAssignments, setPersonalAssignments] = useState<PersonalAssignment[]>([]);
  const [termProgress, setTermProgress] = useState<Record<string, TermProgress>>({});
  const [loading, setLoading] = useState(true);
  const [studentYearLevel, setStudentYearLevel] = useState<YearKey | null>(null);

  // Get academic plan for current view
  const academicPlan = useMemo(() => {
    return DURHAM_LLB_2025_26[viewState.studentYearLevel];
  }, [viewState.studentYearLevel]);

  // Initialize student data
  useEffect(() => {
    async function initializeData() {
      try {
        setLoading(true);
        
        // Get student's current year level
        const studentYear = await getStudentYear();
        const yearKey: YearKey = studentYear ? `year${studentYear}` as YearKey : "year1";
        setStudentYearLevel(yearKey);
        
        // Determine if viewing current academic year
        const isCurrentYear = viewState.currentAcademicYear === CURRENT_ACADEMIC_YEAR;
        
        setViewState(prev => ({
          ...prev,
          studentYearLevel: yearKey,
          isCurrentYear,
          canDrillDown: isCurrentYear
        }));
        
        // Load personal assignments and progress if current year
        if (isCurrentYear) {
          await loadPersonalData(yearKey);
        }
      } catch (error) {
        console.error("Failed to initialize year-at-a-glance data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    initializeData();
  }, [viewState.currentAcademicYear]);

  // Load personal assignments and progress
  async function loadPersonalData(yearLevel: YearKey) {
    try {
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Load personal assignments
      const { data: assignments } = await supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'assignment')
        .gte('start_at', academicPlan.termDates.michaelmas.start)
        .lte('start_at', academicPlan.termDates.easter.end)
        .order('start_at', { ascending: true });
      
      if (assignments) {
        const mappedAssignments: PersonalAssignment[] = assignments.map((a: any) => ({
          id: a.id,
          title: a.title,
          due_date: a.start_at,
          module_code: a.module_id,
          type: a.notes?.includes('exam') ? 'exam' : 'coursework',
          status: a.completed ? 'submitted' : 'not_started',
          priority: a.priority || 'medium'
        }));
        setPersonalAssignments(mappedAssignments);
      }
      
      // Calculate term progress based on real data
      const progress: Record<string, TermProgress> = {
        michaelmas: {
          completed_topics: 0, // Should be calculated from actual study progress
          total_topics: 20,
          upcoming_deadlines: assignments?.filter((a: any) => 
            a.start_at >= academicPlan.termDates.michaelmas.start &&
            a.start_at <= academicPlan.termDates.michaelmas.end
          ).length || 0,
          overdue_items: 0
        },
        epiphany: {
          completed_topics: 0, // Should be calculated from actual study progress
          total_topics: 18,
          upcoming_deadlines: assignments?.filter((a: any) => 
            a.start_at >= academicPlan.termDates.epiphany.start &&
            a.start_at <= academicPlan.termDates.epiphany.end
          ).length || 0,
          overdue_items: 0
        },
        easter: {
          completed_topics: 0,
          total_topics: 15,
          upcoming_deadlines: assignments?.filter((a: any) => 
            a.start_at >= academicPlan.termDates.easter.start &&
            a.start_at <= academicPlan.termDates.easter.end
          ).length || 0,
          overdue_items: 0
        }
      };
      setTermProgress(progress);
    } catch (error) {
      console.error("Failed to load personal data:", error);
    }
  }

  // Navigation handlers
  const handlePreviousYear = () => {
    const currentIndex = ACADEMIC_YEARS.indexOf(viewState.currentAcademicYear);
    if (currentIndex > 0) {
      const prevYear = ACADEMIC_YEARS[currentIndex - 1];
      if (prevYear) {
        setViewState(prev => ({
          ...prev,
          currentAcademicYear: prevYear,
          isCurrentYear: prevYear === CURRENT_ACADEMIC_YEAR,
          canDrillDown: prevYear === CURRENT_ACADEMIC_YEAR
        }));
      }
    }
  };

  const handleNextYear = () => {
    const currentIndex = ACADEMIC_YEARS.indexOf(viewState.currentAcademicYear);
    if (currentIndex < ACADEMIC_YEARS.length - 1) {
      const nextYear = ACADEMIC_YEARS[currentIndex + 1];
      if (nextYear) {
        setViewState(prev => ({
          ...prev,
          currentAcademicYear: nextYear,
          isCurrentYear: nextYear === CURRENT_ACADEMIC_YEAR,
          canDrillDown: nextYear === CURRENT_ACADEMIC_YEAR
        }));
      }
    }
  };

  // Drill-down handlers
  const handleTermClick = (termKey: string) => {
    if (!viewState.canDrillDown) return;
    
    // Navigate to term view
    router.push(`/planner/${viewState.studentYearLevel}/${termKey}`);
  };

  const handleMonthClick = (monthDate: string) => {
    if (!viewState.canDrillDown) return;
    
    const date = new Date(monthDate);
    router.push(`/year-at-a-glance/month?date=${format(date, 'yyyy-MM')}`);
  };

  // Get upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const allDeadlines: Array<Assessment & { moduleTitle: string }> = [];
    
    academicPlan.modules.forEach(module => {
      module.assessments.forEach(assessment => {
        if ('due' in assessment) {
          const dueDate = new Date(assessment.due);
          if (isAfter(dueDate, now)) {
            allDeadlines.push({
              ...assessment,
              moduleTitle: module.title
            });
          }
        }
      });
    });
    
    return allDeadlines
      .filter(assessment => 'due' in assessment) // Only assessments with due dates
      .sort((a, b) => new Date((a as any).due).getTime() - new Date((b as any).due).getTime())
      .slice(0, 5);
  }, [academicPlan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your academic year overview...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Year at a Glance {viewState.currentAcademicYear} - MyDurhamLaw</title>
        <meta name="description" content={`Academic year overview for ${academicPlan.yearLabel} (${viewState.currentAcademicYear})`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Year Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousYear}
                  disabled={ACADEMIC_YEARS.indexOf(viewState.currentAcademicYear) === 0}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous academic year"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Academic Year {viewState.currentAcademicYear}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {academicPlan.yearLabel} 
                    {viewState.isCurrentYear && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current
                      </span>
                    )}
                  </p>
                </div>
                
                <button
                  onClick={handleNextYear}
                  disabled={ACADEMIC_YEARS.indexOf(viewState.currentAcademicYear) === ACADEMIC_YEARS.length - 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next academic year"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Current Status */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                {viewState.isCurrentYear ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Interactive View</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>View Only</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Terms Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {(['michaelmas', 'epiphany', 'easter'] as const).map((termKey) => {
              const term = academicPlan.termDates[termKey];
              const progress = termProgress[termKey];
              
              return (
                <div
                  key={termKey}
                  onClick={() => handleTermClick(termKey)}
                  className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                    viewState.canDrillDown
                      ? 'border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer'
                      : 'border-gray-200 cursor-not-allowed opacity-75'
                  }`}
                >
                  {/* Term Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {termKey}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {fmtRange(term.start, term.end)}
                      </p>
                    </div>
                    {viewState.canDrillDown && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Teaching Weeks */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Teaching Weeks</span>
                      <span className="text-sm text-gray-600">{term.weeks.length} weeks</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {term.weeks.map((weekStart, index) => {
                        const weekDate = new Date(weekStart);
                        const isCurrentWeek = viewState.isCurrentYear && 
                          isAfter(new Date(), weekDate) && 
                          isBefore(new Date(), new Date(weekDate.getTime() + 7 * 24 * 60 * 60 * 1000));
                        
                        return (
                          <div
                            key={weekStart}
                            className={`h-6 rounded text-xs flex items-center justify-center font-medium ${
                              isCurrentWeek
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {index + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Progress Indicators */}
                  {progress && viewState.isCurrentYear && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Topics Completed</span>
                        <span className="font-medium">
                          {progress.completed_topics}/{progress.total_topics}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress.completed_topics / progress.total_topics) * 100}%` }}
                        ></div>
                      </div>
                      
                      {progress.upcoming_deadlines > 0 && (
                        <div className="flex items-center text-sm text-amber-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span>{progress.upcoming_deadlines} deadline{progress.upcoming_deadlines !== 1 ? 's' : ''} due</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modules Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Modules for {academicPlan.yearLabel}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {academicPlan.modules.length} modules • {academicPlan.modules.reduce((sum, m) => sum + m.credits, 0)} credits total
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Module</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Credits</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Delivery</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Assessments</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {academicPlan.modules.map((module, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{module.title}</div>
                          <div className="text-gray-600 text-xs">
                            {module.code && `${module.code} • `}
                            {module.compulsory ? 'Compulsory' : 'Elective'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{module.credits}</td>
                      <td className="px-6 py-4 text-gray-600">{module.delivery}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {module.assessments.map((assessment, assessIndex) => {
                            let assessmentText = assessment.type;
                            if ('due' in assessment) {
                              assessmentText += ` (due ${format(new Date(assessment.due), 'MMM d')})`;
                            } else if ('window' in assessment) {
                              assessmentText += ` (${format(new Date(assessment.window.start), 'MMM d')} - ${format(new Date(assessment.window.end), 'MMM d')})`;
                            }
                            if (assessment.weight) {
                              assessmentText += ` - ${assessment.weight}%`;
                            }
                            return (
                              <div key={assessIndex} className="text-xs text-gray-600">
                                {assessmentText}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {viewState.isCurrentYear ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Deadlines - Only for current year */}
          {viewState.isCurrentYear && upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
                <button
                  onClick={() => router.push('/planner/assignments')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => {
                  const dueDate = new Date((deadline as any).due);
                  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{deadline.type}</div>
                        <div className="text-sm text-gray-600">{deadline.moduleTitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {format(dueDate, 'MMM d, yyyy')}
                        </div>
                        <div className={`text-xs ${
                          daysUntilDue <= 7 ? 'text-red-600' : daysUntilDue <= 14 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {daysUntilDue === 0 ? 'Due today' : 
                           daysUntilDue === 1 ? 'Due tomorrow' : 
                           `${daysUntilDue} days`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View-Only Notice for Past/Future Years */}
          {!viewState.isCurrentYear && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Viewing {viewState.currentAcademicYear === "2024-25" ? "Previous" : "Future"} Academic Year
              </h3>
              <p className="text-blue-700 text-sm">
                This is a read-only view. Interactive features and detailed planning are only available for the current academic year (2025-26).
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}