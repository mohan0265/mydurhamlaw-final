// src/components/calendar/TermColumnReal.tsx
// Real-data-only term column for YAAG 3-term layout
import React, { useMemo } from 'react';
import Link from 'next/link';
import { format, startOfWeek, addDays, isAfter, isBefore, isEqual } from 'date-fns';
import { BookOpen, FileText, Timer } from 'lucide-react';
import { Card } from '@/components/ui/Card';

type UserEvent = {
  id: string;
  title: string;
  start_at: string;
  module_code: string | null;
  event_type: string | null;
};

type UserAssessment = {
  id: string;
  title: string;
  due_at: string;
  module_code: string | null;
  assessment_type: string | null;
};

type TermColumnProps = {
  termKey: 'michaelmas' | 'epiphany' | 'easter';
  title: string;
  startDate: Date;
  endDate: Date;
  events: UserEvent[];
  assessments: UserAssessment[];
  onAssignmentClick?: (id: string, type: 'assessment' | 'brief') => void;
};

// Extract module code from title if not provided
function extractModuleCode(title: string, providedCode: string | null): string | null {
  if (providedCode) return providedCode;
  
  // Regex for LAW codes
  const match = title.match(/LAW\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

// Check if date is within interval (date-fns v2 compatible)
function isDateInInterval(date: Date, start: Date, end: Date): boolean {
  return (isEqual(date, start) || isAfter(date, start)) && (isEqual(date, end) || isBefore(date, end));
}

// Generate week blocks for the term
function generateWeeks(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  let currentWeek = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  
  while (currentWeek <= endDate) {
    weeks.push(new Date(currentWeek));
    currentWeek = addDays(currentWeek, 7);
  }
  
  return weeks;
}

export default function TermColumnReal({
  termKey,
  title,
  startDate,
  endDate,
  events,
  assessments,
  onAssignmentClick
}: TermColumnProps) {
  // Derive unique modules from events and assessments
  const modules = useMemo(() => {
    const moduleSet = new Set<string>();
    
    events.forEach(event => {
      const code = extractModuleCode(event.title, event.module_code);
      if (code) moduleSet.add(code);
    });
    
    assessments.forEach(assessment => {
      const code = extractModuleCode(assessment.title, assessment.module_code);
      if (code) moduleSet.add(code);
    });
    
    return Array.from(moduleSet).sort();
  }, [events, assessments]);

  // Generate week blocks
  const weeks = useMemo(() => generateWeeks(startDate, endDate), [startDate, endDate]);

  // Group assessments by week
  const assessmentsByWeek = useMemo(() => {
    const map = new Map<string, UserAssessment[]>();
    
    weeks.forEach(weekStart => {
      const weekEnd = addDays(weekStart, 6);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      const weekAssessments = assessments.filter(a => {
        const dueDate = new Date(a.due_at);
        return isDateInInterval(dueDate, weekStart, weekEnd);
      });
      
      map.set(weekKey, weekAssessments);
    });
    
    return map;
  }, [weeks, assessments]);

  // Group events by week (for module presence tracking)
  const eventsByWeek = useMemo(() => {
    const map = new Map<string, Set<string>>();
    
    weeks.forEach(weekStart => {
      const weekEnd = addDays(weekStart, 6);
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const moduleSet = new Set<string>();
      
      events.forEach(event => {
        const eventDate = new Date(event.start_at);
        if (isDateInInterval(eventDate, weekStart, weekEnd)) {
          const code = extractModuleCode(event.title, event.module_code);
          if (code) moduleSet.add(code);
        }
      });
      
      map.set(weekKey, moduleSet);
    });
    
    return map;
  }, [weeks, events]);

  if (weeks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">No events for this term</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Term</div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-gray-500">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </div>
        </div>
        <BookOpen className="w-5 h-5 text-purple-500" />
      </div>

      {/* Modules */}
      {modules.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Modules</div>
          <div className="flex flex-wrap gap-1">
            {modules.map(code => (
              <span
                key={code}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week Cards */}
      <div className="space-y-2">
        {weeks.map((weekStart, idx) => {
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          const weekAssessments = assessmentsByWeek.get(weekKey) || [];
          const weekModules = eventsByWeek.get(weekKey) || new Set();
          
          return (
            <div
              key={weekKey}
              className="rounded-lg border bg-white p-2 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-gray-700">
                  W{idx + 1} · {format(weekStart, 'MMM d')}
                </div>
                {weekAssessments.length > 0 && (
                  <div className="text-[10px] text-red-600 font-medium">
                    {weekAssessments.length} deadline{weekAssessments.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Module chips for this week */}
              {weekModules.size > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.from(weekModules).map(code => (
                    <span
                      key={code}
                      className="inline-block rounded bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 border border-blue-100"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}

              {/* Assessments */}
              {weekAssessments.length > 0 && (
                <div className="space-y-1">
                  {weekAssessments.map(a => {
                    const moduleCode = extractModuleCode(a.title, a.module_code);
                    return (
                      <Link
                        key={a.id}
                        href={`/assignments?openAssessmentId=${a.id}`}
                        className="block p-2 rounded bg-red-50 border border-red-100 hover:bg-red-100 transition group"
                      >
                        <div className="flex items-start gap-2">
                          {a.assessment_type === 'exam' ? (
                            <Timer className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FileText className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-red-900 truncate">
                              {a.title}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              {moduleCode && (
                                <div className="text-[10px] text-red-700">{moduleCode}</div>
                              )}
                              <div className="text-[10px] text-red-600 ml-auto">
                                {format(new Date(a.due_at), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
