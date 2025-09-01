// src/lib/hooks/useStudentProfile.ts
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';

export type YearKey = 'foundation' | 'year1' | 'year2' | 'year3';

export type StudentProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  yearKey: YearKey | null; // null if no row yet
};

function toYearKey(raw?: string | null): YearKey | null {
  if (!raw) return null;
  const k = raw.toLowerCase();
  return (['foundation', 'year1', 'year2', 'year3'] as const).includes(k as any)
    ? (k as YearKey)
    : null;
}

export function useStudentProfile() {
  return useQuery<StudentProfile | null>({
    queryKey: ['student-profile'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;

      // get current user
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return null;

      // fetch row from public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, year_group')
        .eq('id', user.id)
        .single();

      if (error) {
        // If table is locked by RLS or row missing, fail softly
        console.warn('profiles fetch error:', error.message);
        return {
          id: user.id,
          displayName: user.user_metadata?.full_name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
          yearKey: null,
        };
      }

      return {
        id: data.id,
        displayName: data.display_name ?? user.user_metadata?.full_name ?? null,
        avatarUrl: data.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        yearKey: toYearKey(data.year_group),
      };
    },
  });
}
