import React from 'react'
import { ModuleProgress, Module } from '@/types/calendar'
import { Clock, MapPin, ChevronDown, ChevronRight } from 'lucide-react'

type TermData = {
  name: string
  start_date: string
  end_date: string
  modules: Module[]
  progress_percentage: number
}

export type SemesterColumnProps = {
  term: TermData
  termNumber: 1 | 2 | 3
  isExpanded: boolean
  onToggle: () => void
  isCurrentTerm: boolean
  progress: number
  moduleProgress: ModuleProgress[]
  onModuleClick: (moduleId: string) => void
  statusColor: string
  statusIcon: React.ReactNode
}

/** Lightweight column used by YearView to render a single term. */
export const SemesterColumn: React.FC<SemesterColumnProps> = ({
  term,
  termNumber,
  isExpanded,
  onToggle,
  isCurrentTerm,
  progress,
  moduleProgress,
  onModuleClick,
  statusColor,
  statusIcon,
}) => {
  const getTermColor = () => {
    switch (termNumber) {
      case 1: return 'from-blue-600 to-indigo-600' // Michaelmas
      case 2: return 'from-emerald-600 to-green-600' // Epiphany  
      case 3: return 'from-fuchsia-600 to-purple-600' // Easter
      default: return 'from-gray-600 to-gray-700'
    }
  }

  const getModuleProgressData = (moduleId: string) => {
    return moduleProgress.find(p => p.module_id === moduleId)?.percentage || 0
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border overflow-hidden ${
      isCurrentTerm ? 'ring-2 ring-purple-400 shadow-purple-100' : ''
    }`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTermColor()} text-white p-4`}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {statusIcon}
              <h3 className="text-lg font-semibold">{term.name}</h3>
            </div>
            {isCurrentTerm && (
              <div className="bg-white/20 text-xs font-medium px-2 py-1 rounded-full">
                Current
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
            {isExpanded ? 
              <ChevronDown className="w-5 h-5" /> : 
              <ChevronRight className="w-5 h-5" />
            }
          </div>
        </button>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 bg-white rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>

        {/* Term Summary */}
        <div className="mt-3 text-sm opacity-90">
          {term.modules.length} modules • {term.start_date} to {term.end_date}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Modules */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-3">Modules</div>
            {term.modules.length === 0 ? (
              <div className="text-sm text-gray-500">No modules scheduled for this term.</div>
            ) : (
              <div className="space-y-2">
                {term.modules.map((module) => {
                  const moduleProgressPct = getModuleProgressData(module.id)
                  return (
                    <button
                      key={module.id}
                      onClick={() => onModuleClick(module.id)}
                      className="w-full text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 p-3 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {module.code && (
                            <span className="text-purple-600 font-semibold">{module.code}</span>
                          )}
                          {module.code && module.title && <span className="text-gray-400 mx-2">·</span>}
                          {module.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {module.credits} credits
                        </div>
                      </div>
                      
                      {/* Module Progress */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {moduleProgressPct > 0 ? `${Math.round(moduleProgressPct)}% complete` : 'Not started'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, moduleProgressPct))}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SemesterColumn
