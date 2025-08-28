import React from 'react'
import { CalendarEvent } from '@/types/calendar'
import { Clock, MapPin } from 'lucide-react'

type ModuleLike = {
  id?: string
  code?: string
  title?: string
  credits?: number
}

export type SemesterColumnProps = {
  termKey: 'michaelmas' | 'epiphany' | 'easter'
  title: string
  // List of modules happening in this term
  modules?: ModuleLike[]
  // Events (lectures/deadlines) that fall inside this term window
  events?: CalendarEvent[]
  // Optional progress by module id/code (0–100)
  progressByModule?: Record<string, number>
  onModuleClick?: (moduleIdOrCode: string) => void
  onEventClick?: (eventId: string) => void
}

/** Lightweight column used by YearView to render a single term. */
export const SemesterColumn: React.FC<SemesterColumnProps> = ({
  termKey,
  title,
  modules = [],
  events = [],
  progressByModule = {},
  onModuleClick,
  onEventClick,
}) => {
  const color =
    termKey === 'michaelmas'
      ? 'from-blue-600 to-indigo-600'
      : termKey === 'epiphany'
      ? 'from-emerald-600 to-green-600'
      : 'from-fuchsia-600 to-purple-600'

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${color} text-white p-4`}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-xs opacity-90">{modules.length} modules</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Modules */}
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">Modules</div>
          {modules.length === 0 && (
            <div className="text-sm text-gray-500">No modules listed for this term.</div>
          )}
          <div className="space-y-2">
            {modules.map((m, i) => {
              const key = m.id || m.code || String(i)
              const pct = progressByModule[m.id || m.code || ''] ?? undefined
              return (
                <button
                  key={key}
                  onClick={() => (onModuleClick ? onModuleClick(m.id || m.code || '') : void 0)}
                  className="w-full text-left rounded-lg border hover:border-gray-300 p-3 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">
                      {m.code ? `${m.code} · ` : ''}
                      {m.title || 'Untitled module'}
                    </div>
                    {typeof pct === 'number' && (
                      <div className="text-xs text-gray-600">{Math.round(pct)}%</div>
                    )}
                  </div>
                  {typeof pct === 'number' && (
                    <div className="h-1.5 bg-gray-100 rounded mt-2">
                      <div
                        className="h-1.5 rounded bg-gray-900/80"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Events */}
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">Upcoming</div>
          {events.length === 0 && (
            <div className="text-sm text-gray-500">No scheduled items yet.</div>
          )}
          <div className="space-y-2">
            {events.slice(0, 8).map((e) => (
              <div
                key={e.id}
                onClick={() => (onEventClick ? onEventClick(e.id) : void 0)}
                className="rounded-lg border p-3 hover:bg-gray-50 cursor-pointer"
              >
                <div className="font-medium text-gray-900 truncate">{e.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(e.start_at).toLocaleString()}
                  </span>
                  {e.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {e.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SemesterColumn
