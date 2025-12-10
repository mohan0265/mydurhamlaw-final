export type AssignmentStatus = 'not_started' | 'planning' | 'drafting' | 'editing' | 'submitted' | 'completed';

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  module_code?: string;
  module_name?: string;
  assignment_type?: string;
  question_text?: string;
  due_date: string;
  status: AssignmentStatus;
  estimated_effort_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface ExamPreparation {
  id: string;
  user_id: string;
  module_code?: string;
  module_name?: string;
  exam_date: string;
  readiness_score?: number; // 1-5
  syllabus_covered?: boolean;
  past_papers_practised?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
