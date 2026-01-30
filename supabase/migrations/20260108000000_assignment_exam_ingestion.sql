-- Migration: Assignment Briefs & Exam Dates Ingestion
-- Created: 2026-01-08
-- Purpose: Enable secure ingestion of assignment briefs and exam dates from user-provided exports

-- ============================================================================
-- TABLE: user_assignment_briefs
-- Stores assignment brief details extracted from PDF, DOCX, or manual entry
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_assignment_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment Details
  module_code TEXT,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  word_count INTEGER,
  weighting INTEGER, -- Percentage (e.g., 40 for 40%)
  submission_type TEXT, -- 'turnitin', 'blackboard', 'duo', etc.
  late_allowed BOOLEAN,
  resubmissions_allowed BOOLEAN,
  
  -- Rubric (JSON format: {knowledge: 30, analysis: 30, communication: 25, research: 15})
  rubric_json JSONB,
  
  -- Import Metadata
  source TEXT NOT NULL CHECK (source IN ('pdf', 'docx', 'manual', 'ics')),
  import_source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  extracted_text TEXT, -- Raw extracted text for re-parsing if needed
  needs_review BOOLEAN DEFAULT false, -- Flag for user review of extracted data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_user_assignment_briefs_user_id ON user_assignment_briefs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_assignment_briefs_due_at ON user_assignment_briefs(due_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_assignment_briefs_module ON user_assignment_briefs(module_code) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: user_exam_dates
-- Stores exam dates from manual entry or PDF import
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_exam_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Exam Details
  module_code TEXT,
  title TEXT NOT NULL,
  exam_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  
  -- Import Metadata
  source TEXT NOT NULL CHECK (source IN ('pdf', 'manual', 'ics')),
  import_source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes
CREATE INDEX idx_user_exam_dates_user_id ON user_exam_dates(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_exam_dates_exam_at ON user_exam_dates(exam_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_exam_dates_module ON user_exam_dates(module_code) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: assignment_widget_links
-- Links assignment briefs to Assignment Widget sessions for resuming work
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_widget_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_brief_id UUID NOT NULL REFERENCES user_assignment_briefs(id) ON DELETE CASCADE,
  
  -- Link to existing assignments table if it exists
  assignment_id UUID, -- Optional FK to assignments table
  
  -- Widget State
  last_stage TEXT, -- 'analyze', 'research', 'outline', 'draft', etc.
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignment_widget_links_user_id ON assignment_widget_links(user_id);
CREATE INDEX idx_assignment_widget_links_brief_id ON assignment_widget_links(assignment_brief_id);
CREATE INDEX idx_assignment_widget_links_assignment_id ON assignment_widget_links(assignment_id) WHERE assignment_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Users can only access their own data
-- ============================================================================

-- Enable RLS
ALTER TABLE user_assignment_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_widget_links ENABLE ROW LEVEL SECURITY;

-- user_assignment_briefs policies
CREATE POLICY user_assignment_briefs_select ON user_assignment_briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_assignment_briefs_insert ON user_assignment_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_assignment_briefs_update ON user_assignment_briefs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_assignment_briefs_delete ON user_assignment_briefs
  FOR DELETE USING (auth.uid() = user_id);

-- user_exam_dates policies
CREATE POLICY user_exam_dates_select ON user_exam_dates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_exam_dates_insert ON user_exam_dates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_exam_dates_update ON user_exam_dates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_exam_dates_delete ON user_exam_dates
  FOR DELETE USING (auth.uid() = user_id);

-- assignment_widget_links policies
CREATE POLICY assignment_widget_links_select ON assignment_widget_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY assignment_widget_links_insert ON assignment_widget_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY assignment_widget_links_update ON assignment_widget_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY assignment_widget_links_delete ON assignment_widget_links
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Auto-update updated_at timestamp on row changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_assignment_briefs_updated_at
  BEFORE UPDATE ON user_assignment_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exam_dates_updated_at
  BEFORE UPDATE ON user_exam_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_widget_links_updated_at
  BEFORE UPDATE ON assignment_widget_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_assignment_briefs IS 'Stores assignment brief details from PDF/DOCX uploads or manual entry';
COMMENT ON COLUMN user_assignment_briefs.rubric_json IS 'JSON object with rubric criteria percentages: {knowledge: 30, analysis: 30, communication: 25, research: 15}';
COMMENT ON COLUMN user_assignment_briefs.needs_review IS 'True if extracted data needs user confirmation/editing';

COMMENT ON TABLE user_exam_dates IS 'Stores exam dates from manual entry or PDF import';

COMMENT ON TABLE assignment_widget_links IS 'Links assignment briefs to Assignment Widget sessions for resuming work at last stage';
