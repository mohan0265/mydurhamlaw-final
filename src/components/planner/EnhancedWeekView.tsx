"use client";
import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, User, BookOpen, Calendar, Settings } from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  isToday, 
  isSameDay,
  addWeeks,
  subWeeks,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  addDays
} from "date-fns";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface WeekEvent {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  type: 'lecture' | 'seminar' | 'tutorial' | 'exam' | 'assessment' | 'personal' | 'study';
  module_code?: string;
  module_title?: string;
  location?: string;
  instructor?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  completed?: boolean;
}

interface WeekViewProps {
  initialDate?: string;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const EVENT_TYPE_STYLES = {
  lecture: {
    bg: 'bg-blue-500',
    text: 'text-white',
    border: 'border-blue-600',
    icon: '📚'
  },
  seminar: {
    bg: 'bg-green-500',
    text: 'text-white',
    border: 'border-green-600',
    icon: '💬'
  },
  tutorial: {
    bg: 'bg-purple-500',
    text: 'text-white',
    border: 'border-purple-600',
    icon: '👩‍🏫'
  },
  exam: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-600',
    icon: '📝'
  },
  assessment: {
    bg: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    icon: '📋'
  },
  personal: {
    bg: 'bg-gray-500',
    text: 'text-white',
    border: 'border-gray-600',
    icon: '👤'
  },
  study: {
    bg: 'bg-indigo-500',
    text: 'text-white',
    border: 'border-indigo-600',
    icon: '📖'
  }
};

