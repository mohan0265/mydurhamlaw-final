import React, { useMemo } from 'react'
import { BookOpen, ClipboardList, FileText, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type {
  ModulePlan,
  Assessment,
  TermBlock,
} from '@/data/durham/llb/academic_year_2025_26'

type Props = {
  termKey: 'michaelmas' | 'epiphany' | 'easter'
  title: string
  term: TermBlock
  modules: ModulePlan[]          // modules taught this term
  allModules: ModulePlan[]       // whole-year list (for exams/assessments lookup)
  onModuleClick?: (idOrTitle: string) => void
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
function overlapsWindow(
  win: { start: string; end: string },
  isoMonday: string,
) {
  const w = weekWindow(isoMonday)
  const s = asDate(win.start)
  const e = asDate(win.end)
  return !(e < w.start || s > w.end)
}

/** Label like "W3 · 20 Oct" */
function weekLabel(isoMonday: string, idx: number) {
  return `W${idx + 1} · ${formatDMmm(asDate(isoMonday))}`
}

/** Render a single compact assessment pill */
function AssessPill({
  a,
  moduleTitle,
}: {
  a: Assessment
  moduleTitle: string
}) {
  const base =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border'
  const ofType = (() => {
    if (a.type === 'Exam') return 'bg-red-50 text-red-700 border-red-200'
    if (a.type === 'Dissertation')
      return 'bg-amber-50 text-amber-800 border-amber-200'
    return 'bg-blue-50 text-blue-700 border-blue-200'
  })()

  const icon =
    a.type === 'Exam' ? (
      <Timer className="w-3 h-3" />
    ) : a.type === 'Dissertation' ? (
      <ClipboardList className="w-3 h-3" />
    ) : (
      <FileText className="w-3 h-3" />
    )

  const text =
    a.type === 'Exam'
      ? `${moduleTitle} • Exam`
      : a.type === 'Dissertation'
      ? `${moduleTitle} • Dissertation`
      : `${moduleTitle} • ${a.type}`

  return (
    <span className={`${base} ${ofType}`} title={text}>
      {icon}
      {text}
    </span>
  )
}

/** ----------------------------------------------------------------------- */
export default function SemesterColumn({
  termKey,
  title,
  term,
  modules,
  allModules,
  onModuleClick,
}: Props) {
  // Build a fast lookup of assessments to weeks
  const weekAssessments = useMemo(() => {
    // map of mondayISO -> list of { a, moduleTitle }
    const map: Record<string, Array<{ a: Assessment; moduleTitle: string }>> =
      {}

    // initialize all week keys
    term.weeks.forEach((wkISO) => {
      map[wkISO] = []
    })

    const scan = (m: ModulePlan) => {
      m.assessments.forEach((a) => {
        if ('window' in a) {
          // exam window — show in every overlapping week
          term.weeks.forEach((wkISO) => {
            if (overlapsWindow(a.window, wkISO)) {
              ;(map[wkISO] ||= []).push({ a, moduleTitle: m.title })
            }
          })
        } else {
          // single due date — show in the week containing the due date
          term.weeks.forEach((wkISO) => {
            const { start, end } = weekWindow(wkISO)
            if (betweenInclusive(asDate(a.due), start, end)) {
              ;(map[wkISO] ||= []).push({ a, moduleTitle: m.title })
            }
          })
        }
      })
    }

    // For Michaelmas/Epiphany: just scan modules passed in.
    // For Easter (revision), include *all modules* to capture exams windows.
    const list = termKey === 'easter' ? allModules : modules
    list.forEach(scan)
    return map
  }, [termKey, term.weeks, modules, allModules])

  return (
    <Card className="p-4 md:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Semester
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-gray-500">
            {formatDMmm(asDate(term.start))} – {formatDMmm(asDate(term.end))}
          </div>
        </div>
        <BookOpen className="w-5 h-5 text-purple-500" />
      </div>

      {/* Modules taught this term */}
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
          const pills = weekAssessments[wkISO] || []
          return (
            <div
              key={wkISO}
              className="rounded-lg border bg-white p-2 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-700">
                  {weekLabel(wkISO, idx)}
                </div>
                {pills.length > 0 && (
                  <div className="text-[10px] text-gray-500">
                    {pills.length} deadline{pills.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {pills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pills.map((p, i) => (
                    <AssessPill key={i} a={p.a} moduleTitle={p.moduleTitle} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
