-- Migration: Add Staff List to User Modules & Link Lectures
-- Date: 2026-01-30

BEGIN;

-- 1. Update user_modules table
ALTER TABLE public.user_modules 
ADD COLUMN IF NOT EXISTS staff_names JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS staff_display TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Migrate existing 'lecturer' data (if it exists from previous ad-hoc schema)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_modules' AND column_name = 'lecturer') THEN
        -- Move existing lecturer text to staff_names array if staff_names is empty
        UPDATE public.user_modules
        SET staff_names = jsonb_build_array(lecturer),
            staff_display = lecturer
        WHERE lecturer IS NOT NULL 
          AND lecturer <> '' 
          AND (staff_names IS NULL OR jsonb_array_length(staff_names) = 0);
    END IF;
END $$;

-- 3. Update lectures table to link to user_modules
ALTER TABLE public.lectures
ADD COLUMN IF NOT EXISTS user_module_id UUID REFERENCES public.user_modules(id) ON DELETE SET NULL;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_lectures_user_module_id ON public.lectures(user_module_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_user_active ON public.user_modules(user_id) WHERE is_active = TRUE;

COMMIT;
