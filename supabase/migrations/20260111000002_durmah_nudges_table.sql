-- Durmah Smart Nudges: Throttling System
-- Prevents nagging and allows user control over nudge frequency

CREATE TABLE IF NOT EXISTS public.durmah_nudges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  nudge_type text NOT NULL CHECK (nudge_type IN ('deadline_warning', 'progress_check', 'encouragement', 'general')),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  dismissed_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_durmah_nudges_user_id ON public.durmah_nudges(user_id);
CREATE INDEX IF NOT EXISTS idx_durmah_nudges_assignment_id ON public.durmah_nudges(assignment_id);
CREATE INDEX IF NOT EXISTS idx_durmah_nudges_type ON public.durmah_nudges(nudge_type);

-- Enable RLS
ALTER TABLE public.durmah_nudges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/write own nudges
CREATE POLICY "Users can manage their own nudges"
ON public.durmah_nudges
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.durmah_nudges IS 'Tracks Durmah nudge frequency to prevent irritation and respect user preferences';
COMMENT ON COLUMN public.durmah_nudges.nudge_type IS 'Type of nudge: deadline_warning (due <=3d), progress_check, encouragement, general';
COMMENT ON COLUMN public.durmah_nudges.dismissed_until IS 'If set, user snoozed this nudge';
