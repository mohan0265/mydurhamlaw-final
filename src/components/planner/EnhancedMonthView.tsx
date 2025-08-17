"use client";
import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, Filter, Settings, BookOpen, AlertTriangle } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isToday, 
  isSameDay,
  addMonths,
  subMonths,
  addDays
} from "date-fns";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  type: 'lecture' | 'seminar' | 'tutorial' | 'exam' | 'assessment' | 'personal';
  module_code?: string;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface MonthViewProps {
  initialDate?: string;
}

const EVENT_TYPE_COLORS = {
  lecture: 'bg-blue-100 text-blue-800 border-blue-200',
  seminar: 'bg-green-100 text-green-800 border-green-200',
  tutorial: 'bg-purple-100 text-purple-800 border-purple-200',
  exam: 'bg-red-100 text-red-800 border-red-200',
  assessment: 'bg-orange-100 text-orange-800 border-orange-200',
  personal: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function EnhancedMonthView({ initialDate }: MonthViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>(['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal']);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  // Generate calendar days manually
  const calendarDays: Date[] = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    calendarDays.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }

  // Load events for the month
  useEffect(() => {
    loadMonthEvents();
  }, [currentDate]);

  async function loadMonthEvents() {
    try {
      setLoading(true);
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load personal items and calendar events
      const startDate = format(calendarStart, 'yyyy-MM-dd');
      const endDate = format(calendarEnd, 'yyyy-MM-dd');

      const { data: personalItems } = await supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', startDate)
        .lte('start_at', endDate)
        .order('start_at', { ascending: true });

      // Transform personal items to calendar events
      const calendarEvents: CalendarEvent[] = (personalItems || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        start_at: item.start_at,
        end_at: item.end_at,
        type: item.type === 'study' ? 'personal' : 'assessment',
        module_code: item.module_id,
        location: item.notes?.includes('location:') ? item.notes.split('location:')[1]?.trim() : undefined,
        priority: item.priority
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load month events:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_at);
      return isSameDay(eventDate, date) && eventTypes.includes(event.type);
    });
  };

  // Navigation handlers
  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Navigate to day view
    router.push(`/year-at-a-glance/day?date=${format(date, 'yyyy-MM-dd')}`);
  };

  const handleCreateEvent = (date: Date) => {
    // Navigate to event creation with pre-filled date
    router.push(`/planner/events/new?date=${format(date, 'yyyy-MM-dd')}`);
  };

  const filteredEventTypes = useMemo(() => {
    return eventTypes.filter(type => 
      events.some(event => event.type === type)
    );
  }, [events, eventTypes]);

  return (
    <>
      <Head>
        <title>Month View - {format(currentDate, 'MMMM yyyy')} - MyDurhamLaw</title>
        <meta name="description" content={`Monthly calendar view for ${format(currentDate, 'MMMM yyyy')} with academic events and deadlines.`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Academic Month View
                  </p>
                </div>
                
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => handleCreateEvent(new Date())}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </Button>

                <Link href="/year-at-a-glance" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  ← Back to Year View
                </Link>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t border-gray-200 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Show:</span>
                    
                    <div className="flex items-center space-x-2">
                      {['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={eventTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEventTypes(prev => [...prev, type]);
                              } else {
                                setEventTypes(prev => prev.filter(t => t !== type));
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventTypes(['lecture', 'seminar', 'tutorial', 'exam', 'assessment', 'personal'])}
                    className="text-sm"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-4 text-center text-sm font-medium text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const hasEvents = dayEvents.length > 0;
                const hasHighPriorityEvent = dayEvents.some(e => e.priority === 'high');
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                    } ${isDayToday ? 'bg-blue-50' : ''}`}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isDayToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      
                      {hasHighPriorityEvent && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border ${EVENT_TYPE_COLORS[event.type]} truncate`}
                          title={`${event.title}${event.location ? ` - ${event.location}` : ''}`}
                        >
                          {event.start_at.includes('T') ? (
                            <span className="font-medium">{format(new Date(event.start_at), 'HH:mm')}</span>
                          ) : null}
                          <span className={event.start_at.includes('T') ? 'ml-1' : ''}>{event.title}</span>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Event Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(EVENT_TYPE_COLORS).map(([type, colorClass]) => (
                <div key={type} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded border ${colorClass}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading calendar events...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}