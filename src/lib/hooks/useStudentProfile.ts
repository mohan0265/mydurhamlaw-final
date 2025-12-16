// src/lib/hooks/useStudentProfile.ts
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { YearKey } from '@/lib/calendar/links';

type ProfileRow = {
  year_group?: string | null;
  display_name?: string | null;
};

function toYearKey(v?: string | null): YearKey | undefined {
  const s = (v || '').toLowerCase();
  if (s === 'foundation') return 'foundation';
  if (s === 'year1') return 'year1';
  if (s === 'year2') return 'year2';
  if (s === 'year3') return 'year3';
  return undefined;
}

export function useStudentProfile() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [yearKey, setYearKey] = useState<YearKey | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('year_group, display_name')
          .eq('id', user.id)
          .single<ProfileRow>();

        if (error) {
          // fail soft
          setLoading(false);
          return;
        }

        if (!cancelled) {
          // Fall back to user metadata year_group if profile missing
          const metaYear = toYearKey((user.user_metadata as any)?.year_group);
          setYearKey(toYearKey(data?.year_group) || metaYear);
          setDisplayName(data?.display_name ?? undefined);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [supabase]);

  return { loading, yearKey, displayName };
}
