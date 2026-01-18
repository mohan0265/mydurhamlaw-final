'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { safeReplace } from '@/lib/navigation/safeNavigate';

const REDIRECT_DELAY = 3000;
const FAILSAFE_TIMEOUT = 5000;

function looksLikeProfileSaveError(code?: string | null, description?: string | null): boolean {
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
  
  const ranOnceRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  const failsafeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ranOnceRef.current) {
      console.log('[auth/callback] Already ran, checking if redirect needed...');
      if (!hasRedirectedRef.current) {
        console.warn('[auth/callback] Duplicate invocation - forcing redirect');
        window.location.href = '/dashboard';
      }
      return;
    }
    ranOnceRef.current = true;

    let cancelled = false;

    function performRedirect(path: string, userType: 'admin' | 'student' | 'unknown'): void {
      if (hasRedirectedRef.current) {
        console.warn('[auth/callback] Redirect already performed');
        return;
      }
      
      hasRedirectedRef.current = true;
      if (failsafeTimerRef.current) {
        clearTimeout(failsafeTimerRef.current);
      }
      
      console.log(`[auth/callback] 🚀 REDIRECTING to ${path} (${userType})`);
      setStatus(`Redirecting...`);
      window.location.href = path;
    }

    failsafeTimerRef.current = setTimeout(() => {
      if (!hasRedirectedRef.current && !cancelled) {
        console.error('[auth/callback] FAILSAFE TRIGGERED - forcing redirect');
        performRedirect('/dashboard', 'unknown');
      }
    }, FAILSAFE_TIMEOUT);

    async function run(): Promise<void> {
      if (typeof window === 'undefined') return;

      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Authentication service unavailable');
        setTimeout(() => performRedirect('/login?error=client_unavailable', 'unknown'), REDIRECT_DELAY);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const errorCode = params.get('error');
      const errorDescription = params.get('error_description');
      const authCode = params.get('code');

      console.log('[auth/callback] Processing callback, code:', !!authCode, 'error:', !!errorCode);

      if (looksLikeProfileSaveError(errorCode, errorDescription)) {
        setError('Could not finish setting up your profile. Please try again.');
        setTimeout(() => performRedirect('/login?error=profile_setup', 'unknown'), REDIRECT_DELAY + 1000);
        return;
      }

      if (errorCode || errorDescription) {
        const message = errorDescription || errorCode || 'Authentication error';
        setError(message);
        setTimeout(() => performRedirect('/login?error=oauth', 'unknown'), REDIRECT_DELAY);
        return;
      }

      try {
        if (authCode && authCode.trim().length > 0) {
          console.log('[auth/callback] Exchanging code for session...');
          setStatus('Establishing session...');
          
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          
          if (exchangeError) {
            console.error('[auth/callback] Exchange error:', exchangeError);
            
            const failsafeCheck = exchangeError.message?.includes('already been used') || 
                                  exchangeError.message?.includes('invalid') ||
                                  exchangeError.message?.includes('code verifier');
            
            if (failsafeCheck) {
              console.log('[auth/callback] Code already used, checking session...');
            } else {
              throw exchangeError;
            }
          } else {
            console.log('[auth/callback] ✅ Code exchanged');
          }
        } else if (!authCode) {
          console.log('[auth/callback] No code, checking existing session...');
        } else {
          console.warn('[auth/callback] Empty code');
          setError('Authentication code missing');
          setTimeout(() => performRedirect('/login?error=missing_code', 'unknown'), REDIRECT_DELAY);
          return;
        }

        setStatus('Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[auth/callback] Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.warn('[auth/callback] No session found');
          if (authCode && authCode.trim().length > 0) {
            throw new Error('Session not created after code exchange');
          }
          performRedirect('/login', 'unknown');
          return;
        }

        console.log('[auth/callback] ✅ Session verified:', session.user?.email);

        setStatus('Verifying access...');
        let userRole: 'admin' | 'student' = 'student';
        
        try {
          const accessRes = await fetch('/api/access/verify', {
            credentials: 'include'
          });
          const accessData = await accessRes.json();
          
          if (!accessData.allowed) {
            console.log('[auth/callback] ❌ Access denied:', accessData.reason);
            await supabase.auth.signOut();
            const restrictedParams = new URLSearchParams({
              reason: accessData.reason || 'not_in_allowlist'
            });
            if (session.user?.email) restrictedParams.set('email', session.user.email);
            performRedirect(`/restricted?${restrictedParams}`, 'unknown');
            return;
          }
          
          userRole = accessData.role === 'admin' ? 'admin' : 'student';
          console.log(`[auth/callback] ✅ Access granted (${userRole}):`, session.user?.email);
        } catch (accessErr) {
          console.error('[auth/callback] Access check failed:', accessErr);
        }

        if (cancelled) return;

        const isOnboarding = params.get('onboarding') === 'true';
        if (isOnboarding) {
          setStatus('Completing profile...');
          try {
            const onboardingDataStr = localStorage.getItem('onboarding_data');
            if (onboardingDataStr) {
              const onboardingData = JSON.parse(onboardingDataStr);
              const completeRes = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(onboardingData)
              });
              
              if (completeRes.ok) {
                console.log('[auth/callback] ✅ Onboarding completed');
              }
              localStorage.removeItem('onboarding_data');
            }
          } catch (onboardErr) {
            console.error('[auth/callback] Onboarding error:', onboardErr);
          }
        }

        if (cancelled) return;

        if (userRole === 'admin') {
          console.log('[auth/callback] Admin - skipping profile check');
          performRedirect('/LoginRedirectPage', 'admin');
          return;
        }

        setStatus('Checking profile...');
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, accepted_terms_at')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('[auth/callback] Profile fetch error:', profileError);
          } else if (!profile || !profile.display_name || !profile.accepted_terms_at) {
            console.log('[auth/callback] Profile incomplete');
            performRedirect('/onboarding?required=true', 'student');
            return;
          } else {
            console.log('[auth/callback] ✅ Profile complete');
          }
        } catch (profileErr) {
          console.error('[auth/callback] Profile check failed:', profileErr);
        }

        if (cancelled) return;
        
        if (cancelled) return;

        // ---------------------------------------------------------
        // ADDED: Process Signup Metadata (Name, Year, Terms)
        // ---------------------------------------------------------
        const signupDataParam = params.get('signup_data');
        let signupMeta: any = null;

        if (signupDataParam) {
           try {
              signupMeta = JSON.parse(decodeURIComponent(signupDataParam));
              console.log('[auth/callback] Found signup_data param:', signupMeta);
           } catch (e) {
              console.warn('[auth/callback] Failed to parse signup_data param', e);
           }
        }

        // Fallback to local/session storage if param missing
        if (!signupMeta && typeof window !== 'undefined') {
            try {
               const local = sessionStorage.getItem('durham_signup_metadata') || localStorage.getItem('durham_signup_metadata');
               if (local) {
                  signupMeta = JSON.parse(local);
                  console.log('[auth/callback] Found local signup metadata:', signupMeta);
               }
            } catch (e) {
               console.warn('[auth/callback] Failed to parse local signup metadata', e);
            }
        }

        // Apply metadata if valid and profile incomplete
        if (signupMeta && (signupMeta.dn || signupMeta.display_name)) {
            setStatus('Setting up your profile...');
            try {
               const displayName = signupMeta.dn || signupMeta.display_name;
               const yearGroup = signupMeta.yg || signupMeta.year_group;
               const acceptedTerms = signupMeta.at || signupMeta.agreed_to_terms;

               const updates: any = {
                  updated_at: new Date().toISOString(),
               };
               if (displayName) updates.display_name = displayName;
               if (yearGroup) {
                  updates.year_group = yearGroup;
                  updates.year_of_study = yearGroup; // Sync canonical
                  updates.user_role = 'student'; // Default role
               }
               if (acceptedTerms) updates.accepted_terms_at = new Date().toISOString();

               console.log('[auth/callback] Updating profile with signup data:', updates);

               const { error: updateErr } = await supabase
                 .from('profiles')
                 .update(updates)
                 .eq('id', session.user.id);
               
               if (updateErr) {
                 console.error('[auth/callback] Profile update failed:', updateErr);
               } else {
                 console.log('[auth/callback] ✅ Profile initialized from signup data');
                 // Clear storage to prevent re-use
                 localStorage.removeItem('durham_signup_metadata');
                 sessionStorage.removeItem('durham_signup_metadata');
               }
            } catch (err) {
               console.error('[auth/callback] Profile setup error:', err);
            }
        }
        // ---------------------------------------------------------

        performRedirect('/LoginRedirectPage', userRole);

      } catch (err: unknown) {
        console.error('[auth/callback] ❌ Error:', err);
        const message = err instanceof Error ? err.message : 'Authentication error';
        setError(message);
        setTimeout(() => performRedirect('/login?error=oauth_callback', 'unknown'), REDIRECT_DELAY);
      }
    }

    run();

    return () => {
      cancelled = true;
      if (failsafeTimerRef.current) {
        clearTimeout(failsafeTimerRef.current);
      }
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
              onClick={() => {
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true;
                  window.location.href = '/login';
                }
              }}
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
