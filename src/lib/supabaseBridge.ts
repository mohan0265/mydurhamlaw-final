// src/lib/supabaseBridge.ts
// One place the widget imports from. Uses the SAME Supabase client as the app
// and exposes a tiny hook that always reflects the current signed-in user.
// Also sets up Durmah student context on window object.

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-browser";
import { getDefaultPlanByStudentYear } from "@/data/durham/llb";
import type { AcademicYearPlan } from "@/data/durham/llb";
import { parseISO, isAfter, isBefore, format, addDays } from "date-fns";

// Durmah student context interface
interface DurmahStudentContext {
  userId: string;
  university: string;
  programme: string;
  yearGroup: string;
  academicYear: string;
  modules: Array<{
    code: string;
    title: string;
    credits: number;
  }>;
  calendar?: {
    currentTerm: string;
    week: number | null;
    upcoming: Array<{
      title: string;
      date: string;
      kind: string;
      module?: string;
    }>;
  };
}

declare global {
  interface Window {
    __mdlStudentContext?: DurmahStudentContext;
  }
}

export function buildStudentCalendarContext(plan: AcademicYearPlan, now = new Date()) {
  const { termDates } = plan;

  const within = (s: string, e: string) => {
    const sd = parseISO(s + 'T00:00:00.000Z'), ed = parseISO(e + 'T23:59:59.999Z');
    return isAfter(now, sd) && isBefore(now, ed);
  };

  const currentTerm =
    within(termDates.michaelmas.start, termDates.michaelmas.end) ? "michaelmas" :
    within(termDates.epiphany.start, termDates.epiphany.end)     ? "epiphany"   :
    within(termDates.easter.start, termDates.easter.end)         ? "easter"     :
    "vacation";

  // Calculate week number in term (Mon-based weeks, 1..10)
  const week = (() => {
    const weeks =
      currentTerm === "michaelmas" ? termDates.michaelmas.weeks :
      currentTerm === "epiphany"   ? termDates.epiphany.weeks   :
      currentTerm === "easter"     ? termDates.easter.weeks     : [];
    
    const todayISO = format(now, 'yyyy-MM-dd');
    const idx = weeks.findIndex(weekStart => {
      const weekStartDate = parseISO(weekStart + 'T00:00:00.000Z');
      const weekEndDate = addDays(weekStartDate, 6);
      return now >= weekStartDate && now <= weekEndDate;
    });
    return idx >= 0 ? idx + 1 : null;
  })();

  // Get next 3-5 upcoming assessment-like items within academic year
  const upcoming = [];
  const todayISO = format(now, 'yyyy-MM-dd');
  
  for (const module of plan.modules || []) {
    for (const assessment of module.assessments || []) {
      if ('due' in assessment && assessment.due && assessment.due > todayISO) {
        upcoming.push({
          title: `${module.title} ${assessment.type}`,
          date: assessment.due,
          kind: 'assessment',
          module: module.title,
        });
      } else if ('window' in assessment && assessment.window?.start && assessment.window.start > todayISO) {
        upcoming.push({
          title: `${module.title} Exam`,
          date: assessment.window.start,
          kind: 'exam',
          module: module.title,
        });
      }
    }
  }

  // Sort by date and limit to 5
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  
  return { 
    currentTerm, 
    week, 
    upcoming: upcoming.slice(0, 5)
  };
}

/** Set up Durmah student context on window object */
export function setupDurmahContext(user: User | null, userProfile?: any) {
  if (typeof window === 'undefined') return; // SSR guard

  if (!user?.id) {
    // No user, provide minimal anonymous context
    window.__mdlStudentContext = {
      userId: '',
      university: 'Durham University',
      programme: 'LLB',
      yearGroup: 'year1',
      academicYear: '2025/26',
      modules: []
    };
    return;
  }

  // Get user's year key and plan
  const programme = userProfile?.user_type || 'LLB';
  const yearGroup = (userProfile?.year_group || 'year1').toLowerCase().replace(/\s/g, '') as 'foundation'|'year1'|'year2'|'year3';
  const plan = getDefaultPlanByStudentYear(yearGroup);
  
  // Build calendar context
  const calendarContext = buildStudentCalendarContext(plan, new Date());
  
  // Set up complete student context
  window.__mdlStudentContext = {
    userId: user.id,
    university: 'Durham University',
    programme,
    yearGroup,
    academicYear: '2025/26',
    modules: (plan.modules || []).map(m => ({
      code: m.code || m.title.substring(0, 8).toUpperCase().replace(/\s/g, ''),
      title: m.title,
      credits: m.credits
    })),
    calendar: calendarContext
  };
}

/** Read the current user from the single app client. */
export function useAuth(): { user: User | null } {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // ✅ Most reliable: read the active session (works across all providers)
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data?.session?.user ?? null);
    });

    // Stay in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        (sub as any)?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  return { user };
}

export { supabase };
