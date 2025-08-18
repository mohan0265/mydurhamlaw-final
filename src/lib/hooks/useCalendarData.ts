import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { 
  CalendarData, 
  CalendarFilter, 
  PersonalItem, 
  YearOverview, 
  MonthData, 
  DayDetail,
  ModuleProgress,
  SyllabusTopicStatus,
  MultiYearData,
  YearNavigationState 
} from '@/types/calendar'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface UseCalendarDataProps {
  userId: string
  programme?: string
  yearOfStudy?: number
  academicYear?: string
}

export const useCalendarData = ({ 
  userId, 
  programme = 'LLB', 
  yearOfStudy = 1, 
  academicYear = '2025/26' 
}: UseCalendarDataProps) => {
  const queryClient = useQueryClient()

  // Fetch year overview data (single year)
  const {
    data: yearOverview,
    isLoading: yearLoading,
    error: yearError
  } = useQuery(
    ['calendar', 'year', userId, programme, yearOfStudy, academicYear],
    async (): Promise<YearOverview> => {
      const response = await fetch(`/api/calendar/year?programme=${programme}&year=${yearOfStudy}&academicYear=${academicYear}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch year overview')
      return response.json()
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Fetch multi-year data for year navigation
  const {
    data: multiYearData,
    isLoading: multiYearLoading,
    error: multiYearError
  } = useQuery(
    ['calendar', 'multiyear', userId, programme, academicYear],
    async (): Promise<MultiYearData> => {
      const response = await fetch(`/api/calendar/multi-year?programme=${programme}&academicYear=${academicYear}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch multi-year overview')
      return response.json()
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 20 * 60 * 1000, // 20 minutes
    }
  )

  // Fetch month data
  const fetchMonthData = useCallback(async (year: number, month: number): Promise<MonthData> => {
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
    
    const response = await fetch(`/api/calendar/month?from=${startDate}&to=${endDate}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch month data')
    return response.json()
  }, [])

  const useMonthData = (year: number, month: number) => {
    return useQuery(
      ['calendar', 'month', userId, year, month],
      () => fetchMonthData(year, month),
      {
        enabled: !!userId && !!year && !!month,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    )
  }

  // Fetch week data
  const fetchWeekData = useCallback(async (date: Date) => {
    const startDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const endDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    
    const response = await fetch(`/api/calendar/week?from=${startDate}&to=${endDate}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch week data')
    return response.json()
  }, [])

  const useWeekData = (date: Date) => {
    return useQuery(
      ['calendar', 'week', userId, format(date, 'yyyy-MM-dd')],
      () => fetchWeekData(date),
      {
        enabled: !!userId && !!date,
        staleTime: 1 * 60 * 1000, // 1 minute
      }
    )
  }

  // Fetch day details
  const fetchDayDetail = useCallback(async (date: string): Promise<DayDetail> => {
    const response = await fetch(`/api/calendar/day?date=${date}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch day detail')
    return response.json()
  }, [])

  const useDayDetail = (date: string) => {
    return useQuery(
      ['calendar', 'day', userId, date],
      () => fetchDayDetail(date),
      {
        enabled: !!userId && !!date,
        staleTime: 30 * 1000, // 30 seconds
      }
    )
  }

  // Fetch module progress
  const {
    data: moduleProgress,
    isLoading: progressLoading
  } = useQuery(
    ['calendar', 'progress', userId, programme, yearOfStudy],
    async (): Promise<ModuleProgress[]> => {
      const response = await fetch(`/api/calendar/progress?programme=${programme}&year=${yearOfStudy}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch module progress')
      return response.json()
    },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000,
    }
  )

  // Personal items mutations
  const createPersonalItem = useMutation(
    async (item: Omit<PersonalItem, 'id' | 'user_id'>) => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { data, error } = await supabase
        .from('personal_items')
        .insert({
          ...item,
          user_id: userId
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      }
    }
  )

  const updatePersonalItem = useMutation(
    async ({ id, updates }: { id: string; updates: Partial<PersonalItem> }) => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { data, error } = await supabase
        .from('personal_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      }
    }
  )

  const deletePersonalItem = useMutation(
    async (id: string) => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { error } = await supabase
        .from('personal_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      
      if (error) throw error
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      }
    }
  )

  // Progress tracking mutations
  const updateTopicProgress = useMutation(
    async ({ 
      moduleId, 
      topicId, 
      status 
    }: { 
      moduleId: string; 
      topicId: string; 
      status: SyllabusTopicStatus['status'] 
    }) => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }

      const { data, error } = await supabase
        .from('progress_checks')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          syllabus_topic_id: topicId,
          status,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['calendar'])
      }
    }
  )

  // Bulk data refresh
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries(['calendar'])
  }, [queryClient])

  return {
    // Data
    yearOverview,
    multiYearData,
    moduleProgress,
    
    // Loading states
    yearLoading,
    multiYearLoading,
    progressLoading,
    
    // Errors
    yearError,
    multiYearError,
    
    // Query hooks for components
    useMonthData,
    useWeekData,
    useDayDetail,
    
    // Mutations
    createPersonalItem,
    updatePersonalItem,
    deletePersonalItem,
    updateTopicProgress,
    
    // Utilities
    refreshAllData
  }
}

