-- MyDurhamLaw Database Diagnostics & Admin Queries
-- Run these in Supabase SQL Editor to understand and fix current state

-- ===================================
-- STEP 1: Basic Health Check
-- ===================================

-- Count users in each layer
SELECT 
  'Auth Users' as layer,
  COUNT(*) as count
FROM auth.users
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Profiles' as layer,
  COUNT(*) as count
FROM public.profiles;

-- Expected result: Both should have same count


-- ===================================
-- STEP 2: Find Missing Profiles
-- ===================================

-- Auth users without profiles (CRITICAL ISSUE)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_metadata->>'display_name' as oauth_name,
  'NO PROFILE!' as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL;

-- If this returns rows, profiles weren't created on signup!


-- ===================================
-- STEP 3: Current User Data Audit
-- ===================================

SELECT 
  u.id as auth_id,
  u.email,
  u.created_at as signup_date,
  
  -- From auth metadata
  u.raw_user_metadata->>'display_name' as oauth_display_name,
  u.raw_user_metadata->>'year_group' as oauth_year_group,
  
  -- From profiles  
  p.id as profile_id,
  p.user_id as profile_user_id_col,
  p.display_name as profile_display_name,
  p.year_of_study,
  p.year_group,
  p.user_role,
  p.trial_ends_at,
  p.is_test_account,
  
  -- Status checks
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.display_name IS NULL THEN '⚠️ NO NAME'
    WHEN p.year_of_study IS NULL THEN '⚠️ NO YEAR'
    ELSE '✅ OK'
  END as status

FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;


-- ===================================
-- STEP 4: Fix Specific Known Accounts
-- ===================================

-- Fix ttboss65@gmail.com (Bhavani, Year 2)
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_uuid FROM auth users WHERE email = 'ttboss65@gmail.com';
  
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found: ttboss65@gmail.com';
    RETURN;
  END IF;
  
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid) THEN
    -- Update existing profile
    UPDATE public.profiles
    SET 
      display_name = 'Bhavani',
      year_of_study = 'year2',
      year_group = 'year2',
      user_role = 'student',
      updated_at = NOW()
    WHERE id = user_uuid;
    RAISE NOTICE 'Updated profile for Bhavani';
  ELSE
    -- Create missing profile
    INSERT INTO public.profiles (
      id, user_id, display_name, year_of_study, year_group, user_role,
      created_at, updated_at
    ) VALUES (
      user_uuid, user_uuid, 'Bhavani', 'year2', 'year2', 'student',
      NOW(), NOW()
    );
    RAISE NOTICE 'Created profile for Bhavani';
  END IF;
END $$;


-- Fix mohan0265@gmail.com
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid FROM auth.users WHERE  = 'mohan0265@gmail.com';
  
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found: mohan0265@gmail.com';
    RETURN;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid) THEN
    UPDATE public.profiles
    SET 
      display_name = COALESCE(display_name, 'M Chandramohan'),
      year_of_study = COALESCE(year_of_study, 'year1'),
      year_group = COALESCE(year_group, 'year1'),
      user_role = 'student',
      updated_at = NOW()
    WHERE id = user_uuid;
    RAISE NOTICE 'Updated profile for mohan0265';
  ELSE
    INSERT INTO public.profiles (
      id, user_id, display_name, year_of_study, year_group, user_role,
      created_at, updated_at
    ) VALUES (
      user_uuid, user_uuid, 'M Chandramohan', 'year1', 'year1', 'student',
      NOW(), NOW()
    );
    RAISE NOTICE 'Created profile for mohan0265';
  END IF;
END $$;


-- ===================================
-- STEP 5: Bulk Fix All Missing Profiles
-- ===================================

-- Create profiles for ALL auth users that don't have one
INSERT INTO public.profiles (
  id,
  user_id,
  display_name,
  year_of_study,
  year_group,
  user_role,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.id as user_id,
  COALESCE(
    u.raw_user_metadata->>'display_name',
    u.raw_user_metadata->>'full_name',
    split_part(u.email, '@', 1)
  ) as display_name,
  COALESCE(
    u.raw_user_metadata->>'year_group',
    u.raw_user_metadata->>'user_type',
    'year1'
  ) as year_of_study,
  COALESCE(
    u.raw_user_metadata->>'year_group',
    u.raw_user_metadata->>'user_type',
    'year1'
  ) as year_group,
  'student' as user_role,
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
  AND u.deleted_at IS NULL
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  year_of_study = EXCLUDED.year_of_study,
  updated_at = NOW();


-- ===================================
-- STEP 6: Create Admin View
-- ===================================

DROP VIEW IF EXISTS admin_user_overview;

CREATE OR REPLACE VIEW admin_user_overview AS
SELECT 
  -- IDs
  u.id,
  
  -- Auth data
  u.email,
  u.created_at as signup_date,
  u.last_sign_in_at,
  
  -- Profile data
  p.display_name,
  p.year_of_study,
  COALESCE(p.year_group, p.year_of_study) as year_group,
  p.user_role,
  p.degree_type,
  
  -- Trial tracking
  p.trial_started_at,
  p.trial_ends_at,
  p.trial_ever_used,
  COALESCE(p.subscription_status, 'trial') as subscription_status,
  p.subscription_ends_at,
  
  -- Flags
  COALESCE(p.is_test_account, false) as is_test_account,
  
  -- Computed
  CASE 
    WHEN p.trial_ends_at IS NULL AND p.trial_started_at IS NOT NULL THEN 'No end date set'
    WHEN p.trial_ends_at IS NULL THEN 'Not started'
    WHEN p.trial_ends_at > NOW() THEN 'Active'
    ELSE 'Expired'
  END as trial_status,
  
  CASE 
    WHEN p.trial_ends_at > NOW() THEN 
      CEIL(EXTRACT(EPOCH FROM (p.trial_ends_at - NOW())) / 86400)
    ELSE 0 
  END as trial_days_left,
  
  -- Data completeness
  CASE 
    WHEN p.id IS NULL THEN 'NO PROFILE'
    WHEN p.display_name IS NULL THEN 'Missing name'
    WHEN p.year_of_study IS NULL THEN 'Missing year'
    ELSE 'Complete'
  END as data_status

FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;

-- Grant access
GRANT SELECT ON admin_user_overview TO authenticated;


-- ===================================
-- STEP 7: Verify Fixes
-- ===================================

-- View all users summary
SELECT * FROM admin_user_overview;

-- Check for remaining issues
SELECT 
  data_status,
  COUNT(*) as count
FROM admin_user_overview
GROUP BY data_status;

-- Year distribution
SELECT 
  year_of_study,
  COUNT(*) as count
FROM admin_user_overview
WHERE user_role = 'student'
GROUP BY year_of_study
ORDER BY year_of_study;

-- Trial status summary
SELECT 
  trial_status,
  COUNT(*) as count,
  STRING_AGG(display_name || ' (' || email || ')', ', ') as users
FROM admin_user_overview
GROUP BY trial_status;
