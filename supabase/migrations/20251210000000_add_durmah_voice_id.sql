-- Add durmah_voice_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS durmah_voice_id TEXT DEFAULT 'warm_female';

-- Update RLS policies to ensure users can update this field (already covered by "Users can update own profile" but good to verify)
-- The existing policy "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) covers this.
