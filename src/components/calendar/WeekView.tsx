"use client";

import React, { useState, useRef } from "react";
import { CalendarEvent, PersonalItem } from "@/types/calendar";
import {
  format,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
  addHours,
  differenceInMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TimeBlock } from "./TimeBlock";

// Helper functions for date operations to avoid external dependencies
const parseISOSafe = (s: string): Date => {
  try {
    return new Date(s)
  } catch {
    return new Date()
  }
}

const daysInInterval = (start: Date, end: Date): Date[] => {
  const out: Date[] = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  while (d.getTime() <= last.getTime()) {
    out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

// Type guard so TS can narrow CalendarEvent vs PersonalItem
function isCalendarEvent(
  e: CalendarEvent | PersonalItem
): e is CalendarEvent {
  const t = (e as any).type;
  return (
    t === "lecture" ||
    t === "seminar" ||
    t === "tutorial" ||
    t === "exam" ||
    t === "assessment" ||
    t === "personal"
  );
}

type UpdatePayload = Partial<CalendarEvent> | Partial<PersonalItem>;

interface WeekViewProps {
  weekData: {
    events: CalendarEvent[];
    personal_items: PersonalItem[];
  };
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (startTime: string, endTime: string) => void;
  onUpdateEvent: (eventId: string, updates: UpdatePayload) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekData,
  currentDate,
  onDateChange,
  onEventClick,
  onCreateEvent,
  onUpdateEvent,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [currentTime] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = daysInInterval(weekStart, weekEnd);

  const hours: number[] = Array.from({ length: 15 }, (_, i) => i + 7); // 7 → 21

  const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1));
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1));
  const handleTodayClick = () => onDateChange(new Date());

  const getEventPosition = (event: CalendarEvent | PersonalItem) => {
    const startTime = parseISOSafe(event.start_at)
    const endTime = event.end_at ? parseISOSafe(event.end_at) : addHours(startTime, 1)

    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const duration = differenceInMinutes(endTime, startTime) / 60

    const top = Math.max(0, (startHour - 7) * 80) // 80px / hr, from 7am
    const height = Math.max(20, duration * 80)
    return { top, height }
  }

  const getEventsByDay = (dayDate: Date) => {
    const dayEvents = weekData.events.filter((e) => isSameDay(parseISOSafe(e.start_at), dayDate))
    const dayPersonal = weekData.personal_items.filter((p) => isSameDay(parseISOSafe(p.start_at), dayDate))
    return [...dayEvents, ...dayPersonal].sort(
      (a, b) => parseISOSafe(a.start_at).getTime() - parseISOSafe(b.start_at).getTime()
    )
  }

  const getEventColor = (event: CalendarEvent | PersonalItem) => {
    if (isCalendarEvent(event)) {
      switch (event.type) {
        case "lecture": return "bg-blue-500 border-blue-600 text-white";
        case "seminar": return "bg-green-500 border-green-600 text-white";
        case "tutorial": return "bg-purple-500 border-purple-600 text-white";
        case "exam": return "bg-red-500 border-red-600 text-white";
        case "assessment": return "bg-orange-500 border-orange-600 text-white";
        case "personal": return "bg-gray-500 border-gray-600 text-white";
        default:        return "bg-gray-500 border-gray-600 text-white";
      }
    } else {
      switch (event.type) {
        case "study":       return "bg-indigo-400 border-indigo-500 text-white";
        case "task":        return "bg-teal-400 border-teal-500 text-white";
        case "appointment": return "bg-pink-400 border-pink-500 text-white";
        case "reminder":    return "bg-yellow-400 border-yellow-500 text-gray-900";
        default:            return "bg-gray-400 border-gray-500 text-white";
      }
    }
  };

  const handleMouseDown = (dayIndex: number, hour: number, e: React.MouseEvent) => {
    if (e.button === 0) {
      setDragStart({ day: dayIndex, hour });
      setIsCreating(true);
    }
  };

  const handleMouseUp = (dayIndex: number, hour: number) => {
    if (isCreating && dragStart) {
      const startDay = Math.min(dragStart.day, dayIndex);
      const endDay = Math.max(dragStart.day, dayIndex);
      const startHour = Math.min(dragStart.hour, hour);
      const endHour = Math.max(dragStart.hour, hour) + 1;

      if (startDay === endDay) {
        const selectedDay = weekDays[startDay];
        if (selectedDay) {
          const startTime = new Date(selectedDay);
          startTime.setHours(startHour, 0, 0, 0);
          const endTime = new Date(selectedDay);
          endTime.setHours(endHour, 0, 0, 0);
          onCreateEvent(startTime.toISOString(), endTime.toISOString());
        }
      }

      setIsCreating(false);
      setDragStart(null);
    }
  };

  const getCurrentTimeIndicator = () => {
    const now = new Date();
    const todayIndex = weekDays.findIndex((day) => isSameDay(day, now));
    if (todayIndex === -1) return null;

    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < 7 || currentHour > 21) return null;

    const top = (currentHour - 7) * 80;
    const left = `${(todayIndex * 100) / 7}%`;
    const width = `${100 / 7}%`;

    return (
      <div className="absolute z-30 pointer-events-none" style={{ top: `${top}px`, left, width }}>
        <div className="h-0.5 bg-red-500 relative">
          <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </h2>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTodayClick}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10"
            >
              Today
            </Button>
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Summary */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {weekData.events.filter((e) => ["lecture", "seminar", "tutorial"].includes(e.type)).length}
            </div>
            <div className="text-purple-200">Classes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {weekData.events.filter((e) => e.type === "exam").length +
                weekData.events.filter((e) => e.type === "assessment").length}
            </div>
            <div className="text-purple-200">Deadlines</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {weekData.personal_items.filter((p) => p.type === "study").length}
            </div>
            <div className="text-purple-200">Study Blocks</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="font-semibold">
              {Math.round(
                weekData.personal_items
                  .filter((p) => p.type === "study")
                  .reduce((acc, item) => {
                    if (!item.end_at) return acc + 60
                    const duration = differenceInMinutes(parseISOSafe(item.end_at), parseISOSafe(item.start_at))
                    return acc + duration
                  }, 0) / 60
              )}
              h
            </div>
            <div className="text-purple-200">Study Time</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-auto max-h-screen">
        <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-0">
            <div className="p-4 text-sm font-medium text-gray-600 border-r border-gray-200">
              <Clock className="w-4 h-4" />
            </div>
            {weekDays.map((day: Date, index: number) => {
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-gray-200 ${
                    today ? "bg-blue-50 text-blue-600" : "text-gray-900"
                  }`}
                >
                  <div className="text-sm font-medium">{format(day, "EEE")}</div>
                  <div className={`text-lg font-bold ${today ? "text-blue-600" : ""}`}>{format(day, "d")}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div
          ref={gridRef}
          className="relative"
          onMouseLeave={() => {
            if (isCreating) {
              setIsCreating(false);
              setDragStart(null);
            }
          }}
        >
          <div className="grid grid-cols-8 gap-0">
            {/* Hour Labels */}
            <div>
              {hours.map((hour: number) => (
                <div key={hour} className="h-20 border-r border-gray-200 flex items-start justify-end pr-2 pt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day: Date, dayIndex: number) => (
              <div key={dayIndex} className="relative border-r border-gray-200">
                {/* Hour Cells */}
                {hours.map((hour: number) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="h-20 border-b border-gray-100 hover:bg-blue-50 cursor-crosshair transition-colors duration-150"
                    onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
                    onMouseUp={() => handleMouseUp(dayIndex, hour)}
                  />
                ))}

                {/* Events for this day */}
                {getEventsByDay(day).map((event) => {
                  const position = getEventPosition(event);
                  const colorClass = getEventColor(event);

                  return (
                    <TimeBlock
                      key={event.id}
                      event={event}
                      position={position}
                      colorClass={colorClass}
                      onClick={() => onEventClick(event as CalendarEvent)}
                      onUpdate={(updates) => onUpdateEvent(event.id, updates)}
                      isDraggable={!("is_university_fixed" in event) || !event.is_university_fixed}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Current Time Indicator */}
          {getCurrentTimeIndicator()}
        </div>
      </div>

      {/* Footer Tools */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() =>
                onCreateEvent(new Date().toISOString(), addHours(new Date(), 1).toISOString())
              }
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Study Block</span>
            </Button>

            {/* Legend */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Lecture</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Exam</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-indigo-400 rounded" />
                <span>Study</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Timer className="w-4 h-4" />
            <span>Click and drag to create study blocks</span>
          </div>
        </div>
      </div>
    </div>
  );
};
