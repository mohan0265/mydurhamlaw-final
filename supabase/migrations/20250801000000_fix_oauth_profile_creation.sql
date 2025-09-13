-- Fix OAuth profile creation with better error handling and metadata support
-- This migration ensures the handle_new_user function works properly with OAuth metadata

-- Update handle_new_user function to better handle OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_year_group TEXT;
    default_display_name TEXT;
BEGIN
    -- Only create profile if one doesn't already exist
    -- This prevents conflicts with manual profile creation in LoginRedirectPage
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        
        -- Set default year group with better fallback
        default_year_group := COALESCE(
            NEW.raw_user_meta_data->>'year_group',
            'year1'
        );
        
        -- Set default display name with multiple fallbacks
        default_display_name := COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1),
            'User'
        );
        
        -- Validate year_group before inserting
        IF default_year_group NOT IN ('foundation', 'year1', 'year2', 'year3') THEN
            default_year_group := 'year1';
        END IF;
        
        BEGIN
            INSERT INTO public.profiles (
                id,
                year_group,
                agreed_to_terms,
                display_name,
                avatar_url
            ) VALUES (
                NEW.id,
                default_year_group,
                COALESCE((NEW.raw_user_meta_data->>'agreed_to_terms')::boolean, TRUE),
                default_display_name,
                COALESCE(
                    NEW.raw_user_meta_data->>'avatar_url',
                    NEW.raw_user_meta_data->>'picture'
                )
            );
            
            -- Log successful profile creation
            RAISE LOG 'Profile created successfully for user %', NEW.id;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Profile already exists, this is fine
                RAISE LOG 'Profile already exists for user %', NEW.id;
            WHEN OTHERS THEN
                -- Log the error but don't fail the user creation
                RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add an index to improve profile lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Update RLS policies to be more permissive for profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.uid() IS NULL  -- Allow trigger function to insert
    );

-- Add a policy for service role to insert profiles (for triggers)
CREATE POLICY "Service role can insert profiles" ON public.profiles
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Ensure the updated_at trigger is working
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();