import React, { useState } from 'react'
import { Module, ModuleProgress, SyllabusTopic } from '@/types/calendar'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { TopicItem } from './TopicItem'
import { ChevronDown, ChevronRight, BookOpen, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ModuleGroupProps {
  module: Module
  progress?: ModuleProgress
  topics?: SyllabusTopic[]
  onClick: () => void
  isExpanded: boolean
  onTopicStatusChange?: (topicId: string, status: 'not_started' | 'in_progress' | 'done') => void
  termNumber?: 1 | 2 | 3
}

export const ModuleGroup: React.FC<ModuleGroupProps> = ({
  module,
  progress,
  topics = [],
  onClick,
  isExpanded,
  onTopicStatusChange,
  termNumber = 1
}) => {
  const [showAllTopics, setShowAllTopics] = useState(false)

  const getModuleColorClasses = () => {
    if (termNumber === 1) return {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      accent: 'text-blue-600',
      progressBg: 'bg-blue-100',
      progressFill: 'bg-blue-500'
    }
    if (termNumber === 2) return {
      border: 'border-green-200', 
      bg: 'bg-green-50',
      accent: 'text-green-600',
      progressBg: 'bg-green-100',
      progressFill: 'bg-green-500'
    }
    return {
      border: 'border-purple-200',
      bg: 'bg-purple-50', 
      accent: 'text-purple-600',
      progressBg: 'bg-purple-100',
      progressFill: 'bg-purple-500'
    }
  }

  const colors = getModuleColorClasses()

  const getProgressStatus = () => {
    if (!progress) return { text: 'Not Started', color: 'text-gray-500' }
    
    if (progress.percentage === 0) return { text: 'Not Started', color: 'text-gray-500' }
    if (progress.percentage < 25) return { text: 'Getting Started', color: 'text-blue-600' }
    if (progress.percentage < 50) return { text: 'In Progress', color: 'text-orange-600' }
    if (progress.percentage < 75) return { text: 'Well Underway', color: 'text-yellow-600' }
    if (progress.percentage < 100) return { text: 'Nearly Complete', color: 'text-green-600' }
    return { text: 'Complete', color: 'text-green-700' }
  }

  const getUpcomingDeadlines = () => {
    if (!progress) return []
    return progress.upcoming_deadlines.slice(0, 2)
  }

  const getReadingLoad = (load: 'light' | 'medium' | 'heavy') => {
    switch (load) {
      case 'light': return { icon: '📖', color: 'text-green-600', bg: 'bg-green-100' }
      case 'medium': return { icon: '📚', color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'heavy': return { icon: '📜', color: 'text-red-600', bg: 'bg-red-100' }
    }
  }

  const progressStatus = getProgressStatus()
  const upcomingDeadlines = getUpcomingDeadlines()
  const visibleTopics = showAllTopics ? topics : topics.slice(0, 5)

  return (
    <Card className={`${colors.border} border-2 hover:shadow-lg transition-all duration-300`}>
      {/* Module Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gray-600" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-bold text-gray-900">{module.code}</h4>
                <Badge variant="secondary" size="sm">
                  {module.credits} credits
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{module.title}</p>
            </div>
          </div>

          <div className="text-right">
            {progress && (
              <>
                <div className={`text-2xl font-bold ${colors.accent}`}>
                  {Math.round(progress.percentage)}%
                </div>
                <div className="text-xs text-gray-500">
                  {progress.completed_topics} of {progress.total_topics} topics
                </div>
                <div className={`text-xs mt-1 ${progressStatus.color}`}>
                  {progressStatus.text}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mt-3">
            <ProgressBar 
              progress={progress.percentage} 
              color="purple"
              className="mt-1"
            />
          </div>
        )}

        {/* Quick Info */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Term {module.semester}</span>
            </div>
            
            {upcomingDeadlines.length > 0 && (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>{upcomingDeadlines.length} deadline{upcomingDeadlines.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {isExpanded ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`${colors.bg} border-t`}>
          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-orange-600" />
                Upcoming Deadlines
              </h5>
              <div className="space-y-2">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="text-sm font-medium text-orange-900">{deadline.title}</span>
                    <span className="text-xs text-orange-700">
                      {new Date((deadline as any).due_at || (deadline as any).date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics List */}
          {topics.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-800 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Syllabus Topics ({topics.length})
                </h5>
                
                {topics.length > 5 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllTopics(!showAllTopics)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAllTopics ? 'Show Less' : `Show All (${topics.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {visibleTopics.map((topic) => (
                  <TopicItem
                    key={topic.id}
                    topic={topic}
                    onStatusChange={onTopicStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Module Statistics */}
          {progress && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-bold ${colors.accent}`}>
                    {progress.completed_topics}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </div>
                </div>
                
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {progress.upcoming_deadlines.length}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Deadlines
                  </div>
                </div>
                
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    {progress.recent_activity.length}
                  </div>
                  <div className="text-xs text-gray-600">
                    Recent Activity
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}