
-- Caseway Termstart 2025 - Complete Schema Migration
-- This migration creates all tables required for the 72-hour upgrade

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create updated users table (extend existing profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  year TEXT DEFAULT 'year1',
  modules TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  timezone TEXT DEFAULT 'Europe/London',
  consent_wellbeing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session logs for Pomodoro and study tracking
CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT,
  duration_min INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spaced repetition cards
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  ef FLOAT DEFAULT 2.5, -- Ease Factor for SM-2 algorithm
  interval INTEGER DEFAULT 1, -- Days until next review
  repetitions INTEGER DEFAULT 0,
  due_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments with IRAC structure
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  module TEXT,
  integrity_level TEXT DEFAULT 'study_aid' CHECK (integrity_level IN ('study_aid', 'research', 'draft', 'final')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'submitted')),
  -- IRAC Structure
  issue TEXT,
  research TEXT,
  analysis TEXT,
  draft TEXT,
  -- Metadata
  word_count INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OSCOLA references for assignments
CREATE TABLE IF NOT EXISTS public.oscola_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('case', 'statute', 'book', 'article', 'website', 'other')),
  raw JSONB NOT NULL, -- Store raw input data
  formatted TEXT NOT NULL, -- OSCOLA formatted string
  validation_notes TEXT[], -- Any formatting warnings or suggestions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer profiles for networking
CREATE TABLE IF NOT EXISTS public.peer_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  tags TEXT[] DEFAULT '{}', -- Interest tags like 'Contract Law', 'Mooting', etc.
  availability JSONB DEFAULT '{}', -- Available hours, study preferences
  goals TEXT[] DEFAULT '{}',
  year TEXT,
  score FLOAT DEFAULT 0.0, -- Compatibility/reputation score
  is_public BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood tracking for wellbeing
CREATE TABLE IF NOT EXISTS public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  stressors TEXT[] DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection requests for peer matching
CREATE TABLE IF NOT EXISTS public.peer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS session_logs_user_id_idx ON public.session_logs(user_id);
CREATE INDEX IF NOT EXISTS session_logs_started_at_idx ON public.session_logs(started_at);
CREATE INDEX IF NOT EXISTS cards_user_id_idx ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS cards_due_at_idx ON public.cards(due_at);
CREATE INDEX IF NOT EXISTS assignments_user_id_idx ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS assignments_status_idx ON public.assignments(status);
CREATE INDEX IF NOT EXISTS oscola_refs_assignment_id_idx ON public.oscola_refs(assignment_id);
CREATE INDEX IF NOT EXISTS peer_profiles_is_public_idx ON public.peer_profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS peer_profiles_tags_idx ON public.peer_profiles USING GIN(tags);
CREATE INDEX IF NOT EXISTS moods_user_id_idx ON public.moods(user_id);
CREATE INDEX IF NOT EXISTS moods_created_at_idx ON public.moods(created_at);
CREATE INDEX IF NOT EXISTS peer_connections_requester_idx ON public.peer_connections(requester_id);
CREATE INDEX IF NOT EXISTS peer_connections_addressee_idx ON public.peer_connections(addressee_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oscola_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read/write their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Session logs: Users can only access their own session logs
CREATE POLICY "Users can manage own session logs" ON public.session_logs
  FOR ALL USING (auth.uid() = user_id);

-- Cards: Users can only access their own cards
CREATE POLICY "Users can manage own cards" ON public.cards
  FOR ALL USING (auth.uid() = user_id);

-- Assignments: Users can only access their own assignments
CREATE POLICY "Users can manage own assignments" ON public.assignments
  FOR ALL USING (auth.uid() = user_id);

-- OSCOLA refs: Users can access refs for their own assignments
CREATE POLICY "Users can manage oscola refs for own assignments" ON public.oscola_refs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assignments 
      WHERE assignments.id = oscola_refs.assignment_id 
      AND assignments.user_id = auth.uid()
    )
  );

-- Peer profiles: Public profiles visible to all authenticated users, private to owner
CREATE POLICY "Public peer profiles visible to all" ON public.peer_profiles
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');
CREATE POLICY "Users can manage own peer profile" ON public.peer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Moods: Users can only access their own mood data
CREATE POLICY "Users can manage own moods" ON public.moods
  FOR ALL USING (auth.uid() = user_id);

-- Peer connections: Users can see connections they're involved in
CREATE POLICY "Users can manage peer connections" ON public.peer_connections
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_oscola_refs_updated_at
  BEFORE UPDATE ON public.oscola_refs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_peer_profiles_updated_at
  BEFORE UPDATE ON public.peer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_peer_connections_updated_at
  BEFORE UPDATE ON public.peer_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper functions for aggregations

-- Get user's study minutes for a date range
CREATE OR REPLACE FUNCTION get_study_minutes(
  user_uuid UUID,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_min), 0)::INTEGER
    FROM public.session_logs
    WHERE user_id = user_uuid
      AND started_at >= start_date
      AND started_at <= end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's mood trend for last N days
CREATE OR REPLACE FUNCTION get_mood_trend(
  user_uuid UUID,
  days INTEGER DEFAULT 14
)
RETURNS TABLE (
  date DATE,
  avg_score DECIMAL,
  entry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    AVG(score)::DECIMAL(3,2) as avg_score,
    COUNT(*)::INTEGER as entry_count
  FROM public.moods
  WHERE user_id = user_uuid
    AND created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get compatible peers (basic matching algorithm)
CREATE OR REPLACE FUNCTION get_compatible_peers(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  tags TEXT[],
  year TEXT,
  score FLOAT,
  common_tags INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_tags AS (
    SELECT tags FROM public.peer_profiles WHERE user_id = user_uuid
  )
  SELECT 
    p.user_id,
    p.display_name,
    p.tags,
    p.year,
    p.score,
    (
      SELECT COUNT(*)::INTEGER
      FROM unnest(p.tags) tag
      WHERE tag = ANY((SELECT tags FROM user_tags))
    ) as common_tags
  FROM public.peer_profiles p
  WHERE p.user_id != user_uuid
    AND p.is_public = true
  ORDER BY common_tags DESC, p.score DESC, p.last_active DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert default data for testing (optional)
-- This will be populated by the application during signup