// Utility hook for filtering calendar data
export const useCalendarFilter = () => {
  const [filter, setFilter] = useState<CalendarFilter>({
    modules: [],
    event_types: ['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'],
    date_range: {
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    },
    show_completed: true
  })

  const updateFilter = useCallback((updates: Partial<CalendarFilter>) => {
    setFilter(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const resetFilter = useCallback(() => {
    setFilter({
      modules: [],
      event_types: ['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'],
      date_range: {
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      },
      show_completed: true
    })
  }, [])

  return {
    filter,
    updateFilter,
    resetFilter
  }
}

// Helper hook for academic calendar calculations
export const useAcademicCalendar = (academicYear: string = '2025/26') => {
  const [currentTerm, setCurrentTerm] = useState<1 | 2 | 3 | 'vacation'>(1)
  const [termDates, setTermDates] = useState({
    term1: { start: '2025-10-07', end: '2025-12-06' },
    term2: { start: '2026-01-13', end: '2026-03-14' },
    term3: { start: '2026-04-26', end: '2026-06-17' }
  })

  useEffect(() => {
    const now = new Date()
    const currentDateStr = format(now, 'yyyy-MM-dd')
    
    if (currentDateStr >= termDates.term1.start && currentDateStr <= termDates.term1.end) {
      setCurrentTerm(1)
    } else if (currentDateStr >= termDates.term2.start && currentDateStr <= termDates.term2.end) {
      setCurrentTerm(2)
    } else if (currentDateStr >= termDates.term3.start && currentDateStr <= termDates.term3.end) {
      setCurrentTerm(3)
    } else {
      setCurrentTerm('vacation')
    }
  }, [termDates])

  const getTermProgress = useCallback((term: 1 | 2 | 3) => {
    const now = new Date()
    const termKey = `term${term}` as keyof typeof termDates
    const start = new Date(termDates[termKey].start)
    const end = new Date(termDates[termKey].end)
    
    if (now < start) return 0
    if (now > end) return 100
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))
  }, [termDates])

  return {
    currentTerm,
    termDates,
    getTermProgress,
    isInTerm: currentTerm !== 'vacation'
  }
}

// Hook for year navigation state management
export const useYearNavigation = (userYearOfStudy: number, multiYearData?: MultiYearData) => {
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(0)

  // Initialize with user's current year when data loads
  useEffect(() => {
    if (multiYearData && multiYearData.current_year_index !== undefined) {
      setSelectedYearIndex(multiYearData.current_year_index)
    }
  }, [multiYearData])

  const yearLabels = useMemo(() => 
    multiYearData?.year_labels || ['Foundation', 'Year 1', 'Year 2', 'Year 3'], 
    [multiYearData?.year_labels]
  )
  const maxYearIndex = yearLabels.length - 1

  const navigationState: YearNavigationState = {
    selectedYearIndex,
    currentUserYearIndex: multiYearData?.current_year_index || 0,
    availableYears: yearLabels,
    canNavigateNext: selectedYearIndex < maxYearIndex,
    canNavigatePrevious: selectedYearIndex > 0
  }

  const navigateToYear = useCallback((yearIndex: number) => {
    if (yearIndex >= 0 && yearIndex <= maxYearIndex) {
      setSelectedYearIndex(yearIndex)
    }
  }, [maxYearIndex])

  const navigatePrevious = useCallback(() => {
    if (navigationState.canNavigatePrevious) {
      setSelectedYearIndex(prev => prev - 1)
    }
  }, [navigationState.canNavigatePrevious])

  const navigateNext = useCallback(() => {
    if (navigationState.canNavigateNext) {
      setSelectedYearIndex(prev => prev + 1)
    }
  }, [navigationState.canNavigateNext])

  const resetToCurrentYear = useCallback(() => {
    if (multiYearData?.current_year_index !== undefined) {
      setSelectedYearIndex(multiYearData.current_year_index)
    }
  }, [multiYearData])

  const getSelectedYearData = useCallback(() => {
    if (!multiYearData) return null
    const yearKey = yearLabels[selectedYearIndex]?.toLowerCase().replace(' ', '')
    if (!yearKey) return null
    return multiYearData.years[yearKey] || null
  }, [multiYearData, selectedYearIndex, yearLabels])

  const getCurrentYearLabel = useCallback(() => {
    return yearLabels[selectedYearIndex] || 'Unknown Year'
  }, [yearLabels, selectedYearIndex])

  const getPreviousYearLabel = useCallback(() => {
    return selectedYearIndex > 0 ? yearLabels[selectedYearIndex - 1] : null
  }, [yearLabels, selectedYearIndex])

  const getNextYearLabel = useCallback(() => {
    return selectedYearIndex < maxYearIndex ? yearLabels[selectedYearIndex + 1] : null
  }, [yearLabels, selectedYearIndex, maxYearIndex])

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
    isViewingCurrentYear: selectedYearIndex === navigationState.currentUserYearIndex
  }
}