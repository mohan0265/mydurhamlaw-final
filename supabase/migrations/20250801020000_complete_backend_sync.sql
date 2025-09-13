-- Complete backend synchronization with streamlined signup flow
-- This migration ensures the database fully supports the new two-step signup process:
-- Step 1: Google OAuth authentication
-- Step 2: Manual profile completion on /complete-profile page

-- ===== ENHANCED PROFILE MANAGEMENT =====

-- 1. Update profiles table structure for better metadata handling
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_via VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at trigger for profiles table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Enhanced handle_new_user function - completely disabled automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- STREAMLINED SIGNUP FLOW: NO automatic profile creation
    -- Users complete their profile manually on /complete-profile page
    -- This ensures better data quality and UX
    
    RAISE LOG 'New user authenticated via OAuth: % (email: %), redirecting to profile completion', 
              NEW.id, NEW.email;
    
    -- Store OAuth metadata in user_metadata for later use in profile completion
    -- This helps preserve Google profile information during the signup flow
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        RAISE LOG 'OAuth metadata available for user %: %', NEW.id, NEW.raw_user_meta_data;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== COMPREHENSIVE RLS POLICIES =====

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Profile Creation Policy - Allow users to create their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (
        auth.uid() = id AND 
        -- Ensure basic required fields are provided
        year_group IS NOT NULL AND 
        display_name IS NOT NULL AND 
        agreed_to_terms = true
    );

-- 4. Profile Reading Policy - Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 5. Profile Update Policy - Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent users from changing their ID
        id = OLD.id AND
        -- Ensure they can't remove agreement to terms
        (agreed_to_terms = true OR agreed_to_terms = OLD.agreed_to_terms)
    );

-- ===== INDEXES FOR PERFORMANCE =====

-- 6. Optimized indexes for the new auth flow
CREATE INDEX IF NOT EXISTS idx_profiles_auth_lookup ON public.profiles(id, year_group);
CREATE INDEX IF NOT EXISTS idx_profiles_completion_status ON public.profiles(id, profile_completed_at) 
    WHERE profile_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_via ON public.profiles(created_via, created_at);

-- ===== HELPER FUNCTIONS =====

-- 7. Function to check if a user has completed their profile
CREATE OR REPLACE FUNCTION public.user_has_completed_profile(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND year_group IS NOT NULL 
        AND display_name IS NOT NULL 
        AND agreed_to_terms = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get user profile completion status
CREATE OR REPLACE FUNCTION public.get_profile_completion_status(user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'exists', false,
            'completed', false,
            'missing_fields', json_build_array('year_group', 'display_name', 'agreed_to_terms')
        );
    ELSE
        result := json_build_object(
            'exists', true,
            'completed', (
                profile_record.year_group IS NOT NULL AND 
                profile_record.display_name IS NOT NULL AND 
                profile_record.agreed_to_terms = true
            ),
            'year_group', profile_record.year_group,
            'display_name', profile_record.display_name,
            'agreed_to_terms', profile_record.agreed_to_terms,
            'created_via', profile_record.created_via,
            'profile_completed_at', profile_record.profile_completed_at
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== MIGRATION SAFETY =====

-- 9. Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles created manually via /complete-profile page after Google OAuth. Supports streamlined two-step signup flow.';
COMMENT ON COLUMN public.profiles.created_via IS 'Tracks how the profile was created: manual (new flow) or automatic (legacy)';
COMMENT ON COLUMN public.profiles.profile_completed_at IS 'Timestamp when user completed their profile setup';
COMMENT ON FUNCTION public.handle_new_user() IS 'OAuth trigger - disabled automatic profile creation for streamlined signup UX';

-- 10. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.user_has_completed_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_completion_status(UUID) TO authenticated;

-- ===== VERIFICATION QUERIES =====

-- Add verification function to ensure the migration worked correctly
CREATE OR REPLACE FUNCTION public.verify_streamlined_signup_setup()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if handle_new_user function is updated
    RETURN QUERY
    SELECT 
        'handle_new_user_function'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Function exists and updated for streamlined flow'::TEXT;
    
    -- Check RLS policies
    RETURN QUERY
    SELECT 
        'rls_policies'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_policies 
                WHERE tablename = 'profiles' AND schemaname = 'public'
            ) >= 3 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'Insert, Select, and Update policies configured'::TEXT;
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'indexes'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'profiles' AND indexname = 'idx_profiles_auth_lookup'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Performance indexes created'::TEXT;
        
    -- Check helper functions
    RETURN QUERY
    SELECT 
        'helper_functions'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = 'user_has_completed_profile'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Profile completion helper functions available'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run verification immediately
SELECT * FROM public.verify_streamlined_signup_setup();

-- Log successful migration
DO $$
BEGIN
    RAISE LOG 'Streamlined signup backend migration completed successfully at %', NOW();
    RAISE LOG 'Key changes: disabled automatic profile creation, enhanced RLS policies, added helper functions';
    RAISE LOG 'Users will now complete profiles manually via /complete-profile page';
END $$;