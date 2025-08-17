-- Enhanced Row Level Security (RLS) policies for streamlined signup flow
-- This migration adds advanced security policies and additional safeguards

-- ===== ADVANCED RLS POLICIES =====

-- 1. Policy for admins to view all profiles (for debugging and support)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT 
    USING (
        -- Only allow if user has admin role in auth.users metadata
        (auth.jwt() ->> 'role') = 'admin' OR
        -- Or if user is accessing their own profile
        auth.uid() = id
    );

-- 2. Enhanced delete policy - users can delete their own profiles
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- 3. Prevent profile duplication - ensure one profile per user
CREATE OR REPLACE FUNCTION public.prevent_duplicate_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists for this user
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'Profile already exists for user %. Use UPDATE instead of INSERT.', NEW.id;
    END IF;
    
    -- Set profile completion timestamp
    NEW.profile_completed_at = NOW();
    NEW.created_via = 'manual';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_duplicate_profiles_trigger ON public.profiles;
CREATE TRIGGER prevent_duplicate_profiles_trigger
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_profiles();

-- ===== SECURITY ENHANCEMENTS =====

-- 4. Function to validate year_group values
CREATE OR REPLACE FUNCTION public.is_valid_year_group(year_group TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN year_group IN ('foundation', 'year1', 'year2', 'year3');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Enhanced profile validation trigger
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate year_group
    IF NEW.year_group IS NOT NULL AND NOT public.is_valid_year_group(NEW.year_group) THEN
        RAISE EXCEPTION 'Invalid year_group: %. Must be one of: foundation, year1, year2, year3', NEW.year_group;
    END IF;
    
    -- Validate display_name (no empty strings, reasonable length)
    IF NEW.display_name IS NOT NULL THEN
        NEW.display_name = TRIM(NEW.display_name);
        IF LENGTH(NEW.display_name) < 1 OR LENGTH(NEW.display_name) > 100 THEN
            RAISE EXCEPTION 'Display name must be between 1 and 100 characters';
        END IF;
    END IF;
    
    -- Ensure agreed_to_terms is true if being set
    IF NEW.agreed_to_terms IS NOT NULL AND NEW.agreed_to_terms != true THEN
        RAISE EXCEPTION 'Users must agree to terms to create/update profile';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- ===== API HELPER FUNCTIONS =====

-- 6. Function for frontend to safely create profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_year_group TEXT,
    p_display_name TEXT,
    p_agreed_to_terms BOOLEAN DEFAULT true,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Profile already exists');
    END IF;
    
    -- Validate inputs
    IF p_year_group IS NULL OR p_display_name IS NULL OR p_agreed_to_terms != true THEN
        RETURN json_build_object('success', false, 'error', 'Missing required fields');
    END IF;
    
    -- Create profile
    BEGIN
        INSERT INTO public.profiles (
            id, 
            year_group, 
            display_name, 
            agreed_to_terms, 
            avatar_url,
            created_via,
            profile_completed_at
        ) VALUES (
            user_id, 
            p_year_group, 
            TRIM(p_display_name), 
            p_agreed_to_terms, 
            p_avatar_url,
            'manual',
            NOW()
        );
        
        result := json_build_object(
            'success', true, 
            'profile', json_build_object(
                'id', user_id,
                'year_group', p_year_group,
                'display_name', TRIM(p_display_name),
                'agreed_to_terms', p_agreed_to_terms,
                'avatar_url', p_avatar_url
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false, 
            'error', SQLERRM
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to safely update profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_year_group TEXT DEFAULT NULL,
    p_display_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Profile does not exist');
    END IF;
    
    -- Update profile with provided fields
    BEGIN
        UPDATE public.profiles 
        SET 
            year_group = COALESCE(p_year_group, year_group),
            display_name = COALESCE(TRIM(p_display_name), display_name),
            avatar_url = COALESCE(p_avatar_url, avatar_url),
            last_updated_at = NOW()
        WHERE id = user_id;
        
        -- Return updated profile
        SELECT json_build_object(
            'success', true,
            'profile', json_build_object(
                'id', id,
                'year_group', year_group,
                'display_name', display_name,
                'agreed_to_terms', agreed_to_terms,
                'avatar_url', avatar_url,
                'last_updated_at', last_updated_at
            )
        ) INTO result
        FROM public.profiles WHERE id = user_id;
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object('success', false, 'error', SQLERRM);
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== PERFORMANCE AND MONITORING =====

-- 8. View for monitoring profile completion rates
CREATE OR REPLACE VIEW public.profile_completion_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(p.id) as profiles_created,
    COUNT(CASE WHEN p.profile_completed_at IS NOT NULL THEN 1 END) as profiles_completed,
    ROUND(
        COUNT(p.id)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2
    ) as profile_creation_rate,
    AVG(EXTRACT(EPOCH FROM (p.profile_completed_at - u.created_at))/60) as avg_completion_time_minutes
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at >= NOW() - INTERVAL '30 days';

-- 9. Function to clean up incomplete OAuth sessions (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_incomplete_oauth_sessions()
RETURNS TABLE(
    users_cleaned INTEGER,
    details TEXT
) AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Find users created more than 24 hours ago without completed profiles
    WITH incomplete_users AS (
        SELECT u.id 
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE u.created_at < NOW() - INTERVAL '24 hours'
        AND (p.id IS NULL OR p.profile_completed_at IS NULL)
        AND u.email_confirmed_at IS NULL
    )
    SELECT COUNT(*) INTO cleanup_count FROM incomplete_users;
    
    RETURN QUERY SELECT 
        cleanup_count,
        CASE 
            WHEN cleanup_count > 0 THEN 
                'Found ' || cleanup_count || ' incomplete OAuth sessions older than 24 hours'
            ELSE 
                'No cleanup needed'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== GRANTS AND PERMISSIONS =====

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_year_group(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_incomplete_oauth_sessions() TO postgres;

-- Grant view access to admins only
GRANT SELECT ON public.profile_completion_stats TO postgres;

-- ===== FINAL VERIFICATION =====

-- Create comprehensive verification function
CREATE OR REPLACE FUNCTION public.verify_enhanced_rls_setup()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check triggers
    RETURN QUERY
    SELECT 
        'validation_triggers'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.triggers 
                WHERE trigger_name = 'validate_profile_data_trigger'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Profile validation triggers active'::TEXT;
    
    -- Check helper functions
    RETURN QUERY
    SELECT 
        'api_functions'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_proc p 
                JOIN pg_namespace n ON p.pronamespace = n.oid 
                WHERE n.nspname = 'public' AND p.proname = 'create_user_profile'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'API helper functions available'::TEXT;
    
    -- Check RLS policies count
    RETURN QUERY
    SELECT 
        'rls_policies_enhanced'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM pg_policies 
                WHERE tablename = 'profiles' AND schemaname = 'public'
            ) >= 4 THEN 'OK'::TEXT
            ELSE 'INCOMPLETE'::TEXT
        END,
        'Enhanced RLS policies configured'::TEXT;
        
    -- Check monitoring views
    RETURN QUERY
    SELECT 
        'monitoring_views'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_name = 'profile_completion_stats'
            ) THEN 'OK'::TEXT
            ELSE 'MISSING'::TEXT
        END,
        'Monitoring and analytics views created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run verification
SELECT * FROM public.verify_enhanced_rls_setup();

-- Final log
DO $$
BEGIN
    RAISE LOG 'Enhanced RLS policies migration completed at %', NOW();
    RAISE LOG 'Added: validation triggers, API functions, monitoring views, security policies';
END $$;