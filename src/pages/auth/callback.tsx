'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (typeof window === 'undefined') {
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Authentication service is unavailable.');
        setStatus('Redirecting to login...');
        setTimeout(() => router.push('/login?error=client_unavailable'), REDIRECT_DELAY);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const errorCode = params.get('error');
      const errorDescription = params.get('error_description');
      const authCode = params.get('code');

      if (looksLikeProfileSaveError(errorCode, errorDescription)) {
        setError('We could not finish setting up your profile yet. Please try again in a moment. If this keeps happening, contact support.');
        setStatus('Sending you back to the login page...');
        setTimeout(() => router.push('/login?error=profile_setup'), REDIRECT_DELAY + 1000);
        return;
      }

      if (errorCode || errorDescription) {
        const message = errorDescription || errorCode || 'Unexpected authentication error.';
        setError(message);
        setStatus('Redirecting to login...');
        setTimeout(() => router.push('/login?error=oauth'), REDIRECT_DELAY);
        return;
      }

      try {
        if (authCode) {
          setStatus('Establishing your session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        setStatus('Checking your session...');
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data?.session) {
          throw sessionError || new Error('Session was not created.');
        }

        if (cancelled) return;
        setStatus('Redirecting to complete your setup...');
        router.push('/LoginRedirectPage');
      } catch (err: any) {
        console.error('[auth/callback] error:', err);
        const message = err?.message || 'Unexpected authentication error.';
        setError(message);
        setStatus('Redirecting to login...');
        setTimeout(() => router.push('/login?error=oauth_callback'), REDIRECT_DELAY);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
              onClick={() => router.push('/login')}
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