export default function EnhancedWeekView({ initialDate }: WeekViewProps) {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(() => {
    const date = initialDate ? new Date(initialDate) : new Date();
    return startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  });
  const [events, setEvents] = useState<WeekEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WeekEvent | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCompleted, setShowCompleted] = useState(true);

  // Week calculations
  const weekStart = currentWeek;
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  // Generate week days manually
  const weekDays: Date[] = [];
  let currentDay = weekStart;
  while (currentDay <= weekEnd) {
    weekDays.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }

  // Load events for the week
  useEffect(() => {
    loadWeekEvents();
  }, [currentWeek]);

  async function loadWeekEvents() {
    try {
      setLoading(true);
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');

      // Load personal items
      const { data: personalItems } = await supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', startDate)
        .lte('start_at', endDate + 'T23:59:59')
        .order('start_at', { ascending: true });

      // Transform personal items to week events
      const weekEvents: WeekEvent[] = (personalItems || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        start_at: item.start_at,
        end_at: item.end_at,
        type: item.type as WeekEvent['type'],
        module_code: item.module_id,
        location: item.notes?.includes('location:') ? item.notes.split('location:')[1]?.trim() : undefined,
        priority: item.priority,
        description: item.notes,
        completed: item.completed
      }));

      // No mock data - using only real Supabase data


      setEvents(weekEvents);
    } catch (error) {
      console.error('Failed to load week events:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_at);
      return isSameDay(eventDate, date);
    }).filter(event => showCompleted || !event.completed);
  };

  // Get timed events (with specific hours)
  const getTimedEventsForDay = (date: Date) => {
    return getEventsForDay(date).filter(event => 
      event.start_at.includes('T') && event.end_at
    );
  };

  // Get all-day events
  const getAllDayEventsForDay = (date: Date) => {
    return getEventsForDay(date).filter(event => 
      !event.start_at.includes('T') || !event.end_at
    );
  };

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleEventClick = (event: WeekEvent) => {
    setSelectedEvent(event);
  };

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    if (hours !== undefined && minutes !== undefined) {
      const selectedDateTime = setMinutes(setHours(date, hours), minutes);
      router.push(`/planner/events/new?date=${format(selectedDateTime, "yyyy-MM-dd'T'HH:mm")}`);
    }
  };

  // Calculate event position for grid view
  const getEventPosition = (event: WeekEvent) => {
    if (!event.start_at.includes('T') || !event.end_at) return null;
    
    const startTime = new Date(event.start_at);
    const endTime = new Date(event.end_at);
    
    const startHour = getHours(startTime);
    const startMinute = getMinutes(startTime);
    const endHour = getHours(endTime);
    const endMinute = getMinutes(endTime);
    
    // Calculate position based on 30-minute slots
    const startSlot = (startHour - 8) * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlot = (endHour - 8) * 2 + (endMinute > 30 ? 1 : 0);
    const duration = Math.max(1, endSlot - startSlot);
    
    return {
      top: `${startSlot * 48}px`, // 48px per 30-min slot
      height: `${duration * 48 - 2}px`, // -2px for gap
    };
  };

  const weekProgress = useMemo(() => {
    const total = events.length;
    const completed = events.filter(e => e.completed).length;
    const overdue = events.filter(e => {
      if (!e.start_at.includes('T')) {
        // All-day events
        const eventDate = new Date(e.start_at);
        return !e.completed && eventDate < new Date();
      }
      return false;
    }).length;
    
    return { total, completed, overdue };
  }, [events]);

  return (
    <>
      <Head>
        <title>Week View - {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} - MyDurhamLaw</title>
        <meta name="description" content={`Weekly schedule view for ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Week {format(weekStart, 'w')} of {format(weekStart, 'yyyy')}
                  </p>
                </div>
                
                <button
                  onClick={handleNextWeek}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{weekProgress.completed}/{weekProgress.total} completed</span>
                  {weekProgress.overdue > 0 && (
                    <span className="text-red-600">• {weekProgress.overdue} overdue</span>
                  )}
                </div>
                
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm font-medium rounded-r-lg transition-colors ${
                      viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    List
                  </button>
                </div>

                <Button
                  onClick={() => router.push('/planner/events/new')}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </Button>

                <Link href="/year-at-a-glance" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  ← Back to Year View
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Week Days Header */}
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Time</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="p-4 text-center bg-gray-50">
                    <div className={`text-sm font-medium ${
                      isToday(day) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg ${
                      isToday(day) ? 'text-blue-600 font-bold' : 'text-gray-600'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* All-day events */}
                    <div className="mt-2 space-y-1">
                      {getAllDayEventsForDay(day).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`text-xs p-1 rounded cursor-pointer ${EVENT_TYPE_STYLES[event.type].bg} ${EVENT_TYPE_STYLES[event.type].text}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative">
                <div className="grid grid-cols-8">
                  {/* Time Column */}
                  <div className="border-r border-gray-200">
                    {TIME_SLOTS.map((time) => (
                      <div key={time} className="h-12 p-2 border-b border-gray-100 text-xs text-gray-500">
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => (
                    <div key={day.toISOString()} className="relative border-r border-gray-200">
                      {/* Time Slots */}
                      {TIME_SLOTS.map((time) => (
                        <div
                          key={time}
                          onClick={() => handleTimeSlotClick(day, time)}
                          className="h-12 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        ></div>
                      ))}

                      {/* Timed Events */}
                      {getTimedEventsForDay(day).map((event) => {
                        const position = getEventPosition(event);
                        if (!position) return null;
                        
                        const style = EVENT_TYPE_STYLES[event.type];
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`absolute left-1 right-1 ${style.bg} ${style.text} p-2 rounded text-xs cursor-pointer shadow-sm border-l-2 ${style.border} z-10`}
                            style={position}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.location && (
                              <div className="flex items-center mt-1 opacity-90">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-6">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                
                return (
                  <Card key={day.toISOString()} className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            isToday(day) ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {format(day, 'EEEE, MMMM d')}
                          </h3>
                          {isToday(day) && (
                            <span className="text-sm text-blue-600 font-medium">Today</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {dayEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No events scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayEvents.map((event) => {
                            const style = EVENT_TYPE_STYLES[event.type];
                            
                            return (
                              <div
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className={`w-3 h-3 rounded-full ${style.bg} mt-2 flex-shrink-0`}></div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                                      {event.module_code && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {event.module_code} {event.module_title && `- ${event.module_title}`}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="text-right text-xs text-gray-600">
                                      {event.start_at.includes('T') ? (
                                        <div>
                                          <div>{format(new Date(event.start_at), 'HH:mm')}</div>
                                          {event.end_at && (
                                            <div className="text-gray-400">
                                              {format(new Date(event.end_at), 'HH:mm')}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>All day</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                                    {event.location && (
                                      <div className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    {event.instructor && (
                                      <div className="flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        <span>{event.instructor}</span>
                                      </div>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${style.bg} ${style.text}`}>
                                      {event.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Show completed events</span>
            </label>
            
            <Button
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              variant="outline"
              size="sm"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                    {selectedEvent.module_code && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedEvent.module_code} {selectedEvent.module_title && `- ${selectedEvent.module_title}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      {selectedEvent.start_at.includes('T') ? (
                        <div>
                          {format(new Date(selectedEvent.start_at), 'EEEE, MMMM d, yyyy')} at {format(new Date(selectedEvent.start_at), 'HH:mm')}
                          {selectedEvent.end_at && (
                            <div className="text-gray-600">
                              Until {format(new Date(selectedEvent.end_at), 'HH:mm')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>{format(new Date(selectedEvent.start_at), 'EEEE, MMMM d, yyyy')} (All day)</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  
                  {selectedEvent.instructor && (
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedEvent.instructor}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="capitalize">{selectedEvent.type}</span>
                  </div>
                  
                  {selectedEvent.description && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-700">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                  <Button onClick={() => router.push(`/planner/events/${selectedEvent.id}/edit`)}>
                    Edit Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading weekly schedule...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}