-- Migration: Fix durmah_messages column types for Global Chat
-- Date: 2026-01-26
-- Description: Ensures user_id and conversation_id are UUIDs to prevent 'text = uuid' RLS/query errors.

BEGIN;

-- 1. Ensure user_id is UUID (if it was created as TEXT legacy)
DO $$ 
BEGIN 
    -- Check if user_id is type text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'durmah_messages' 
          AND column_name = 'user_id' 
          AND data_type = 'text'
    ) THEN
        ALTER TABLE public.durmah_messages ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    END IF;
END $$;

-- 2. Ensure conversation_id exists and is UUID
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'durmah_messages' 
          AND column_name = 'conversation_id'
    ) THEN
        -- If missing, add it (Legacy might have used thread_id)
        ALTER TABLE public.durmah_messages ADD COLUMN conversation_id uuid;
    ELSE
        -- If exists, check if TEXT and convert
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'durmah_messages' 
              AND column_name = 'conversation_id' 
              AND data_type = 'text'
        ) THEN
            ALTER TABLE public.durmah_messages ALTER COLUMN conversation_id TYPE uuid USING conversation_id::uuid;
        END IF;
    END IF;
END $$;

COMMIT;
