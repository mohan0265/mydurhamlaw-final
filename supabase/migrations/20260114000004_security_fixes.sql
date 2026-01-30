-- Security Fixes: Views and RLS
-- Migration: 20260114_security_fixes.sql
-- Applied via Supabase Dashboard on 2026-01-14

-- Fix: Security Definer Views -> SECURITY INVOKER
-- Views with SECURITY DEFINER can bypass RLS, which is a security risk
ALTER VIEW public.voice_journal_stats SET (security_invoker = on);
ALTER VIEW public.awy_connections_admin_view SET (security_invoker = on);

-- Fix: Enable RLS on student_invitations table
-- Tables in public schema should have RLS enabled to prevent unauthorized access
ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

-- Note: After enabling RLS, you may need to create appropriate policies
-- for the student_invitations table if they don't already exist.
