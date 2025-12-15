// src/lib/hooks/useCalendarData.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { fetchAuthed } from '@/lib/fetchAuthed';
import { waitForAccessToken } from '@/lib/auth/waitForAccessToken';

import {
  CalendarFilter,
  PersonalItem,
  YearOverview,
  MonthData,
  DayDetail,
  ModuleProgress,
  SyllabusTopicStatus,
  MultiYearData,
  YearNavigationState,
} from '@/types/calendar';

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getDefaultPlanByStudentYear } from '@/data/durham/llb';

interface UseCalendarDataProps {
  userId: string;
  programme?: string;
  yearOfStudy?: number;
  academicYear?: string;
}

export const useCalendarData = ({
  userId,
  programme = 'LLB',
  yearOfStudy = 1,
  academicYear = '2025/26',
}: UseCalendarDataProps) => {
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { token } = await waitForAccessToken();
      if (!cancelled) {
        setAuthReady(!!token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -- Year overview (single year)
  const {
    data: yearOverview,
    isLoading: yearLoading,
    error: yearError,
  } = useQuery<YearOverview>({
    queryKey: ['calendar', 'year', userId, programme, yearOfStudy, academicYear],
    enabled: !!userId && authReady,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const res = await fetchAuthed(
        `/api/calendar/year?programme=${programme}&year=${yearOfStudy}&academicYear=${academicYear}`,
      );
      if (!res.ok) throw new Error('Failed to fetch year overview');
      return res.json();
    },
  });

  // -- Multi-year data (for cross-year nav)
  const {
    data: multiYearData,
    isLoading: multiYearLoading,
    error: multiYearError,
  } = useQuery<MultiYearData>({
    queryKey: ['calendar', 'multiyear', userId, programme, academicYear],
    enabled: !!userId && authReady,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    queryFn: async () => {
      const res = await fetchAuthed(
        `/api/calendar/multi-year?programme=${programme}&academicYear=${academicYear}`,
      );
      if (!res.ok) throw new Error('Failed to fetch multi-year overview');
      return res.json();
    },
  });

  // -- Month data (factory hook)
  const fetchMonthData = useCallback(async (year: number, month: number): Promise<MonthData> => {
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const res = await fetchAuthed(`/api/calendar/month?from=${startDate}&to=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch month data');
    return res.json();
  }, []);

  const useMonthData = (year: number, month: number) =>
    useQuery<MonthData>({
    queryKey: ['calendar', 'month', userId, year, month],
    enabled: !!userId && !!year && !!month && authReady,
      staleTime: 2 * 60 * 1000,
      queryFn: () => fetchMonthData(year, month),
    });

  // -- Week data (factory hook)
  const fetchWeekData = useCallback(async (date: Date) => {
    const startDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const res = await fetchAuthed(`/api/calendar/week?from=${startDate}&to=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch week data');
    return res.json();
  }, []);

  const useWeekData = (date: Date) =>
    useQuery({
    queryKey: ['calendar', 'week', userId, format(date, 'yyyy-MM-dd')],
    enabled: !!userId && !!date && authReady,
      staleTime: 60 * 1000,
      queryFn: () => fetchWeekData(date),
    });

  // -- Day detail (factory hook)
  const fetchDayDetail = useCallback(async (date: string): Promise<DayDetail> => {
    const res = await fetchAuthed(`/api/calendar/day?date=${date}`);
    if (!res.ok) throw new Error('Failed to fetch day detail');
    return res.json();
  }, []);

  const useDayDetail = (date: string) =>
    useQuery<DayDetail>({
    queryKey: ['calendar', 'day', userId, date],
    enabled: !!userId && !!date && authReady,
      staleTime: 30 * 1000,
      queryFn: () => fetchDayDetail(date),
    });

  // -- Module progress
  const { data: moduleProgress, isLoading: progressLoading } = useQuery<ModuleProgress[]>({
    queryKey: ['calendar', 'progress', userId, programme, yearOfStudy],
    enabled: !!userId && authReady,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res = await fetchAuthed(`/api/calendar/progress?programme=${programme}&year=${yearOfStudy}`);
      if (!res.ok) throw new Error('Failed to fetch module progress');
      return res.json();
    },
  });

  // -- Personal items mutations
  const createPersonalItem = useMutation({
    mutationFn: async (item: Omit<PersonalItem, 'id' | 'user_id'>) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database connection unavailable');
      const { data, error } = await supabase
        .from('personal_items')
        .insert({ ...item, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const updatePersonalItem = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PersonalItem>;
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database connection unavailable');
      const { data, error } = await supabase
        .from('personal_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const deletePersonalItem = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database connection unavailable');
      const { error } = await supabase.from('personal_items').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  // -- Progress checks
  const updateTopicProgress = useMutation({
    mutationFn: async ({
      moduleId,
      topicId,
      status,
    }: {
      moduleId: string;
      topicId: string;
      status: SyllabusTopicStatus['status'];
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database connection unavailable');
      const { data, error } = await supabase
        .from('progress_checks')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          syllabus_topic_id: topicId,
          status,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  // -- Bulk refresh
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }, [queryClient]);

  // ✅ Inject term dates from the academic calendar
  const { termDates } = useAcademicCalendar(academicYear, yearOfStudy);

  return {
    // Data
    yearOverview,
    multiYearData,
    moduleProgress,

    // Loading
    yearLoading,
    multiYearLoading,
    progressLoading,

    // Errors
    yearError,
    multiYearError,

    // Query hooks
    useMonthData,
    useWeekData,
    useDayDetail,

    // Mutations
    createPersonalItem,
    updatePersonalItem,
    deletePersonalItem,
    updateTopicProgress,

    // Utils
    refreshAllData,

    // Academic calendar term boundaries
    termDates,
  };
};

// -- Filtering helpers
export const useCalendarFilter = () => {
  const [filter, setFilter] = useState<CalendarFilter>({
    modules: [],
    event_types: ['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'],
    date_range: {
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
    show_completed: true,
  });

  const updateFilter = useCallback((updates: Partial<CalendarFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter({
      modules: [],
      event_types: ['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'],
      date_range: {
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      },
      show_completed: true,
    });
  }, []);

  return { filter, updateFilter, resetFilter };
};

// -- Academic calendar helpers
export const useAcademicCalendar = (academicYear: string = '2025/26', yearOfStudy: number = 1) => {
  const [currentTerm, setCurrentTerm] = useState<1 | 2 | 3 | 'vacation'>(1);

  // Get term dates from the Durham dataset based on year of study
  const termDates = useMemo(() => {
    const normalizedYearGroup =
      yearOfStudy === 0 ? 'foundation' : (`year${yearOfStudy}` as 'foundation' | 'year1' | 'year2' | 'year3');
    const plan = getDefaultPlanByStudentYear(normalizedYearGroup);
    return {
      term1: { start: plan.termDates.michaelmas.start, end: plan.termDates.michaelmas.end },
      term2: { start: plan.termDates.epiphany.start, end: plan.termDates.epiphany.end },
      term3: { start: plan.termDates.easter.start, end: plan.termDates.easter.end },
      induction: plan.termDates.induction,
      exams: plan.termDates.exams,
    };
  }, [yearOfStudy]);

  useEffect(() => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    if (today >= termDates.term1.start && today <= termDates.term1.end) setCurrentTerm(1);
    else if (today >= termDates.term2.start && today <= termDates.term2.end) setCurrentTerm(2);
    else if (today >= termDates.term3.start && today <= termDates.term3.end) setCurrentTerm(3);
    else setCurrentTerm('vacation');
  }, [termDates]);

  const getTermProgress = useCallback(
    (term: 1 | 2 | 3) => {
      const now = new Date();
      const key = `term${term}` as const;
      const start = new Date(termDates[key].start);
      const end = new Date(termDates[key].end);
      if (now < start) return 0;
      if (now > end) return 100;
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    },
    [termDates],
  );

  return { currentTerm, termDates, getTermProgress, isInTerm: currentTerm !== 'vacation' };
};

// -- Year navigation state
export const useYearNavigation = (userYearOfStudy: number, multiYearData?: MultiYearData) => {
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(0);

  useEffect(() => {
    if (multiYearData && multiYearData.current_year_index !== undefined) {
      setSelectedYearIndex(multiYearData.current_year_index);
    }
  }, [multiYearData]);

  const yearLabels = useMemo(
    () => multiYearData?.year_labels || ['Foundation', 'Year 1', 'Year 2', 'Year 3'],
    [multiYearData?.year_labels],
  );
  const maxYearIndex = yearLabels.length - 1;

  const navigationState: YearNavigationState = {
    selectedYearIndex,
    currentUserYearIndex: multiYearData?.current_year_index || 0,
    availableYears: yearLabels,
    canNavigateNext: selectedYearIndex < maxYearIndex,
    canNavigatePrevious: selectedYearIndex > 0,
  };

  const navigateToYear = useCallback(
    (yearIndex: number) => {
      if (yearIndex >= 0 && yearIndex <= maxYearIndex) setSelectedYearIndex(yearIndex);
    },
    [maxYearIndex],
  );

  const navigatePrevious = useCallback(() => {
    if (navigationState.canNavigatePrevious) setSelectedYearIndex((p) => p - 1);
  }, [navigationState.canNavigatePrevious]);

  const navigateNext = useCallback(() => {
    if (navigationState.canNavigateNext) setSelectedYearIndex((p) => p + 1);
  }, [navigationState.canNavigateNext]);

  const resetToCurrentYear = useCallback(() => {
    if (multiYearData?.current_year_index !== undefined)
      setSelectedYearIndex(multiYearData.current_year_index);
  }, [multiYearData]);

  const getSelectedYearData = useCallback(() => {
    if (!multiYearData) return null;
    const yearKey = yearLabels[selectedYearIndex]?.toLowerCase().replace(' ', '');
    if (!yearKey) return null;
    return multiYearData.years[yearKey] || null;
  }, [multiYearData, selectedYearIndex, yearLabels]);

  const getCurrentYearLabel = useCallback(
    () => yearLabels[selectedYearIndex] || 'Unknown Year',
    [yearLabels, selectedYearIndex],
  );
  const getPreviousYearLabel = useCallback(
    () => (selectedYearIndex > 0 ? yearLabels[selectedYearIndex - 1] : null),
    [yearLabels, selectedYearIndex],
  );
  const getNextYearLabel = useCallback(
    () => (selectedYearIndex < maxYearIndex ? yearLabels[selectedYearIndex + 1] : null),
    [yearLabels, selectedYearIndex, maxYearIndex],
  );

  return {
    ...navigationState,
    navigateToYear,
    navigatePrevious,
    navigateNext,
    resetToCurrentYear,
    getSelectedYearData,
    getCurrentYearLabel,
    getPreviousYearLabel,
    getNextYearLabel,
    isViewingCurrentYear: selectedYearIndex === navigationState.currentUserYearIndex,
  };
};
