"use client";
import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  User, 
  BookOpen, 
  Calendar, 
  Edit3,
  CheckCircle2,
  Circle,
  AlertCircle,
  Target,
  Coffee
} from "lucide-react";
import { 
  format, 
  addDays, 
  subDays, 
  isToday, 
  isTomorrow, 
  isYesterday,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay
} from "date-fns";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface DayEvent {
  id: string;
  title: string;
  start_at: string;
  end_at?: string;
  type: 'lecture' | 'seminar' | 'tutorial' | 'exam' | 'assessment' | 'personal' | 'study' | 'break';
  module_code?: string;
  module_title?: string;
  location?: string;
  instructor?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  completed?: boolean;
  url?: string;
  notes?: string;
}

interface StudyBlock {
  id: string;
  start_time: string;
  end_time: string;
  subject: string;
  task_type: 'reading' | 'writing' | 'research' | 'review' | 'practice';
  completed: boolean;
  notes?: string;
}

interface DayViewProps {
  initialDate?: string;
}

const TIME_HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

const EVENT_TYPE_STYLES = {
  lecture: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', light: 'bg-blue-50' },
  seminar: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', light: 'bg-green-50' },
  tutorial: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600', light: 'bg-purple-50' },
  exam: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', light: 'bg-red-50' },
  assessment: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', light: 'bg-orange-50' },
  personal: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600', light: 'bg-gray-50' },
  study: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', light: 'bg-indigo-50' },
  break: { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600', light: 'bg-yellow-50' }
};

export default function EnhancedDayView({ initialDate }: DayViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DayEvent | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // Load events and study blocks for the day
  useEffect(() => {
    loadDayData();
  }, [currentDate]);

  async function loadDayData() {
    try {
      setLoading(true);
      const supabase = getBrowserSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayStart = format(startOfDay(currentDate), 'yyyy-MM-dd');
      const dayEnd = format(endOfDay(currentDate), 'yyyy-MM-dd');

      // Load personal items for the day
      const { data: personalItems } = await supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', dayStart)
        .lte('start_at', dayEnd + 'T23:59:59')
        .order('start_at', { ascending: true });

      // Transform personal items to day events
      const dayEvents: DayEvent[] = (personalItems || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        start_at: item.start_at,
        end_at: item.end_at,
        type: item.type as DayEvent['type'],
        module_code: item.module_id,
        priority: item.priority,
        description: item.notes,
        completed: item.completed
      }));

      setEvents(dayEvents);
      setStudyBlocks([]); // No mock data - empty initially, load from Supabase
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get events for a specific hour
  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      if (!event.start_at.includes('T')) return false;
      const eventStart = new Date(event.start_at);
      return eventStart.getHours() === hour;
    }).filter(event => showCompleted || !event.completed);
  };

  // Navigation handlers
  const handlePreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const handleEventClick = (event: DayEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = (hour?: number) => {
    const dateTime = hour 
      ? setHours(currentDate, hour)
      : currentDate;
    router.push(`/planner/events/new?date=${format(dateTime, "yyyy-MM-dd'T'HH:mm")}`);
  };

  const toggleEventCompletion = async (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, completed: !event.completed }
        : event
    ));
  };

  const toggleStudyBlockCompletion = async (blockId: string) => {
    setStudyBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, completed: !block.completed }
        : block
    ));
  };

  // Day statistics
  const dayStats = useMemo(() => {
    const totalEvents = events.length;
    const completedEvents = events.filter(e => e.completed).length;
    const totalStudyTime = studyBlocks.reduce((total, block) => {
      const start = new Date(`2023-01-01T${block.start_time}:00`);
      const end = new Date(`2023-01-01T${block.end_time}:00`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    }, 0);
    const completedStudyTime = studyBlocks
      .filter(block => block.completed)
      .reduce((total, block) => {
        const start = new Date(`2023-01-01T${block.start_time}:00`);
        const end = new Date(`2023-01-01T${block.end_time}:00`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60); // minutes
      }, 0);
    
    return {
      totalEvents,
      completedEvents,
      totalStudyTime: Math.round(totalStudyTime),
      completedStudyTime: Math.round(completedStudyTime)
    };
  }, [events, studyBlocks]);

  const getDayTitle = () => {
    if (isToday(currentDate)) return 'Today';
    if (isTomorrow(currentDate)) return 'Tomorrow';
    if (isYesterday(currentDate)) return 'Yesterday';
    return format(currentDate, 'EEEE');
  };

  return (
    <>
      <Head>
        <title>{getDayTitle()} - {format(currentDate, 'MMM d, yyyy')} - MyDurhamLaw</title>
        <meta name="description" content={`Detailed day view for ${format(currentDate, 'EEEE, MMMM d, yyyy')}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getDayTitle()}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                
                <button
                  onClick={handleNextDay}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span>{dayStats.completedEvents}/{dayStats.totalEvents} events</span>
                  <span>•</span>
                  <span>{dayStats.completedStudyTime}/{dayStats.totalStudyTime} min study</span>
                </div>
                
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${
                      viewMode === 'timeline' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Timeline
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
                  onClick={() => handleCreateEvent()}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Timeline/List View */}
            <div className="lg:col-span-3">
              {viewMode === 'timeline' ? (
                /* Timeline View */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Daily Timeline</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {TIME_HOURS.map((hour) => {
                      const hourEvents = getEventsForHour(hour);
                      const timeLabel = format(setHours(new Date(), hour), 'HH:mm');
                      const isPastHour = isToday(currentDate) && new Date().getHours() > hour;
                      
                      return (
                        <div key={hour} className="flex">
                          <div className={`w-16 p-4 text-center border-r border-gray-100 bg-gray-50 ${
                            isPastHour ? 'opacity-60' : ''
                          }`}>
                            <div className="text-sm font-medium text-gray-700">{timeLabel}</div>
                          </div>
                          
                          <div 
                            className="flex-1 p-4 min-h-[80px] hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleCreateEvent(hour)}
                          >
                            {hourEvents.length === 0 ? (
                              <div className="text-gray-400 text-sm italic h-full flex items-center">
                                Click to add event
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {hourEvents.map((event) => {
                                  const style = EVENT_TYPE_STYLES[event.type];
                                  
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEventClick(event);
                                      }}
                                      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm ${
                                        style.light
                                      } ${style.border}`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleEventCompletion(event.id);
                                              }}
                                              className="text-gray-400 hover:text-purple-600"
                                            >
                                              {event.completed ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                              ) : (
                                                <Circle className="w-4 h-4" />
                                              )}
                                            </button>
                                            <h4 className={`font-medium ${
                                              event.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                            }`}>
                                              {event.title}
                                            </h4>
                                            {event.priority === 'high' && (
                                              <AlertCircle className="w-4 h-4 text-red-500" />
                                            )}
                                          </div>
                                          
                                          {event.module_code && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {event.module_code} {event.module_title && `- ${event.module_title}`}
                                            </p>
                                          )}
                                          
                                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                                            {event.end_at && (
                                              <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span>
                                                  {format(new Date(event.start_at), 'HH:mm')} - {format(new Date(event.end_at), 'HH:mm')}
                                                </span>
                                              </div>
                                            )}
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
                                          </div>
                                        </div>
                                        
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                                          {event.type}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {events.filter(event => showCompleted || !event.completed).map((event) => {
                    const style = EVENT_TYPE_STYLES[event.type];
                    
                    return (
                      <Card key={event.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <button
                              onClick={() => toggleEventCompletion(event.id)}
                              className="text-gray-400 hover:text-purple-600 mt-1"
                            >
                              {event.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className={`text-lg font-semibold ${
                                  event.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {event.title}
                                </h3>
                                {event.priority === 'high' && (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                              </div>
                              
                              {event.module_code && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {event.module_code} {event.module_title && `- ${event.module_title}`}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                {event.start_at.includes('T') && (
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>
                                      {format(new Date(event.start_at), 'HH:mm')}
                                      {event.end_at && ` - ${format(new Date(event.end_at), 'HH:mm')}`}
                                    </span>
                                  </div>
                                )}
                                {event.location && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                                {event.instructor && (
                                  <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    <span>{event.instructor}</span>
                                  </div>
                                )}
                              </div>
                              
                              {event.description && (
                                <p className="text-sm text-gray-700 mt-3">{event.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                              {event.type}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEventClick(event)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Day Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Day Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Events</span>
                    <span className="text-sm font-medium">
                      {dayStats.completedEvents}/{dayStats.totalEvents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dayStats.totalEvents > 0 ? (dayStats.completedEvents / dayStats.totalEvents) * 100 : 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Study Time</span>
                    <span className="text-sm font-medium">
                      {dayStats.completedStudyTime}/{dayStats.totalStudyTime} min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dayStats.totalStudyTime > 0 ? (dayStats.completedStudyTime / dayStats.totalStudyTime) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Study Blocks */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Blocks</h3>
                <div className="space-y-3">
                  {studyBlocks.map((block) => (
                    <div key={block.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <button
                            onClick={() => toggleStudyBlockCompletion(block.id)}
                            className="text-gray-400 hover:text-indigo-600 mt-0.5"
                          >
                            {block.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <h4 className={`text-sm font-medium ${
                              block.completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {block.subject}
                            </h4>
                            <p className="text-xs text-gray-600 capitalize">{block.task_type}</p>
                            {block.notes && (
                              <p className="text-xs text-gray-600 mt-1">{block.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {block.start_time} - {block.end_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleCreateEvent()}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                  <Button
                    onClick={() => router.push('/planner/study/new')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Plan Study Session
                  </Button>
                  <Button
                    onClick={() => setCurrentDate(new Date())}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Go to Today
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Show completed items</span>
            </label>
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
                  {selectedEvent.start_at.includes('T') && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        {format(new Date(selectedEvent.start_at), 'HH:mm')}
                        {selectedEvent.end_at && (
                          <span> - {format(new Date(selectedEvent.end_at), 'HH:mm')}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
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
              <p className="text-gray-600 text-sm">Loading day schedule...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}