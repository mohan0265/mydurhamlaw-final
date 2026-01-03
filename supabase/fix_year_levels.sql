-- Fix Year Level Data Inconsistency
-- Run this in Supabase SQL Editor

-- STEP 1: Sync year_group to match year_of_study (make year_of_study the source of truth)
UPDATE public.profiles
SET year_group = year_of_study,
    updated_at = NOW()
WHERE year_group != year_of_study
   OR (year_group IS NULL AND year_of_study IS NOT NULL);

-- STEP 2: Verify the fix
SELECT 
  id,
  display_name,
  year_group,
  year_of_study,
  CASE 
    WHEN year_group = year_of_study THEN '✅ Match'
    WHEN year_group IS NULL AND year_of_study IS NULL THEN '⚠️ Both NULL'
    ELSE '❌ MISMATCH!'
  END as status
FROM public.profiles
ORDER BY display_name;

-- STEP 3: Specific fix for known accounts
UPDATE public.profiles
SET 
  year_group = 'year2',
  year_of_study = 'year2',
  updated_at = NOW()
WHERE display_name = 'Bhavani';

UPDATE public.profiles
SET 
  year_group = 'year1',
  year_of_study = 'year1',
  updated_at = NOW()
WHERE display_name = 'M Chandramohan';

-- STEP 4: Final verification
SELECT 
  display_name,
  year_group,
  year_of_study,
  user_role
FROM public.profiles
WHERE user_role = 'student'
ORDER BY display_name;
