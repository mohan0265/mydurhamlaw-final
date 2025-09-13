import { createClient } from '@supabase/supabase-js';

export const getBrowserSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Never throw a hard error in client; render UI empty states instead.
    console.warn('[Planner] Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY');
    return null as any;
  }
  return createClient(url, anon, { auth: { persistSession: true } });
};