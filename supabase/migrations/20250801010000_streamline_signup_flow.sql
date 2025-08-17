-- Streamline signup flow - disable automatic profile creation for better UX
-- Users will now go through: Google OAuth → Complete Profile page → Manual profile creation

-- Update handle_new_user function to NOT automatically create profiles
-- This gives users the chance to complete their profile on the dedicated page
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- For the streamlined signup flow, we DON'T automatically create profiles
    -- Users will complete their profile on the /complete-profile page after OAuth
    -- This prevents issues with missing metadata and gives better UX
    
    -- Just log the user creation for debugging
    RAISE LOG 'New user created: % (email: %)', NEW.id, NEW.email;
    
    -- Return without creating a profile - let the user complete it manually
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up (though it won't create profiles anymore)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to the profiles table for clarity
COMMENT ON TABLE public.profiles IS 'User profiles are now created manually through the /complete-profile page after Google OAuth, providing better UX and data accuracy.';

-- Create an index for faster profile lookups during the auth flow
CREATE INDEX IF NOT EXISTS idx_profiles_lookup ON public.profiles(id, year_group, display_name);

-- Ensure RLS policies are optimized for the new flow
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update policy for profile reads to be more permissive for auth checks
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Keep update policy as is
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);