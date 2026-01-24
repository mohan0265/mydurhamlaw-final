-- supabase/migrations/20260125004000_user_preferences.sql

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_deadline_countdown boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own preferences') THEN
        CREATE POLICY "Users can manage their own preferences" 
            ON public.user_preferences 
            FOR ALL 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_preferences_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_preferences_updated_at();
