import React from 'react'
import { format } from 'date-fns'

type Topic = {
  module_code?: string
  module_name?: string
  day?: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | string
  title?: string
  notes?: string
  location?: string
  start_time?: string // "09:00"
  end_time?: string   // "10:00"
  // any other fields are allowed
  [key: string]: any
}

type Props = {
  weekNo: number
  startISO: string
  endISO: string
  topics: Topic[]
}

/** Simple, dependency-free week details used by planner deep pages. */
const WeekDetails: React.FC<Props> = ({ weekNo, startISO, endISO, topics }) => {
  const startLabel = format(new Date(startISO), 'EEE, d MMM yyyy')
  const endLabel = format(new Date(endISO), 'EEE, d MMM yyyy')

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  const byDay: Record<string, Topic[]> = {}
  topics?.forEach((t) => {
    const d = (t.day || '').slice(0, 3)
    byDay[d] = byDay[d] || []
    byDay[d]!.push(t)
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm text-gray-600">Week {weekNo}</div>
        <div className="text-gray-900 font-medium">{startLabel} – {endLabel}</div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {days.map((d) => (
          <div key={d} className="rounded-xl border p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">{d}</div>
            {(byDay[d] || []).length === 0 && (
              <div className="text-sm text-gray-500">—</div>
            )}
            <div className="space-y-2">
              {(byDay[d] || []).map((t, i) => (
                <div key={i} className="rounded-lg border p-2">
                  <div className="text-sm font-medium text-gray-900">
                    {(t.module_code || t.module_name) ? `${t.module_code ?? ''} ${t.module_name ?? ''}`.trim() : 'Module'}
                  </div>
                  {t.title && <div className="text-sm text-gray-700">{t.title}</div>}
                  <div className="text-xs text-gray-600 mt-1">
                    {[t.location && `Location: ${t.location}`,
                      t.start_time && t.end_time && `Time: ${t.start_time} – ${t.end_time}`]
                      .filter(Boolean)
                      .join(' · ')
                    }
                  </div>
                  {t.notes && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{t.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeekDetails
