-- Assignment Assistant Database Schema
-- Adds support for PDF upload, stage tracking, and Durmah integration

-- 1. Assignment Briefs (uploaded PDFs/Word docs)
CREATE TABLE IF NOT EXISTS assignment_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT,
  file_url TEXT, -- Supabase storage URL
  parsed_text TEXT,
  parsed_data JSONB, -- {deadline, wordLimit, moduleCode, questionText, requirements, citationStyle}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assignment Stages (track progress through 6-stage workflow)
CREATE TABLE IF NOT EXISTS assignment_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage INT DEFAULT 1, -- 1-6
  stage_1_complete BOOLEAN DEFAULT FALSE, -- Understanding
  stage_2_complete BOOLEAN DEFAULT FALSE, -- Research
  stage_3_complete BOOLEAN DEFAULT FALSE, -- Structure
  stage_4_complete BOOLEAN DEFAULT FALSE, -- Drafting
  stage_5_complete BOOLEAN DEFAULT FALSE, -- Formatting
  stage_6_complete BOOLEAN DEFAULT FALSE, -- Review
  stage_data JSONB DEFAULT '{}', -- Stage-specific data
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Assignment Durmah Sessions (link Durmah chats to assignments)
CREATE TABLE IF NOT EXISTS assignment_durmah_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage INT, -- Which stage: 1-6
  transcript JSONB[] DEFAULT '{}', -- [{role, content, timestamp}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Research Notes per assignment
CREATE TABLE IF NOT EXISTS assignment_research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT, -- 'case', 'statute', 'article', 'book'
  citation TEXT, -- OSCOLA formatted
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Assignment Drafts (version control + AI usage tracking)
CREATE TABLE IF NOT EXISTS assignment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INT DEFAULT 1,
  content TEXT, -- Full essay text
  word_count INT DEFAULT 0,
  ai_usage_log JSONB DEFAULT '[]', -- [{action, timestamp, details}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OSCOLA Citations library
CREATE TABLE IF NOT EXISTS oscola_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  citation_text TEXT, -- Full OSCOLA formatted
  short_form TEXT, -- For subsequent mentions
  source_type TEXT, -- 'case', 'statute', 'book', 'article', 'web'
  footnote_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS has_brief BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS word_limit INT,
ADD COLUMN IF NOT EXISTS submission_requirements TEXT,
ADD COLUMN IF NOT EXISTS current_stage INT DEFAULT 0; -- 0 = not started, 1-6 = in progress

-- RLS Policies
ALTER TABLE assignment_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_durmah_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oscola_citations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own assignment briefs" ON assignment_briefs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assignment briefs" ON assignment_briefs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assignment briefs" ON assignment_briefs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assignment briefs" ON assignment_briefs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own assignment stages" ON assignment_stages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assignment stages" ON assignment_stages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assignment stages" ON assignment_stages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own durmah sessions" ON assignment_durmah_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own durmah sessions" ON assignment_durmah_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own durmah sessions" ON assignment_durmah_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own research notes" ON assignment_research_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own research notes" ON assignment_research_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own research notes" ON assignment_research_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own research notes" ON assignment_research_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own drafts" ON assignment_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON assignment_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON assignment_drafts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own citations" ON oscola_citations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own citations" ON oscola_citations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own citations" ON oscola_citations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own citations" ON oscola_citations FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_briefs_assignment_id ON assignment_briefs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_briefs_user_id ON assignment_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_stages_assignment_id ON assignment_stages(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_stages_user_id ON assignment_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_durmah_sessions_assignment_id ON assignment_durmah_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_research_notes_assignment_id ON assignment_research_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_drafts_assignment_id ON assignment_drafts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_oscola_citations_assignment_id ON oscola_citations(assignment_id);
