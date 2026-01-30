-- Add academic_item_id to existing tables
DO $$ 
BEGIN
    -- Lectures
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lectures' AND column_name = 'academic_item_id') THEN
        ALTER TABLE public.lectures ADD COLUMN academic_item_id UUID REFERENCES public.academic_items(id) ON DELETE CASCADE;
    END IF;

    -- Assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'academic_item_id') THEN
        ALTER TABLE public.assignments ADD COLUMN academic_item_id UUID REFERENCES public.academic_items(id) ON DELETE CASCADE;
    END IF;

    -- Timetable Events (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timetable_events') THEN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timetable_events' AND column_name = 'academic_item_id') THEN
            ALTER TABLE public.timetable_events ADD COLUMN academic_item_id UUID REFERENCES public.academic_items(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Lecture Notes (link via lecture_id usually, but good to have direct link optionally, skipping for now to keep it simple, we link via lectures)
END $$;

-- Backfill Lectures
DO $$
DECLARE
    r RECORD;
    new_id UUID;
BEGIN
    FOR r IN SELECT * FROM public.lectures WHERE academic_item_id IS NULL LOOP
        INSERT INTO public.academic_items (
            user_id, type, title, occurred_at, module_id, state, created_at
        ) VALUES (
            r.user_id, 
            'lecture', 
            r.title, 
            COALESCE(r.lecture_date::timestamp, r.created_at), 
            r.module_id, 
            jsonb_build_object('status', r.status, 'panopto_url', r.panopto_url),
            r.created_at
        ) RETURNING id INTO new_id;

        UPDATE public.lectures SET academic_item_id = new_id WHERE id = r.id;
    END LOOP;
END $$;

-- Backfill Assignments
DO $$
DECLARE
    r RECORD;
    new_id UUID;
BEGIN
    FOR r IN SELECT * FROM public.assignments WHERE academic_item_id IS NULL LOOP
        INSERT INTO public.academic_items (
            user_id, type, title, occurred_at, module_id, state, created_at
        ) VALUES (
            r.user_id, 
            'assignment', 
            r.title, 
            r.due_date, 
            r.module_id, 
            jsonb_build_object('status', r.status, 'grade', r.grade),
            r.created_at
        ) RETURNING id INTO new_id;

        UPDATE public.assignments SET academic_item_id = new_id WHERE id = r.id;
    END LOOP;
END $$;
