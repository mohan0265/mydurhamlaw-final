import React, { useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, FileText, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type {
  ModulePlan,
  TermBlock,
} from '@/data/durham/llb/academic_year_2025_26'

type UserEvent = {
  id: string
  title: string
  start_at: string
  module_code: string | null
}

type UserAssessment = {
  id: string
  title: string
  due_at: string
  module_code: string | null
  assessment_type: string | null
}

type Props = {
  termKey: 'michaelmas' | 'epiphany' | 'easter'
  title: string
  term: TermBlock
  modules: ModulePlan[]          // PLAN layer: modules taught this term (structure only)
  allModules: ModulePlan[]       // PLAN layer: whole-year list (structure only)
  onModuleClick?: (idOrTitle: string) => void
  // NEW: Read-only mode for non-active years
  isReadOnly?: boolean
}

/** --- tiny date helpers (no date-fns needed) ------------------------------ */
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function asDate(iso: string) {
  // ISO like "2025-10-06"
  return new Date(iso + (iso.length <= 10 ? 'T00:00:00Z' : ''))
}
function formatDMmm(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function betweenInclusive(d: Date, a: Date, b: Date) {
  const x = d.getTime(), s = a.getTime(), e = b.getTime()
  return x >= s && x <= e
}
function weekWindow(isoMonday: string) {
  const start = asDate(isoMonday)
  const end = addDays(start, 6)
  return { start, end }
}

/** Label like "W3 · 20 Oct" */
function weekLabel(isoMonday: string, idx: number) {
  return `W${idx + 1} · ${formatDMmm(asDate(isoMonday))}`
}

/** ----------------------------------------------------------------------- */
export default function SemesterColumn({
  termKey,
  title,
  term,
  modules,
  allModules,
  onModuleClick,
  userEvents = [],
  userAssessments = [],
  isReadOnly = false,
}: Props) {
  // Map REAL assessments to weeks (NOT from PLAN - from user data only)
  const weekAssessments = useMemo(() => {
    const map: Record<string, UserAssessment[]> = {}

    // initialize all week keys
    term.weeks.forEach((wkISO) => {
      map[wkISO] = []
    })

    // Filter assessments by this term's date range and assign to weeks
    userAssessments.forEach((a) => {
      const dueDate = new Date(a.due_at)
      
      term.weeks.forEach((wkISO) => {
        const { start, end } = weekWindow(wkISO)
        if (betweenInclusive(dueDate, start, end)) {
          (map[wkISO] ||= []).push(a)
        }
      })
    })

    return map
  }, [term.weeks, userAssessments])

  // Map REAL events to weeks (for showing module presence)
  const weekEvents = useMemo(() => {
    const map: Record<string, UserEvent[]> = {}

    // initialize all week keys
    term.weeks.forEach((wkISO) => {
      map[wkISO] = []
    })

    // Filter events by this term's date range and assign to weeks
    userEvents.forEach((e) => {
      const eventDate = new Date(e.start_at)
      
      term.weeks.forEach((wkISO) => {
        const { start, end } = weekWindow(wkISO)
        if (betweenInclusive(eventDate, start, end)) {
          (map[wkISO] ||= []).push(e)
        }
      })
    })

    return map
  }, [term.weeks, userEvents])

  return (
    <Card className={`p-4 md:p-5 ${isReadOnly ? 'opacity-90' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Term
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-gray-500">
            {formatDMmm(asDate(term.start))} - {formatDMmm(asDate(term.end))}
          </div>
        </div>
        <BookOpen className="w-5 h-5 text-purple-500" />
      </div>

      {/* Modules taught this term (PLAN layer - structure only, NOT personal data) */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-1">
          Modules (this term)
        </div>
        {modules.length === 0 ? (
          <div className="text-xs text-gray-400">No modules listed.</div>
        ) : (
          <ul className="text-sm grid gap-1">
            {modules.map((m) => (
              <li key={m.title}>
                <button
                  type="button"
                  className="text-left hover:underline text-gray-900"
                  onClick={() => onModuleClick?.(m.title)}
                  title={`${m.title} • ${m.credits} credits`}
                >
                  • {m.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Weeks grid */}
      <div className="grid gap-2">
        {term.weeks.map((wkISO, idx) => {
          const weekAssigns = weekAssessments[wkISO] || []
          const weekEvts = weekEvents[wkISO] || []
          
          if (isReadOnly) {
            return (
              <div 
                key={wkISO}
                className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-2 cursor-not-allowed opacity-75"
                title="Detailed calendar is available for your current year of study."
              >
                 <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-500">
                    {weekLabel(wkISO, idx)}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={wkISO}
              href={`/year-at-a-glance/week?week=${wkISO}`}
              className="rounded-lg border bg-white p-2 hover:bg-gray-50 transition cursor-pointer block"
              title={`Click to view week details`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-700">
                  {weekLabel(wkISO, idx)}
                </div>
                {weekAssigns.length > 0 && (
                  <div className="text-[10px] text-red-600 font-medium">
                    {weekAssigns.length} deadline{weekAssigns.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Show REAL events count if any */}
              {weekEvts.length > 0 && (
                <div className="text-[10px] text-blue-600 mt-1">
                  {weekEvts.length} event{weekEvts.length > 1 ? 's' : ''}
                </div>
              )}

              {/* Show REAL assessments as clickable items */}
              {weekAssigns.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {weekAssigns.map((a) => {
                    const isExam = a.assessment_type === 'exam'
                    return (
                      <div
                        key={a.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/assignments?open=${a.id}`;
                        }}
                        className="block p-2 rounded bg-red-50 border border-red-100 hover:bg-red-100 transition group cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          {isExam ? (
                            <Timer className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FileText className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-red-900 truncate">
                              {a.title}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              {a.module_code && (
                                <div className="text-[10px] text-red-700">{a.module_code}</div>
                              )}
                              <div className="text-[10px] text-red-600 ml-auto">
                                {formatDMmm(new Date(a.due_at))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
