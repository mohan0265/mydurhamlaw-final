import React from 'react'
import { Module, ModuleProgress } from '@/types/calendar'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { ModuleGroup } from './ModuleGroup'
import { ChevronDown, ChevronRight, BookOpen, Clock, Target } from 'lucide-react'
import { format } from 'date-fns'

interface SemesterColumnProps {
  term: {
    name: string
    start_date: string
    end_date: string
    modules: Module[]
    progress_percentage: number
  }
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
  statusIcon
}) => {
  const getModuleProgress = (moduleId: string) => {
    return moduleProgress.find(p => p.module_id === moduleId)
  }

  const getTermStatusText = () => {
    if (progress === 0) return 'Not Started'
    if (progress < 25) return 'Just Beginning'
    if (progress < 50) return 'Getting Going'
    if (progress < 75) return 'Good Progress'
    if (progress < 100) return 'Nearly Complete'
    return 'Complete'
  }

  const getTermColorClasses = () => {
    if (termNumber === 1) return {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      header: 'bg-gradient-to-r from-blue-500 to-blue-600',
      accent: 'text-blue-600'
    }
    if (termNumber === 2) return {
      border: 'border-green-200', 
      bg: 'bg-green-50',
      header: 'bg-gradient-to-r from-green-500 to-green-600',
      accent: 'text-green-600'
    }
    return {
      border: 'border-purple-200',
      bg: 'bg-purple-50', 
      header: 'bg-gradient-to-r from-purple-500 to-purple-600',
      accent: 'text-purple-600'
    }
  }

  const colors = getTermColorClasses()

  return (
    <Card className={`${colors.border} ${isCurrentTerm ? 'ring-2 ring-yellow-300 shadow-xl' : 'shadow-md'} transition-all duration-300 hover:shadow-lg`}>
      {/* Header */}
      <div className={`${colors.header} text-white p-4 rounded-t-lg`}>
        <button
          onClick={onToggle}
          className="w-full text-left flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            {statusIcon}
            <div>
              <h3 className="text-lg font-bold">{term.name}</h3>
              <p className="text-sm text-white/80">
                {format(new Date(term.start_date), 'MMM d')} - {format(new Date(term.end_date), 'MMM d')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isCurrentTerm && (
              <Badge variant="warning" size="sm" className="bg-yellow-400 text-yellow-900">
                Current
              </Badge>
            )}
            {isExpanded ? 
              <ChevronDown className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" /> : 
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            }
          </div>
        </button>

        {/* Progress Summary */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Term Progress</span>
            <span className="text-sm font-bold">{Math.round(term.progress_percentage)}%</span>
          </div>
          <ProgressBar 
            progress={term.progress_percentage} 
            color="purple"
            className="bg-white/20"
          />
          <p className="text-xs text-white/70 mt-1">{getTermStatusText()}</p>
        </div>
      </div>

      {/* Content */}
      <div className={`${colors.bg} p-4`}>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className={`text-lg font-bold ${colors.accent}`}>
              {term.modules.length}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <BookOpen className="w-3 h-3 mr-1" />
              Modules
            </div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className={`text-lg font-bold ${colors.accent}`}>
              {moduleProgress.filter(m => term.modules.some(tm => tm.id === m.module_id) && m.percentage >= 75).length}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Target className="w-3 h-3 mr-1" />
              On Track
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="space-y-3">
          {isExpanded ? (
            term.modules.map((module) => {
              const moduleProgressData = getModuleProgress(module.id)
              return (
                <ModuleGroup
                  key={module.id}
                  module={module}
                  progress={moduleProgressData}
                  onClick={() => onModuleClick(module.id)}
                  isExpanded={false}
                  termNumber={termNumber}
                />
              )
            })
          ) : (
            <div className="space-y-2">
              {term.modules.slice(0, 3).map((module) => (
                <button
                  key={module.id}
                  onClick={() => onModuleClick(module.id)}
                  className="w-full text-left p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 hover:border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{module.code}</div>
                      <div className="text-xs text-gray-600 truncate">{module.title}</div>
                    </div>
                    <div className="text-right">
                      {getModuleProgress(module.id) && (
                        <>
                          <div className={`text-sm font-semibold ${colors.accent}`}>
                            {Math.round(getModuleProgress(module.id)!.percentage)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {getModuleProgress(module.id)!.completed_topics}/{getModuleProgress(module.id)!.total_topics}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {term.modules.length > 3 && (
                <button
                  onClick={onToggle}
                  className="w-full text-center p-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  +{term.modules.length - 3} more modules
                </button>
              )}
            </div>
          )}
        </div>

        {/* Call to Action */}
        {isCurrentTerm && term.progress_percentage < 100 && (
          <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-yellow-400">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Focus Area
                </p>
                <p className="text-xs text-yellow-700">
                  {term.progress_percentage < 25 
                    ? "Get started with your readings and attend all lectures"
                    : term.progress_percentage < 50
                    ? "Keep up with assignments and start exam prep"
                    : term.progress_percentage < 75  
                    ? "Focus on upcoming deadlines and revision"
                    : "Final push - complete remaining assessments"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}