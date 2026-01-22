-- Upgrade Assignment Hub Schema

-- 1. Extend assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS brief_rich jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS word_count_target integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weightage text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS assignment_type text DEFAULT 'essay'; -- Ensure type exists

-- 2. Checklist Items
CREATE TABLE IF NOT EXISTS assignment_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_done boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Rubric Criteria
CREATE TABLE IF NOT EXISTS assignment_rubric_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  criterion text NOT NULL, -- e.g. Knowledge, Analysis
  description text,
  weight numeric, -- e.g. 25.0
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Milestones
CREATE TABLE IF NOT EXISTS assignment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  status text DEFAULT 'pending', -- pending, completed, missed
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  submitted_at timestamptz DEFAULT now(),
  method text, -- turnitin, manual, email
  notes text,
  file_url text, -- valid url if stored
  created_at timestamptz DEFAULT now()
);

-- 6. Feedback
CREATE TABLE IF NOT EXISTS assignment_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  released_at timestamptz,
  overall_comments text,
  strengths text,
  improvements text,
  feed_forward text,
  grade text, 
  created_at timestamptz DEFAULT now()
);

-- 7. Work Sessions
CREATE TABLE IF NOT EXISTS assignment_work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  minutes integer DEFAULT 0,
  focus text, -- drafting, research, etc
  created_at timestamptz DEFAULT now()
);

-- 8. Enable RLS
ALTER TABLE assignment_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_work_sessions ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_checklist_items' AND policyname = 'Users can manage their own checklist items') THEN
        CREATE POLICY "Users can manage their own checklist items" ON assignment_checklist_items FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_rubric_criteria' AND policyname = 'Users can manage their own rubric criteria') THEN
        CREATE POLICY "Users can manage their own rubric criteria" ON assignment_rubric_criteria FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_milestones' AND policyname = 'Users can manage their own milestones') THEN
        CREATE POLICY "Users can manage their own milestones" ON assignment_milestones FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_submissions' AND policyname = 'Users can manage their own submissions') THEN
        CREATE POLICY "Users can manage their own submissions" ON assignment_submissions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_feedback' AND policyname = 'Users can manage their own feedback') THEN
        CREATE POLICY "Users can manage their own feedback" ON assignment_feedback FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_work_sessions' AND policyname = 'Users can manage their own work sessions') THEN
        CREATE POLICY "Users can manage their own work sessions" ON assignment_work_sessions FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;
