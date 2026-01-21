-- Fixed Migration: Create durmah_sessions table
-- Step 1: Drop existing table if it exists (to start clean)
DROP TABLE IF EXISTS public.durmah_sessions CASCADE;

-- Step 2: Create durmah_sessions table
CREATE TABLE public.durmah_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('widget', 'lecture', 'assignment', 'wellbeing', 'community')),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'lecture', 'assignment', 'thread')),
  scope_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMPTZ,
  saved BOOLEAN DEFAULT FALSE NOT NULL,
  message_count INTEGER DEFAULT 0 NOT NULL,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Step 3: Create indexes
CREATE INDEX idx_durmah_sessions_user_saved ON public.durmah_sessions(user_id, saved) WHERE saved = TRUE;
CREATE INDEX idx_durmah_sessions_user_created ON public.durmah_sessions(user_id, created_at DESC);
CREATE INDEX idx_durmah_sessions_scope ON public.durmah_sessions(scope, scope_id) WHERE scope_id IS NOT NULL;

-- Step 4: Enable RLS
ALTER TABLE public.durmah_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
CREATE POLICY "Users can view own sessions" ON public.durmah_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.durmah_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.durmah_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.durmah_sessions FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.durmah_sessions SET message_count = message_count + 1, last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.durmah_sessions SET message_count = GREATEST(0, message_count - 1) WHERE id = OLD.conversation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS trigger_update_session_message_count ON public.durmah_messages;
CREATE TRIGGER trigger_update_session_message_count AFTER INSERT OR DELETE ON public.durmah_messages FOR EACH ROW EXECUTE FUNCTION update_session_message_count();

-- Step 8: Create RPC function
CREATE OR REPLACE FUNCTION get_saved_sessions(limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (id TEXT, source TEXT, scope TEXT, scope_id TEXT, title TEXT, created_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, message_count INTEGER, last_message_at TIMESTAMPTZ, first_message_preview TEXT) AS $$
BEGIN
  RETURN QUERY SELECT s.id, s.source, s.scope, s.scope_id, s.title, s.created_at, s.closed_at, s.message_count, s.last_message_at, (SELECT content FROM public.durmah_messages m WHERE m.conversation_id = s.id ORDER BY m.created_at ASC LIMIT 1) as first_message_preview FROM public.durmah_sessions s WHERE s.user_id = auth.uid() AND s.saved = TRUE ORDER BY s.last_message_at DESC NULLS LAST, s.created_at DESC LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.durmah_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_saved_sessions(INTEGER, INTEGER) TO authenticated;
