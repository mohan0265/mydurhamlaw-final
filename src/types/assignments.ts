export type AssignmentStatus =
  | "not_started"
  | "planning"
  | "drafting"
  | "editing"
  | "submitted"
  | "completed";

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
  module_id?: string;

  // New fields for Hub Upgrade
  brief_rich?: string | any;
  word_count_target?: number;
  weightage?: string;
  source?: string; // 'manual' | 'blackboard_import'

  created_at: string;
  updated_at: string;
}

export interface AssignmentChecklistItem {
  id: string;
  user_id: string;
  assignment_id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
}

export interface AssignmentRubricCriterion {
  id: string;
  user_id: string;
  assignment_id: string;
  criterion: string;
  description?: string;
  weight?: number;
  sort_order: number;
  created_at: string;
}

export interface AssignmentMilestone {
  id: string;
  user_id: string;
  assignment_id: string;
  title: string;
  due_at?: string;
  status: "pending" | "completed" | "missed";
  sort_order: number;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  user_id: string;
  assignment_id: string;
  submitted_at: string;
  method?: string;
  notes?: string;
  file_url?: string;
  created_at: string;
}

export interface AssignmentFeedback {
  id: string;
  user_id: string;
  assignment_id: string;
  released_at?: string;
  overall_comments?: string;
  strengths?: string;
  improvements?: string;
  feed_forward?: string;
  grade?: string;
  created_at: string;
}

export interface ExamPreparation {
  id: string;
  user_id: string;
  module_id?: string;
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
