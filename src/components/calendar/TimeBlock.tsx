import React, { useState } from 'react'
import { CalendarEvent, PersonalItem } from '@/types/calendar'
import { format } from 'date-fns'
import { MapPin, Clock, User, Book, AlertCircle, Edit3, Trash2 } from 'lucide-react'

interface TimeBlockProps {
  event: CalendarEvent | PersonalItem
  position: { top: number; height: number }
  colorClass: string
  onClick: () => void
  onUpdate?: (updates: Partial<CalendarEvent | PersonalItem>) => void
  isDraggable?: boolean
}

export const TimeBlock: React.FC<TimeBlockProps> = ({
  event,
  position,
  colorClass,
  onClick,
  onUpdate,
  isDraggable = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const startTime = new Date(event.start_at)
  const endTime = event.end_at ? new Date(event.end_at) : null

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggable) {
      setIsDragging(true)
      e.preventDefault()
    }
  }

  const handleClick = () => {
    if (!isDragging) {
      onClick()
    }
  }

  const getEventIcon = () => {
    if ('type' in event) {
      // CalendarEvent
      switch ((event as any).type) {
        case 'lecture': return <Book className="w-3 h-3" />
        case 'seminar': return <User className="w-3 h-3" />
        case 'tutorial': return <Edit3 className="w-3 h-3" />
        case 'exam': return <AlertCircle className="w-3 h-3" />
        case 'assessment': return <AlertCircle className="w-3 h-3" />
        default: return <Clock className="w-3 h-3" />
      }
    } else {
      // PersonalItem
      switch ((event as any).type) {
        case 'study': return <Book className="w-3 h-3" />
        case 'task': return <Edit3 className="w-3 h-3" />
        case 'appointment': return <User className="w-3 h-3" />
        case 'reminder': return <Clock className="w-3 h-3" />
        default: return <Clock className="w-3 h-3" />
      }
    }
  }

  const getEventType = () => {
    if ('type' in event) {
      return (event as any).type
    } else {
      return (event as any).type
    }
  }

  const isShortEvent = position.height < 60

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 z-10 ${colorClass} ${
        isDragging ? 'opacity-75 transform scale-105' : ''
      } ${isDraggable ? 'cursor-move' : 'cursor-pointer'}`}
      style={{
        top: `${position.top}px`,
        height: `${Math.max(position.height, 20)}px`
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${event.title} • ${format(startTime, 'h:mm a')}${endTime ? ` - ${format(endTime, 'h:mm a')}` : ''}`}
    >
      <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
        {/* Event Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-1 flex-1 min-w-0">
            {getEventIcon()}
            <div className="flex-1 min-w-0">
              <div className={`font-medium leading-tight ${isShortEvent ? 'text-xs' : 'text-sm'} truncate`}>
                {event.title}
              </div>
              
              {!isShortEvent && (
                <div className="text-xs opacity-90 mt-0.5">
                  {format(startTime, 'h:mm a')}
                  {endTime && ` - ${format(endTime, 'h:mm a')}`}
                </div>
              )}
            </div>
          </div>

          {/* Edit/Delete Actions (on hover for personal items) */}
          {isHovered && isDraggable && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Open edit modal
                }}
                className="p-1 hover:bg-white/20 rounded text-xs"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Delete item
                }}
                className="p-1 hover:bg-red-500/20 rounded text-xs"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Event Details */}
        {!isShortEvent && (
          <div className="mt-2 space-y-1">
            {(event as any).location && (
              <div className="flex items-center space-x-1 text-xs opacity-90">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{(event as any).location}</span>
              </div>
            )}

            {/* Event Type Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                {getEventType()}
              </span>

              {/* Priority indicator for personal items */}
              {!('type' in event) && 'priority' in event && (event as any).priority === 'high' && (
                <AlertCircle className="w-3 h-3 text-red-300" />
              )}
            </div>
          </div>
        )}

        {/* Fixed Event Indicator */}
        {'is_university_fixed' in event && event.is_university_fixed && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-white/40 rounded-full" title="University fixed time" />
          </div>
        )}

        {/* Drag Handle */}
        {isDraggable && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/30 rounded-r opacity-0 hover:opacity-100 transition-opacity duration-200" />
        )}
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-white/10 rounded-md pointer-events-none" />
      )}
    </div>
  )
}