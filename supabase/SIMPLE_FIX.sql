-- ULTRA SIMPLE FIX - No complex queries, just basics
-- Run each section separately in Supabase SQL Editor

-- ===========================================
-- SECTION 1: Check Current State
-- ===========================================
-- Just see what you have
SELECT COUNT(*) as auth_user_count FROM auth.users;
SELECT COUNT(*) as profile_count FROM public.profiles;

-- ===========================================
-- SECTION 2: See Which Users Need Profiles
-- ===========================================
SELECT 
  u.id,
  u.email,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;

-- ===========================================
-- SECTION 3: Create Missing Profiles (Simple Version)
-- ===========================================
-- This creates a profile for any auth user that doesn't have one
-- Uses minimal columns to avoid errors

INSERT INTO public.profiles (id, display_name, created_at, updated_at)
SELECT 
  u.id,
  split_part(u.email, '@', 1) as display_name,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

-- ===========================================
-- SECTION 4: Fix Specific Accounts
-- ===========================================

-- Fix Bhavani (ttboss65@gmail.com)
UPDATE public.profiles
SET 
  display_name = 'Bhavani',
  year_of_study = 'year2',
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'ttboss65@gmail.com');

-- Fix mohan0265@gmail.com  
UPDATE public.profiles
SET 
  display_name = 'M Chandramohan',
  year_of_study = 'year1',
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'mohan0265@gmail.com');

-- ===========================================
-- SECTION 5: Verify Everything
-- ===========================================
SELECT 
  u.email,
  p.display_name,
  p.year_of_study,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;
