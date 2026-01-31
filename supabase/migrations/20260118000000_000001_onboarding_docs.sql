-- Migration: Create onboarding documentation table
-- Purpose: Store structured onboarding guides and system integration docs for Durmah to reference

CREATE TABLE IF NOT EXISTS public.onboarding_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Document metadata
  doc_type TEXT NOT NULL, -- 'system_guide', 'onboarding_step', 'faq', 'troubleshooting'
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT, -- 'timetable', 'assignments', 'lectures', 'general'
  
  -- Content
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  summary TEXT,
  
  -- Targeting
  year_level INT[], -- [1,2,3] for which year students this applies to
  module_codes TEXT[], -- ['LAW1071', 'LAW1051'] specific modules if applicable
  
  -- Durmah AI context
  keywords TEXT[], -- Searchable terms for Durmah to match user questions
  related_questions TEXT[], -- Common phrasings students might use
  
  -- Priority / visibility
  is_published BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  -- Media
  screenshots JSONB, -- [{path: '/assets/...', caption: '...'}]
  video_url TEXT
);

-- Indexes
CREATE INDEX idx_onboarding_docs_type ON public.onboarding_docs(doc_type);
CREATE INDEX idx_onboarding_docs_category ON public.onboarding_docs(category);
CREATE INDEX idx_onboarding_docs_published ON public.onboarding_docs(is_published);
CREATE INDEX idx_onboarding_docs_slug ON public.onboarding_docs(slug);

-- Full-text search on content and keywords
CREATE INDEX idx_onboarding_docs_search ON public.onboarding_docs USING GIN (
  (setweight(to_tsvector('english', title), 'A') ||
   setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
   setweight(to_tsvector('english', content_markdown), 'C'))
);

-- RLS Policies (read-only for authenticated users)
ALTER TABLE public.onboarding_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Onboarding docs are viewable by authenticated users"
  ON public.onboarding_docs
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Note: For admin management, use service_role key or add admin check later
-- when profiles table has proper admin column

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_onboarding_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_onboarding_docs_updated_at
  BEFORE UPDATE ON public.onboarding_docs
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_docs_updated_at();

-- Insert seed data: Timetable sync guide
INSERT INTO public.onboarding_docs (
  doc_type,
  title,
  slug,
  category,
  content_markdown,
  summary,
  year_level,
  keywords,
  related_questions,
  display_order
) VALUES (
  'system_guide',
  'Sync Your Durant Timetable',
  'sync-timetable-mytimetable',
  'timetable',
  E'# How to Sync Your Timetable from MyTimetable\n\n1. Go to [mytimetable.durham.ac.uk/calendar](https://mytimetable.durham.ac.uk/calendar)\n2. Click the **☰ menu** (top left)\n3. Select **Settings / Export**\n4. Set **"Publish Calendar"** to **Yes**\n5. Copy the **Calendar Link** (ends in `.ics`)\n6. Paste into Caseway → Settings → Timetable Sync\n\nYour schedule will now auto-update! 📅',
  'Learn how to export your Durham timetable as a .ics calendar link and sync it with Caseway for automatic schedule updates.',
  ARRAY[1,2,3],
  ARRAY['timetable', 'sync', 'calendar', 'ics', 'mytimetable', 'schedule', 'lectures'],
  ARRAY[
    'How do I sync my timetable?',
    'Where can I download my schedule?',
    'How do I get my .ics file?',
    'My lectures aren''t showing',
    'Timetable not updating'
  ],
  1
);

-- Insert seed data: Assignment finding guide
INSERT INTO public.onboarding_docs (
  doc_type,
  title,
  slug,
  category,
  content_markdown,
  summary,
  year_level,
  keywords,
  related_questions,
  display_order
) VALUES (
  'system_guide',
  'Find Assignment Details in Blackboard',
  'find-assignments-blackboard',
  'assignments',
  E'# How to Find Assignment Details\n\n1. Open your module in Blackboard\n2. Expand **"Assessment Information"** folder\n3. Look for:\n   - **Formative Assessment** (practice essays)\n   - **Summative Assessment** (graded coursework)\n   - **Marking Criteria** (grading rubric)\n4. Download the assignment PDF and marking criteria\n5. Upload to Caseway → Assignments\n\nNow Durmah can help you plan your essay structure! 📝',
  'Step-by-step guide to locating essay questions, marking criteria, and submission deadlines in Durham Blackboard.',
  ARRAY[1,2,3],
  ARRAY['assignments', 'essay', 'blackboard', 'marking criteria', 'deadline', 'submission', 'assessment'],
  ARRAY[
    'Where are assignment questions?',
    'How do I find marking criteria?',
    'When is my essay due?',
    'Where do I submit my work?',
    'Can''t find my assignment'
  ],
  2
);

-- Insert seed data: Lecture recordings guide  
INSERT INTO public.onboarding_docs (
  doc_type,
  title,
  slug,
  category,
  content_markdown,
  summary,
  year_level,
  keywords,
  related_questions,
  display_order
) VALUES (
  'system_guide',
  'Access Lecture Recordings (Encore/Panopto)',
  'access-lecture-recordings',
  'lectures',
  E'# How to Access Lecture Recordings\n\n1. Open your module in Blackboard\n2. Click **"Books & Tools"** (right sidebar)\n3. Select **"Encore - Recordings Folder"**\n4. If you see a cookie message, click **"here"** to open in new tab\n5. Browse recordings by date or search by keyword\n6. Copy link to Caseway → My Lectures for AI transcription\n\n**Note**: Not all modules record lectures. If Encore isn''t available, recordings aren''t enabled for that module. 🎥',
  'Learn how to find and access lecture recordings through Durham''s Encore/Panopto system.',
  ARRAY[1,2,3],
  ARRAY['lectures', 'recordings', 'encore', 'panopto', 'videos', 'playback'],
  ARRAY[
    'Where are lecture recordings?',
    'How do I watch lectures?',
    'Can I download lectures?',
    'Where is Encore?',
    'Lecture videos not showing'
  ],
  3
);

COMMENT ON TABLE public.onboarding_docs IS 'Structured onboarding and system integration documentation for students, searchable by Durmah AI';
