-- ICS Calendar Import: Onboarding Status Tracking
-- Migration: 20260108_onboarding_ics_import.sql
-- Created: 2026-01-08

-- Onboarding progress tracking
CREATE TABLE IF NOT EXISTS onboarding_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps JSONB DEFAULT '{}'::jsonb,
  completeness_score INT DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import job tracking
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('ics', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import source files/data
CREATE TABLE IF NOT EXISTS import_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_job_id UUID REFERENCES import_jobs(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ics', 'manual')),
  filename TEXT,
  file_size_bytes INT,
  raw_text TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User calendar events (imported from ICS)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  external_id TEXT, -- ICS UID for de-duplication
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_type TEXT CHECK (event_type IN ('lecture', 'seminar', 'tutorial', 'lab', 'deadline', 'exam', 'other')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  module_code TEXT,
  source TEXT DEFAULT 'ics' CHECK (source IN ('ics', 'manual', 'template')),
  source_meta JSONB DEFAULT '{}'::jsonb, -- Raw ICS fields
  verified BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- De-duplication: prevent duplicate imports of same ICS event
  CONSTRAINT unique_user_external_id UNIQUE (user_id, external_id)
);

-- User assessment deadlines (extracted from ICS or manual)
CREATE TABLE IF NOT EXISTS user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  module_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  weightage NUMERIC(5,2), -- e.g., 12.50 for 12.5%
  assessment_type TEXT CHECK (assessment_type IN ('essay', 'exam', 'presentation', 'coursework', 'other')),
  source TEXT DEFAULT 'ics' CHECK (source IN ('ics', 'manual', 'template')),
  source_meta JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- De-duplication: prevent duplicate assessments
  CONSTRAINT unique_user_assessment UNIQUE (user_id, module_code, title, due_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_events_start_at ON user_events(start_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_events_module ON user_events(module_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON user_assessments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_assessments_due_at ON user_assessments(due_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);

-- RLS Policies: Users can only see their own data
ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- Onboarding status policies
CREATE POLICY "Users can view own onboarding status"
  ON onboarding_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding status"
  ON onboarding_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding status"
  ON onboarding_status FOR UPDATE
  USING (auth.uid() = user_id);

-- Import jobs policies
CREATE POLICY "Users can view own import jobs"
  ON import_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Import sources policies
CREATE POLICY "Users can view own import sources"
  ON import_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own import sources"
  ON import_sources FOR UPDATE
  USING (auth.uid() = user_id);

-- User events policies
CREATE POLICY "Users can view own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own events"
  ON user_events FOR UPDATE
  USING (auth.uid() = user_id);

-- User assessments policies
CREATE POLICY "Users can view own assessments"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own assessments"
  ON user_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update onboarding completeness score
CREATE OR REPLACE FUNCTION calculate_onboarding_completeness(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  score INT := 0;
  has_events BOOLEAN;
  has_assessments BOOLEAN;
BEGIN
  -- Check if user has imported calendar events
  SELECT EXISTS(
    SELECT 1 FROM user_events 
    WHERE user_id = p_user_id 
    AND source = 'ics' 
    AND deleted_at IS NULL
    LIMIT 1
  ) INTO has_events;
  
  -- Check if user has imported assessments
  SELECT EXISTS(
    SELECT 1 FROM user_assessments 
    WHERE user_id = p_user_id 
    AND source = 'ics' 
    AND deleted_at IS NULL
    LIMIT 1
  ) INTO has_assessments;
  
  -- Calculate score
  IF has_events THEN score := score + 50; END IF;
  IF has_assessments THEN score := score + 50; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update completeness score
CREATE OR REPLACE FUNCTION update_onboarding_completeness()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO onboarding_status (user_id, completeness_score, updated_at)
  VALUES (
    NEW.user_id,
    calculate_onboarding_completeness(NEW.user_id),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    completeness_score = calculate_onboarding_completeness(NEW.user_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_completeness_on_event_insert
AFTER INSERT ON user_events
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_completeness();

CREATE TRIGGER trigger_update_completeness_on_assessment_insert
AFTER INSERT ON user_assessments
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_completeness();

-- Grant service role full access (for API endpoints)
GRANT ALL ON onboarding_status TO service_role;
GRANT ALL ON import_jobs TO service_role;
GRANT ALL ON import_sources TO service_role;
GRANT ALL ON user_events TO service_role;
GRANT ALL ON user_assessments TO service_role;

-- Comments for documentation
COMMENT ON TABLE onboarding_status IS 'Tracks user onboarding progress and completeness score';
COMMENT ON TABLE import_jobs IS 'Tracks ICS import job status and errors';
COMMENT ON TABLE import_sources IS 'Stores uploaded ICS files and metadata';
COMMENT ON TABLE user_events IS 'User calendar events imported from ICS files with de-duplication';
COMMENT ON TABLE user_assessments IS 'User assessment deadlines extracted from calendar or manual entry';
COMMENT ON COLUMN user_events.external_id IS 'ICS UID for de-duplication on re-import';
COMMENT ON COLUMN user_events.deleted_at IS 'Soft delete timestamp - allows revoke without losing history';
