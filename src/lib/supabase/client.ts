import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    // CRITICAL FIX: Use auth-helpers to enable cookie-based authentication
    // This allows server-side API routes to read the auth session
    // Previous implementation only used localStorage which is inaccessible to Next.js API routes
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("CRITICAL: Missing Supabase Environment Variables!");
      console.error("URL:", url ? "Set" : "Missing");
      console.error("Anon Key:", key ? "Set" : "Missing");
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // Use auth-helpers for browser client - manages both localStorage AND cookies
      supabase = createPagesBrowserClient();
    } else {
      // This shouldn't happen (this file is for client-side only)
      // But provide fallback
      const { createClient } = require("@supabase/supabase-js");
      supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
  }
  return supabase;
}
