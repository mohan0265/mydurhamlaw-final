-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ics_uploaded BOOLEAN DEFAULT FALSE,
  module_handbooks_uploaded BOOLEAN DEFAULT FALSE,
  lecture_links_set BOOLEAN DEFAULT FALSE,
  module_page_screenshot_uploaded BOOLEAN DEFAULT FALSE,
  
  -- Dismissal state
  dismissed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding state"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding state"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding state"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Create lecture_links_config table
CREATE TABLE IF NOT EXISTS public.lecture_links_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'Panopto', -- Panopto or Echo360
  folder_url TEXT,
  url_template TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for lecture_links_config
ALTER TABLE public.lecture_links_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lecture config"
  ON public.lecture_links_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lecture config"
  ON public.lecture_links_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lecture config"
  ON public.lecture_links_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Add real-time if needed (optional)
alter publication supabase_realtime add table public.user_onboarding;
