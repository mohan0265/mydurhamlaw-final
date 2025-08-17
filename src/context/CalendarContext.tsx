// src/context/CalendarContext.tsx
import React, { createContext, useContext, useMemo, useState } from 'react'
import { addMonths, addWeeks } from 'date-fns'

type Ctx = {
  academicYear: string
  setAcademicYear: (y: string) => void
  anchorDate: Date
  setAnchorDate: (d: Date) => void
  nextMonth: () => void
  prevMonth: () => void
  nextWeek: () => void
  prevWeek: () => void
}

const CalendarCtx = createContext<Ctx | null>(null)

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [academicYear, setAcademicYear] = useState('2025/26')
  const [anchorISO] = useState<string>(() => new Date().toISOString())
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date(anchorISO))

  const value = useMemo<Ctx>(() => ({
    academicYear,
    setAcademicYear,
    anchorDate,
    setAnchorDate,
    nextMonth: () => setAnchorDate(d => addMonths(d, 1)),
    prevMonth: () => setAnchorDate(d => addMonths(d, -1)),
    nextWeek: () => setAnchorDate(d => addWeeks(d, 1)),
    prevWeek: () => setAnchorDate(d => addWeeks(d, -1)),
  }), [academicYear, anchorDate])

  return <CalendarCtx.Provider value={value}>{children}</CalendarCtx.Provider>
}

export function useCalendarCtx() {
  const ctx = useContext(CalendarCtx)
  if (!ctx) throw new Error('useCalendarCtx must be used inside CalendarProvider')
  return ctx
}
