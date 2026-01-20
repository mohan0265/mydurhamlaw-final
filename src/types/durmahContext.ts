import type { NowPacket } from '@/lib/durmah/timezone';

export interface StudentContext {
  student: {
    displayName: string;
    yearGroup: string;
    term: string;
    weekOfTerm: number;
    localTimeISO: string;
    timezone?: string;
  };
  // TIMEZONE TRUTH: academic.now is the SINGLE SOURCE for date/time
  academic?: {
    timezone: string;
    now: NowPacket;
  };
  assignments: {
    upcoming: Array<{
      id?: string;
      title: string;
      module?: string;
      module_name?: string;
      module_code?: string;
      dueISO?: string;
      due_date?: string;
      daysLeft: number | null;
      status?: string;
      current_stage?: number;
      nextAction?: string;
    }>;
    overdue: Array<{
      id?: string;
      title: string;
      module?: string;
      module_name?: string;
      dueISO?: string;
      due_date?: string;
      daysOver?: number;
      daysLeft?: number | null;
    }>;
    recentlyCreated: Array<{
      id?: string;
      title: string;
      module?: string;
      module_name?: string;
      createdISO?: string;
    }>;
    total: number;
  };
  schedule: {
    todaysClasses: Array<{
      module_name: string;
      time: string;
    }>;
  };
  yaag?: {
    rangeStart: string;
    rangeEnd: string;
    itemsByDay: Record<string, Array<{
      type: string;
      title: string;
      start?: string;
      end?: string;
      allDay: boolean;
      meta?: any;
    }>>;
  };
  // LECTURES: Recent lecture recordings (metadata only)
  lectures?: {
    recent: Array<{
      id: string;
      title: string;
      module_code?: string;
      module_name?: string;
      lecturer_name?: string;
      lecture_date?: string;
    }>;
    current?: {
      id: string;
      title: string;
      module_code?: string;
      module_name?: string;
      lecturer_name?: string;
      lecture_date?: string;
      summary?: string;
      key_points?: string[];
      engagement_hooks?: string[];
    };
  };
  // MEMORY: Recent chat history for continuity
  recentMemories?: Array<{
    role: string;
    content: string;
    ts?: string; // ISO string
    saved_at?: string | null;
  }>;
}
