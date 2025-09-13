'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

let cached: SupabaseClient | null = null;

// Build-time safe Supabase client creation
function createSafeClient(): SupabaseClient | null {
  // Never create client during build or server-side rendering
  if (typeof window === 'undefined') {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY; auth disabled.');
    return null;
  }

  try {
    return createBrowserClient(url, anon, {
      auth: { 
        storageKey: "mdl-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true 
      }
    });
  } catch (error) {
    console.warn('[supabase] Failed to create client:', error);
    return null;
  }
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (cached) return cached;
  
  cached = createSafeClient();
  return cached;
}

// Safe Supabase client that can be used directly with null checks
export function getSupabaseClient(): SupabaseClient | null {
  return getSupabaseBrowser();
}

// Legacy export for backward compatibility during transition
export const supabase = getSupabaseBrowser();

// Legacy debugging functions for backward compatibility
export const debugAuthState = async () => {
  const client = getSupabaseBrowser();
  if (!client) return { session: null, error: new Error('No Supabase client') };
  
  try {
    const { data: { session }, error } = await client.auth.getSession();
    return { session, error };
  } catch (err) {
    return { session: null, error: err };
  }
};

export const handleOAuthSession = async (url: string) => {
  const client = getSupabaseBrowser();
  if (!client) return { data: null, error: new Error('No Supabase client') };
  
  try {
    const { data, error } = await client.auth.exchangeCodeForSession(url);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};