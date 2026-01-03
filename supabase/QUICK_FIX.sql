-- QUICK FIX: Run this first to create missing profiles
-- This is a simplified version that should work immediately

-- Count current status
SELECT 
  'Auth Users' as layer,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as layer,
  COUNT(*) as count
FROM public.profiles;

-- Create missing profiles for ANY auth user without one
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
    split_part(u.email, '@', 1),
    'User'
  ) as display_name,
  'year1' as year_of_study,
  'year1' as year_group,
  'student' as user_role,
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Update specific accounts
UPDATE public.profiles
SET 
  display_name = 'Bhavani',
  year_of_study = 'year2',
  year_group = 'year2',
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'ttboss65@gmail.com');

UPDATE public.profiles
SET 
  display_name = COALESCE(display_name, 'M Chandramohan'),
  year_of_study = COALESCE(year_of_study, 'year1'),
  year_group = COALESCE(year_group, 'year1'),
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'mohan0265@gmail.com');

-- Verify results
SELECT 
  u.id,
  u.email,
  p.display_name,
  p.year_of_study,
  p.user_role,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
