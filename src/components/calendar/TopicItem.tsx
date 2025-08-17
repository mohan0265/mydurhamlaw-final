import React from 'react'
import { SyllabusTopic } from '@/types/calendar'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, Circle, Clock, BookOpen, User } from 'lucide-react'

interface TopicItemProps {
  topic: SyllabusTopic
  onStatusChange?: (topicId: string, status: 'not_started' | 'in_progress' | 'done') => void
}

export const TopicItem: React.FC<TopicItemProps> = ({
  topic,
  onStatusChange
}) => {
  const getReadingLoadIcon = (load: 'light' | 'medium' | 'heavy') => {
    switch (load) {
      case 'light': return { icon: '📖', label: 'Light Reading', color: 'bg-green-100 text-green-800' }
      case 'medium': return { icon: '📚', label: 'Moderate Reading', color: 'bg-orange-100 text-orange-800' }
      case 'heavy': return { icon: '📜', label: 'Heavy Reading', color: 'bg-red-100 text-red-800' }
    }
  }

  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'done') => {
    switch (status) {
      case 'done': 
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in_progress': 
        return <Clock className="w-5 h-5 text-orange-600" />
      default: 
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: 'not_started' | 'in_progress' | 'done') => {
    switch (status) {
      case 'done': return 'bg-green-50 border-green-200'
      case 'in_progress': return 'bg-orange-50 border-orange-200'
      default: return 'bg-white border-gray-200'
    }
  }

  const handleStatusClick = (newStatus: 'not_started' | 'in_progress' | 'done') => {
    if (onStatusChange) {
      onStatusChange(topic.id, newStatus)
    }
  }

  const readingLoad = getReadingLoadIcon(topic.estimated_reading_load)
  const currentStatus = topic.status || 'not_started'

  return (
    <div className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${getStatusColor(currentStatus)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Status Toggle */}
          <div className="flex flex-col space-y-1 pt-1">
            <button
              onClick={() => handleStatusClick(currentStatus === 'done' ? 'not_started' : 
                                             currentStatus === 'in_progress' ? 'done' : 'in_progress')}
              className="hover:scale-110 transition-transform duration-200"
              title={
                currentStatus === 'done' ? 'Mark as not started' :
                currentStatus === 'in_progress' ? 'Mark as complete' : 'Mark as in progress'
              }
            >
              {getStatusIcon(currentStatus)}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h6 className={`font-medium text-sm ${
                currentStatus === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {topic.title}
              </h6>
              
              {topic.week_number && (
                <Badge variant="secondary" size="sm" className="text-xs">
                  Week {topic.week_number}
                </Badge>
              )}
            </div>

            {topic.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {topic.description}
              </p>
            )}

            {/* Reading Load */}
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm">{readingLoad.icon}</span>
              <Badge size="sm" className={`${readingLoad.color} text-xs`}>
                {readingLoad.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1 ml-2">
          {currentStatus !== 'done' && (
            <div className="flex space-x-1">
              <button
                onClick={() => handleStatusClick('in_progress')}
                className={`p-1.5 rounded-md text-xs transition-colors duration-200 ${
                  currentStatus === 'in_progress' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'hover:bg-orange-100 text-gray-500 hover:text-orange-600'
                }`}
                title="Mark as in progress"
              >
                <Clock className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleStatusClick('done')}
                className="p-1.5 rounded-md text-xs hover:bg-green-100 text-gray-500 hover:text-green-600 transition-colors duration-200"
                title="Mark as complete"
              >
                <CheckCircle2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {currentStatus === 'done' && (
            <button
              onClick={() => handleStatusClick('not_started')}
              className="p-1.5 rounded-md text-xs hover:bg-gray-100 text-gray-500 hover:text-gray-600 transition-colors duration-200"
              title="Reset progress"
            >
              <Circle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {currentStatus === 'in_progress' && (
        <div className="mt-2 pt-2 border-t border-orange-200">
          <div className="flex items-center space-x-2 text-xs text-orange-700">
            <div className="flex-1 bg-orange-200 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full w-1/2"></div>
            </div>
            <span>In Progress</span>
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      {currentStatus === 'done' && (
        <div className="mt-2 pt-2 border-t border-green-200">
          <div className="flex items-center space-x-2 text-xs text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>Complete! Well done! 🎉</span>
          </div>
        </div>
      )}
    </div>
  )
}