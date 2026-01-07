'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { safePush, safeReplace } from '@/lib/navigation/safeNavigate';

const REDIRECT_DELAY = 3000;

function looksLikeProfileSaveError(code?: string | null, description?: string | null) {
  const codeText = (code || '').toLowerCase();
  const descriptionText = (description || '').toLowerCase();
  if (codeText === 'unexpected_failure') return true;
  if (descriptionText.includes('database error saving new user')) return true;
  return false;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Finishing sign in...');
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL FIX: Prevent double execution in React StrictMode
  const ranOnceRef = useRef(false);

  useEffect(() => {
    // GUARD: Only run once even if React StrictMode double-invokes
    if (ranOnceRef.current) {
      console.log('[auth/callback] Already ran, skipping duplicate invocation');
      return;
    }
    ranOnceRef.current = true;

    let cancelled = false;
    const didNavigateRef = { current: false };

    async function run() {
      if (typeof window === 'undefined') return;

      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Authentication service is unavailable.');
        setStatus('Redirecting to login...');
        setTimeout(() => safeReplace(router, '/login?error=client_unavailable'), REDIRECT_DELAY);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const errorCode = params.get('error');
      const errorDescription = params.get('error_description');
      const authCode = params.get('code');

      console.log('[auth/callback] Processing callback, has code:', !!authCode, 'has error:', !!errorCode);

      // 1. Handle explicit errors from provider
      if (looksLikeProfileSaveError(errorCode, errorDescription)) {
        setError('We could not finish setting up your profile yet. Please try again in a moment.');
        setStatus('Sending you back to the login page...');
        setTimeout(() => safeReplace(router, '/login?error=profile_setup'), REDIRECT_DELAY + 1000);
        return;
      }

      if (errorCode || errorDescription) {
        const message = errorDescription || errorCode || 'Unexpected authentication error.';
        setError(message);
        setStatus('Redirecting to login...');
        setTimeout(() => safeReplace(router, '/login?error=oauth'), REDIRECT_DELAY);
        return;
      }

      try {
        // 2. CRITICAL FIX: Only exchange code if it exists AND is non-empty
        if (authCode && authCode.trim().length > 0) {
          console.log('[auth/callback] Exchanging code for session...');
          setStatus('Establishing your session...');
          
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          
          if (exchangeError) {
            console.error('[auth/callback] Exchange error:', exchangeError);
            
            // PKCE FIX: If code exchange fails, check if session exists anyway
            // This handles cases where exchange fails but session was already created
            const failsafeCheck = exchangeError.message?.includes('already been used') || 
                                  exchangeError.message?.includes('invalid') ||
                                  exchangeError.message?.includes('code verifier') ||
                                  exchangeError.message?.includes('Auth code');
            
            if (failsafeCheck) {
              console.log('[auth/callback] Code exchange failed, will check if session exists anyway...');
              // Continue to session check below - don't throw
            } else {
              throw exchangeError;
            }
          } else {
            console.log('[auth/callback] Code exchanged successfully');
          }
        } else if (!authCode) {
          console.log('[auth/callback] No auth code present, checking for existing session...');
          // No code - might be a direct navigation or session already established
          // Try to get existing session
        } else {
          // authCode is empty string
          console.warn('[auth/callback] Auth code is empty, cannot exchange');
          setError('Authentication code is missing. Please try signing in again.');
          setStatus('Redirecting to login...');
          setTimeout(() => safeReplace(router, '/login?error=missing_code'), REDIRECT_DELAY);
          return;
        }

        // 3. Verify session exists (regardless of exchange result)
        setStatus('Checking your session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[auth/callback] Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.warn('[auth/callback] No session found after callback');
          // Sometimes the session is there but just needs a moment
          // If we had a code and it failed, that's a real problem
          if (authCode && authCode.trim().length > 0) {
            throw new Error('Session was not created after code exchange.');
          }
          // No code and no session - probably just navigated here manually
          console.log('[auth/callback] No code and no session, redirecting to login');
          safeReplace(router, '/login');
          return;
        }

        console.log('[auth/callback] Session verified, user:', session.user?.email);
        if (cancelled) return;
        
        setStatus('Redirecting to complete your setup...');
        if (!didNavigateRef.current) {
          didNavigateRef.current = true;
        console.log('[auth/callback] FORCING redirect to /LoginRedirectPage'); window.location.href = '/LoginRedirectPage';
        }

      } catch (err: any) {
        console.error('[auth/callback] error:', err);
        const message = err?.message || 'Unexpected authentication error.';
        setError(message);
        setStatus('Redirecting to login...');
        setTimeout(() => safeReplace(router, '/login?error=oauth_callback'), REDIRECT_DELAY);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]); // Only depend on router, ranOnceRef prevents re-runs

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50">
      <div className="mx-auto max-w-md p-8 text-center">
        <div className="mb-6">
          {error ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
          )}
        </div>

        <h1 className="mb-4 text-2xl font-bold text-purple-700">
          {error ? 'Authentication issue' : 'Signing you in'}
        </h1>
        <p className="mb-4 text-lg text-gray-700">{status}</p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
            <p className="mb-3">{error}</p>
            <button
              onClick={() => safeReplace(router, '/login')}
              className="block w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Return to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
