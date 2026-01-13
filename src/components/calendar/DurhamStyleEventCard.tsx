// src/components/calendar/DurhamStyleEventCard.tsx
// Event card component matching Durham University MyTimetable UX
// With vibrant MyDurhamLaw branding

import React from 'react';
import { 
  Monitor, 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  MapPin, 
  User,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export type EventType = 'lecture' | 'seminar' | 'tutorial' | 'assessment' | 'deadline' | 'personal' | 'other';

export interface DurhamEventCardProps {
  id: string;
  title: string;
  moduleCode?: string;
  time?: string;      // e.g. "15:00 - 16:00"
  startTime?: string; // e.g. "15:00"
  endTime?: string;   // e.g. "16:00"
  location?: string;  // e.g. "D/TLC042"
  lecturer?: string;  // e.g. "Professor Kim Bouwer"
  type: EventType;
  isAllDay?: boolean;
  source?: 'timetable' | 'assignment' | 'personal' | 'plan';
  dueTime?: string;   // For assignments
  submissionUrl?: string; // For "Submit on Blackboard" link
  onClick?: () => void;
  compact?: boolean;
}

// Event type icon mapping
function getEventIcon(type: EventType) {
  switch (type) {
    case 'lecture':    return <Monitor className="w-5 h-5" />;
    case 'seminar':    return <Users className="w-5 h-5" />;
    case 'tutorial':   return <BookOpen className="w-5 h-5" />;
    case 'assessment': return <FileText className="w-5 h-5" />;
    case 'deadline':   return <AlertCircle className="w-5 h-5" />;
    case 'personal':   return <CheckCircle2 className="w-5 h-5" />;
    default:           return <Calendar className="w-5 h-5" />;
  }
}

// Event type label
function getEventLabel(type: EventType): string {
  switch (type) {
    case 'lecture':    return 'Lecture';
    case 'seminar':    return 'Seminar';
    case 'tutorial':   return 'Tutorial';
    case 'assessment': return 'Assessment';
    case 'deadline':   return 'Due';
    case 'personal':   return 'Personal';
    default:           return 'Event';
  }
}

// Vibrant color scheme for MyDurhamLaw branding
function getEventStyles(type: EventType, source?: string): { border: string; icon: string; bg: string } {
  // Assignment/deadline - warm orange
  if (source === 'assignment' || type === 'deadline' || type === 'assessment') {
    return {
      border: 'border-l-4 border-l-orange-500',
      icon: 'text-orange-600 bg-orange-50',
      bg: 'bg-white hover:bg-orange-50/50'
    };
  }
  
  // Personal items - emerald green
  if (source === 'personal' || type === 'personal') {
    return {
      border: 'border-l-4 border-l-emerald-500',
      icon: 'text-emerald-600 bg-emerald-50',
      bg: 'bg-white hover:bg-emerald-50/50'
    };
  }
  
  // Lectures - vibrant purple (MyDurhamLaw brand)
  if (type === 'lecture') {
    return {
      border: 'border-l-4 border-l-purple-500',
      icon: 'text-purple-600 bg-purple-50',
      bg: 'bg-white hover:bg-purple-50/50'
    };
  }
  
  // Seminars - teal
  if (type === 'seminar') {
    return {
      border: 'border-l-4 border-l-teal-500',
      icon: 'text-teal-600 bg-teal-50',
      bg: 'bg-white hover:bg-teal-50/50'
    };
  }
  
  // Tutorials - blue
  if (type === 'tutorial') {
    return {
      border: 'border-l-4 border-l-blue-500',
      icon: 'text-blue-600 bg-blue-50',
      bg: 'bg-white hover:bg-blue-50/50'
    };
  }
  
  // Default - gray
  return {
    border: 'border-l-4 border-l-gray-400',
    icon: 'text-gray-600 bg-gray-50',
    bg: 'bg-white hover:bg-gray-50'
  };
}

// Format time display
function formatTimeRange(startTime?: string, endTime?: string, time?: string): string | null {
  if (time) return time;
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  return null;
}

export const DurhamStyleEventCard: React.FC<DurhamEventCardProps> = ({
  id,
  title,
  moduleCode,
  time,
  startTime,
  endTime,
  location,
  lecturer,
  type,
  isAllDay,
  source,
  dueTime,
  submissionUrl,
  onClick,
  compact = false
}) => {
  const styles = getEventStyles(type, source);
  const Icon = getEventIcon(type);
  const timeDisplay = formatTimeRange(startTime, endTime, time);
  const typeLabel = getEventLabel(type);

  if (compact) {
    // Compact version for month grid cells
    return (
      <button
        onClick={onClick}
        className={`
          w-full text-left rounded-lg p-2 transition-all duration-200
          border shadow-sm ${styles.border} ${styles.bg}
          hover:shadow-md hover:scale-[1.01]
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${styles.icon}`}>
            {Icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {moduleCode || title}
            </div>
            {timeDisplay && (
              <div className="text-[10px] text-gray-500 font-mono">
                {timeDisplay}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Full card version (matching MyTimetable layout)
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border shadow-sm transition-all duration-200
        ${styles.border} ${styles.bg}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.005]' : ''}
      `}
    >
      <div className="flex">
        {/* Left section: Type + Time */}
        <div className={`
          flex flex-col items-center justify-center px-4 py-4 
          min-w-[110px] border-r border-gray-100
          ${styles.icon.replace('bg-', 'bg-').replace('/50', '')}
        `}>
          <div className={`p-2 rounded-lg ${styles.icon}`}>
            {Icon}
          </div>
          <div className="mt-2 text-sm font-semibold text-center">
            {typeLabel}
          </div>
          {timeDisplay && (
            <div className="mt-1 text-xs text-gray-600 font-mono text-center">
              {timeDisplay}
            </div>
          )}
          {isAllDay && (
            <div className="mt-1 text-xs text-gray-500">
              All Day
            </div>
          )}
          {dueTime && (
            <div className="mt-1 text-xs text-orange-600 font-medium">
              Due: {dueTime}
            </div>
          )}
        </div>

        {/* Right section: Details */}
        <div className="flex-1 p-4">
          {/* Module code and title */}
          <div className="mb-2">
            {moduleCode && (
              <span className="text-sm font-bold text-gray-900 mr-2">
                {moduleCode}
              </span>
            )}
            <span className={`text-sm ${moduleCode ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
              {moduleCode ? `- ${title}` : title}
            </span>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{location}</span>
            </div>
          )}

          {/* Lecturer */}
          {lecturer && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <User className="w-4 h-4 text-gray-400" />
              <span>{lecturer}</span>
            </div>
          )}

          {/* Submit on Blackboard button */}
          {submissionUrl && (
            <a
              href={submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="
                inline-flex items-center gap-2 mt-3 px-3 py-1.5
                bg-gray-900 text-white text-xs font-medium rounded-lg
                hover:bg-gray-800 transition-colors
              "
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Submit on Blackboard
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DurhamStyleEventCard;
