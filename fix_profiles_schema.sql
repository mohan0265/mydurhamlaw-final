-- Fix profiles table schema and ensure proper user profile creation
-- This SQL is idempotent and can be run multiple times safely

-- Ensure profiles table has correct structure
-- Note: We're not dropping the table, just ensuring columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Make user_id the primary key if id doesn't exist or if we need to migrate
-- First check if we need to set user_id as the primary key
DO $$ 
BEGIN
    -- If there's no primary key constraint on id, set user_id as primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%id%'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
    END IF;
    
    -- If id column exists and user_id is empty, migrate data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'id'
    ) THEN
        UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    END IF;
END $$;

-- Ensure year_group column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS year_group TEXT;

-- Add constraint for year_group values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_year_group_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_year_group_check 
        CHECK (year_group IN ('foundation', 'year1', 'year2', 'year3') OR year_group IS NULL);
    END IF;
END $$;

-- Ensure user_type column exists (for compatibility)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Create or replace the function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, id, created_at)
    VALUES (NEW.id, NEW.id, NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

-- Create RLS policies
CREATE POLICY "profiles_self_select" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_self_update" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid()) 
    WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Success message
SELECT 'Profiles table schema updated successfully!' as status;