import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("CRITICAL: Missing Supabase Environment Variables!");
      console.error("URL:", url ? "Set" : "Missing");
      console.error("Key:", key ? "Set" : "Missing");
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase/Anon Key");
    }

    const isBrowser = typeof window !== 'undefined';
    
    supabase = createClient(url, key, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
      },
    });
  }
  return supabase;
}
