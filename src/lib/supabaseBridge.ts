// src/lib/supabaseBridge.ts
// One place the widget imports from. Uses the SAME Supabase client as the app
// and exposes a tiny hook that always reflects the current signed-in user.
// Also sets up Durmah student context on window object.

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-browser";
import { getDefaultPlanByStudentYear } from "@/data/durham/llb";

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
}

declare global {
  interface Window {
    __mdlStudentContext?: DurmahStudentContext;
  }
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
    }))
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
