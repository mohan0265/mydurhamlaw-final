-- Migration: Create RPC functions for server-side timetable seeding
-- Created: 2026-01-02
-- Purpose: Enable timezone-correct seeding via DB RPCs using Europe/London

BEGIN;

-- =====================================================
-- Function: seed_timetable_events_v1
-- Purpose: Seeds timetable with correct London timezone
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_timetable_events_v1(mode text DEFAULT 'epiphany2026')
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  rows_inserted int := 0;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Clean up old seed data (including broken timezone seed)
  DELETE FROM public.timetable_events
  WHERE user_id = current_user_id
    AND source IN ('dev-seed-v1', 'seed', 'dev-seed');

  -- Seed based on mode
  IF mode = 'epiphany2026' THEN
    -- Seed events starting from Epiphany term start (12 Jan 2026)
    -- All times in Europe/London timezone, weekdays only
    
    INSERT INTO public.timetable_events (user_id, title, start_time, end_time, location, source)
    VALUES
      -- Monday 12 Jan 2026, 10:00-11:00
      (
        current_user_id,
        'Contract Law Lecture',
        make_timestamptz(2026, 1, 13, 10, 0, 0, 'Europe/London'),
        make_timestamptz(2026, 1, 13, 11, 0, 0, 'Europe/London'),
        'Law Building, Room 204',
        'dev-seed-v1'
      ),
      -- Wednesday 14 Jan 2026, 14:00-15:00
      (
        current_user_id,
        'Tort Law Seminar',
        make_timestamptz(2026, 1, 14, 14, 0, 0, 'Europe/London'),
        make_timestamptz(2026, 1, 14, 15, 0, 0, 'Europe/London'),
        'Law Building, Room 112',
        'dev-seed-v1'
      ),
      -- Friday 16 Jan 2026, 11:00-12:00
      (
        current_user_id,
        'Criminal Law Workshop',
        make_timestamptz(2026, 1, 16, 11, 0, 0, 'Europe/London'),
        make_timestamptz(2026, 1, 16, 12, 0, 0, 'Europe/London'),
        'Law Building, Room 315',
        'dev-seed-v1'
      );
    
    rows_inserted := 3;

  ELSIF mode = 'nextWeekday' THEN
    -- Seed relative to next weekday at 10:00 London time
    -- For simplicity, seed 3 events starting tomorrow if weekday, or next Monday if weekend
    DECLARE
      base_date date;
      dow int;
    BEGIN
      base_date := CURRENT_DATE;
      dow := EXTRACT(DOW FROM base_date);
      
      -- If weekend (0=Sun, 6=Sat), jump to Monday
      IF dow = 0 THEN
        base_date := base_date + interval '1 day';
      ELSIF dow = 6 THEN
        base_date := base_date + interval '2 days';
      ELSE
        -- Weekday, use next day
        base_date := base_date + interval '1 day';
      END IF;

      INSERT INTO public.timetable_events (user_id, title, start_time, end_time, location, source)
      VALUES
        (
          current_user_id,
          'Contract Law Lecture',
          make_timestamptz(EXTRACT(YEAR FROM base_date)::int, EXTRACT(MONTH FROM base_date)::int, EXTRACT(DAY FROM base_date)::int, 10, 0, 0, 'Europe/London'),
          make_timestamptz(EXTRACT(YEAR FROM base_date)::int, EXTRACT(MONTH FROM base_date)::int, EXTRACT(DAY FROM base_date)::int, 11, 0, 0, 'Europe/London'),
          'Law Building, Room 204',
          'dev-seed-v1'
        ),
        (
          current_user_id,
          'Tort Law Seminar',
          make_timestamptz(EXTRACT(YEAR FROM base_date + 2)::int, EXTRACT(MONTH FROM base_date + 2)::int, EXTRACT(DAY FROM base_date + 2)::int, 14, 0, 0, 'Europe/London'),
          make_timestamptz(EXTRACT(YEAR FROM base_date + 2)::int, EXTRACT(MONTH FROM base_date + 2)::int, EXTRACT(DAY FROM base_date + 2)::int, 15, 0, 0, 'Europe/London'),
          'Law Building, Room 112',
          'dev-seed-v1'
        ),
        (
          current_user_id,
          'Criminal Law Workshop',
          make_timestamptz(EXTRACT(YEAR FROM base_date + 4)::int, EXTRACT(MONTH FROM base_date + 4)::int, EXTRACT(DAY FROM base_date + 4)::int, 11, 0, 0, 'Europe/London'),
          make_timestamptz(EXTRACT(YEAR FROM base_date + 4)::int, EXTRACT(MONTH FROM base_date + 4)::int, EXTRACT(DAY FROM base_date + 4)::int, 12, 0, 0, 'Europe/London'),
          'Law Building, Room 315',
          'dev-seed-v1'
        );
      
      rows_inserted := 3;
    END;
  ELSE
    RAISE EXCEPTION 'Invalid mode: %. Use epiphany2026 or nextWeekday', mode;
  END IF;

  RETURN rows_inserted;
END;
$$;

-- =====================================================
-- Function: clear_timetable_events_v1
-- Purpose: Clears seed timetable data for current user
-- =====================================================
CREATE OR REPLACE FUNCTION public.clear_timetable_events_v1()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  rows_deleted int;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.timetable_events
  WHERE user_id = current_user_id
    AND source IN ('dev-seed-v1', 'seed', 'dev-seed');
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RETURN rows_deleted;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.seed_timetable_events_v1(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_timetable_events_v1() TO authenticated;

COMMIT;
