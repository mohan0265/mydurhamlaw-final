export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_at: string
  end_at: string
  location?: string
  type: 'lecture' | 'seminar' | 'tutorial' | 'exam' | 'assessment' | 'personal'
  module_id?: string
  is_university_fixed: boolean
  is_all_day: boolean
}

export interface Module {
  id: string
  code: string
  title: string
  programme: string
  year: number
  semester: 1 | 2 | 3
  credits: number
  description?: string
  color?: string
}

export interface SyllabusTopicStatus {
  id: string
  user_id: string
  module_id: string
  syllabus_topic_id: string
  status: 'not_started' | 'in_progress' | 'done'
  completed_at?: string
}

export interface SyllabusTopic {
  id: string
  module_id: string
  title: string
  description?: string
  estimated_reading_load: 'light' | 'medium' | 'heavy'
  sequence_index: number
  week_number?: number
  status?: SyllabusTopicStatus['status']
}

export interface TimetableEvent {
  id: string
  module_id: string
  title: string
  event_type: 'lecture' | 'seminar' | 'tutorial'
  start_at: string
  end_at: string
  location?: string
  is_university_fixed: boolean
  recurring_pattern?: 'weekly' | 'biweekly' | 'custom'
}

export interface Assessment {
  id: string
  module_id: string
  title: string
  type: 'essay' | 'exam' | 'coursework' | 'presentation' | 'oral'
  due_at: string
  weight_percentage?: number
  description?: string
  status?: 'not_started' | 'in_progress' | 'submitted' | 'graded'
}

export interface Exam {
  id: string
  module_id: string
  title: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  duration_minutes?: number
  exam_type: 'written' | 'oral' | 'practical' | 'online'
}

export interface PersonalItem {
  id: string
  user_id: string
  title: string
  type: 'study' | 'task' | 'appointment' | 'reminder'
  start_at: string
  end_at?: string
  notes?: string
  is_all_day: boolean
  module_id?: string
  priority: 'low' | 'medium' | 'high'
  completed?: boolean
}

export interface AcademicCalendar {
  id: string
  academic_year: string
  term_1_start: string
  term_1_end: string
  term_2_start: string
  term_2_end: string
  term_3_start: string
  term_3_end: string
  exam_period_1_start?: string
  exam_period_1_end?: string
  exam_period_2_start?: string
  exam_period_2_end?: string
  reading_week_1_start?: string
  reading_week_1_end?: string
  reading_week_2_start?: string
  reading_week_2_end?: string
}

export interface CalendarData {
  modules: Module[]
  events: CalendarEvent[]
  timetable_events: TimetableEvent[]
  assessments: Assessment[]
  exams: Exam[]
  personal_items: PersonalItem[]
  syllabus_topics: SyllabusTopic[]
  academic_calendar?: AcademicCalendar
}

export interface CalendarFilter {
  modules: string[]
  event_types: CalendarEvent['type'][]
  date_range: {
    start: string
    end: string
  }
  show_completed: boolean
}

export interface CalendarViewProps {
  data: CalendarData
  filter: CalendarFilter
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: string) => void
  onFilterChange: (filter: CalendarFilter) => void
}

export type CalendarViewMode = 'year' | 'month' | 'week'

export interface WeeklySchedule {
  monday: CalendarEvent[]
  tuesday: CalendarEvent[]
  wednesday: CalendarEvent[]
  thursday: CalendarEvent[]
  friday: CalendarEvent[]
  saturday: CalendarEvent[]
  sunday: CalendarEvent[]
}

export interface MonthData {
  year: number
  month: number
  weeks: {
    week_start: string
    days: {
      date: string
      events: CalendarEvent[]
      is_current_month: boolean
      is_today: boolean
      has_exam: boolean
      has_assessment: boolean
      has_lecture: boolean
    }[]
  }[]
}

export interface YearOverview {
  academic_year: string
  programme: string
  year_of_study: number
  term_1: {
    name: string
    start_date: string
    end_date: string
    modules: Module[]
    progress_percentage: number
  }
  term_2: {
    name: string
    start_date: string
    end_date: string
    modules: Module[]
    progress_percentage: number
  }
  term_3: {
    name: string
    start_date: string
    end_date: string
    modules: Module[]
    progress_percentage: number
  }
  overall_progress: number
  next_deadline?: Assessment | Exam
  upcoming_events: CalendarEvent[]
}

export interface MultiYearData {
  current_year_index: number
  years: {
    [key: string]: YearOverview
  }
  year_labels: string[]
  programme: string
  academic_year: string
}

export type YearLevel = 'foundation' | 'year1' | 'year2' | 'year3'

export interface YearNavigationState {
  selectedYearIndex: number
  currentUserYearIndex: number
  availableYears: string[]
  canNavigateNext: boolean
  canNavigatePrevious: boolean
}

export interface DayDetail {
  date: string
  day_name: string
  is_today: boolean
  events: CalendarEvent[]
  assessments_due: Assessment[]
  exams: Exam[]
  personal_items: PersonalItem[]
  study_time_blocks: {
    start_time: string
    end_time: string
    title: string
    module_id?: string
  }[]
}

export interface ModuleProgress {
  module_id: string
  module_code: string
  module_title: string
  completed_topics: number
  total_topics: number
  percentage: number
  upcoming_deadlines: (Assessment | Exam)[]
  recent_activity: {
    date: string
    activity: string
    type: 'topic_completed' | 'assessment_submitted' | 'exam_taken'
  }[]
}

export interface CalendarNotification {
  id: string
  type: 'reminder' | 'deadline' | 'exam' | 'event'
  title: string
  message: string
  due_at: string
  module_code?: string
  priority: 'low' | 'medium' | 'high'
  acknowledged: boolean
}