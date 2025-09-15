'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

let cached: SupabaseClient | null = null;

// Build-time safe Supabase client creation
function createSafeClient(): SupabaseClient<any, "public", any> | null {
  // Never create client during build or server-side rendering
  if (typeof window === 'undefined') {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY; auth disabled.');
    console.warn('[supabase] URL exists:', !!url);
    console.warn('[supabase] ANON_KEY exists:', !!anon);
    return null;
  }

  try {
    console.log('[supabase] Creating browser client with URL:', url);
    
    return createBrowserClient(url, anon, {
      auth: { 
        storageKey: "mdl-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'mydurhamlaw-web'
        }
      }
    });
  } catch (error) {
    console.error('[supabase] Failed to create client:', error);
    return null;
  }
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    console.warn('[supabase] Attempted to get browser client on server side');
    return null;
  }
  
  if (cached) {
    return cached;
  }
  
  cached = createSafeClient();
  
  if (cached) {
    console.log('[supabase] Browser client created and cached successfully');
  } else {
    console.error('[supabase] Failed to create browser client');
  }
  
  return cached;
}

// Safe Supabase client that can be used directly with null checks
export function getSupabaseClient(): SupabaseClient | null {
  return getSupabaseBrowser();
}

// Legacy export for backward compatibility during transition
export const supabase = getSupabaseBrowser();

// Enhanced debugging functions for backward compatibility
export const debugAuthState = async () => {
  const client = getSupabaseBrowser();
  if (!client) {
    console.error('[supabase] No client available for debug auth state');
    return { session: null, error: new Error('No Supabase client available') };
  }
  
  try {
    console.log('[supabase] Getting current session for debug...');
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('[supabase] Error getting session:', error);
      return { session: null, error };
    }
    
    if (session) {
      console.log('[supabase] Session found:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
        provider: session.user.app_metadata?.provider
      });
    } else {
      console.log('[supabase] No active session found');
    }
    
    return { session, error: null };
  } catch (err: any) {
    console.error('[supabase] Exception in debugAuthState:', err);
    return { session: null, error: err };
  }
};

export const handleOAuthSession = async (url?: string) => {
  const client = getSupabaseBrowser();
  if (!client) {
    console.error('[supabase] No client available for OAuth session handling');
    return { data: null, error: new Error('No Supabase client available') };
  }
  
  try {
    console.log('[supabase] Handling OAuth session...');
    
    // If no URL provided, try to get session from current URL
    if (!url) {
      const { data: { session }, error } = await client.auth.getSession();
      return { data: { session }, error };
    }
    
    // Handle code exchange if URL is provided
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    
    if (!code) {
      console.warn('[supabase] No authorization code found in URL');
      return { data: null, error: new Error('No authorization code found') };
    }
    
    console.log('[supabase] Exchanging code for session...');
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[supabase] Error exchanging code:', error);
    } else {
      console.log('[supabase] Successfully exchanged code for session');
    }
    
    return { data, error };
  } catch (error: any) {
    console.error('[supabase] Exception in handleOAuthSession:', error);
    return { data: null, error };
  }
};

// Additional helper for checking client readiness
export const isSupabaseReady = (): boolean => {
  const client = getSupabaseClient();
  const ready = !!client && typeof window !== 'undefined';
  
  if (!ready) {
    console.warn('[supabase] Client not ready. Environment variables set:', {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isBrowser: typeof window !== 'undefined'
    });
  }
  
  return ready;
};

// Helper for auth state monitoring
export const onAuthStateChange = (callback: (session: any) => void) => {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[supabase] Cannot setup auth state listener - no client');
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  console.log('[supabase] Setting up auth state change listener');
  
  return client.auth.onAuthStateChange((event, session) => {
    console.log('[supabase] Auth state changed:', event, session ? 'Session exists' : 'No session');
    callback(session);
  });
};
