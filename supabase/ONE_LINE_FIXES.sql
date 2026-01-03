-- ONE-LINE FIXES - Run these one at a time if you want quick fixes

-- 1. Create profile for ttboss65 if missing
INSERT INTO public.profiles (id, display_name, year_of_study) 
SELECT id, 'Bhavani', 'year2' FROM auth.users WHERE email = 'ttboss65@gmail.com'
ON CONFLICT (id) DO UPDATE SET display_name = 'Bhavani', year_of_study = 'year2';

-- 2. Create profile for mohan0265 if missing
INSERT INTO public.profiles (id, display_name, year_of_study) 
SELECT id, 'M Chandramohan', 'year1' FROM auth.users WHERE email = 'mohan0265@gmail.com'
ON CONFLICT (id) DO UPDATE SET display_name = 'M Chandramohan', year_of_study = 'year1';

-- 3. Create profiles for ALL users that don't have one
INSERT INTO public.profiles (id, display_name) 
SELECT u.id, split_part(u.email, '@', 1) 
FROM auth.users u 
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

-- 4. Check results
SELECT u.email, p.display_name, p.year_of_study 
FROM auth.users u 
LEFT JOIN public.profiles p ON p.id = u.id;
