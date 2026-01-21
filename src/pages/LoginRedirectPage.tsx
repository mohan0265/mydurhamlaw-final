'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getDashboardRoute } from '@/lib/utils/metadata-storage';
import { safeReplace } from '@/lib/navigation/safeNavigate';

export default function LoginRedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your account...');
  const [showFallback, setShowFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const didNavigateRef = useRef(false);

  // Prevent duplicate navigations during the auth flow
  const navigateOnce = (url: string, delay = 0) => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;
    if (delay > 0) {
      setTimeout(() => safeReplace(router, url), delay);
    } else {
      safeReplace(router, url);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const handleAuthCallback = async () => {
      try {
        setStatus('Processing authentication...');

        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client not available');

        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
          console.error('🚨 Session error:', sessionError);
          setDebugInfo(
            `Session error: ${(sessionError as any)?.message || 'Unknown session error'}`
          );
          setStatus('Authentication failed. Redirecting to signup...');
          navigateOnce('/signup?error=session_error', 3000);
          return;
        }

        if (!session?.user) {
          console.log('❌ No session found, redirecting to signup');
          setDebugInfo('No active session found');
          setStatus('No session found. Redirecting to signup...');
          navigateOnce('/signup?error=no_session', 3000);
          return;
        }

        const user = session.user;
        console.log('👤 User authenticated:', user.id);
        console.log('👤 User metadata:', user.user_metadata);
        console.log('👤 User email:', user.email);
        setDebugInfo(`User ID: ${user.id}, Email: ${user.email}`);

        setStatus('Setting up your profile...');

        // Wait for any DB triggers
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error('🚨 Supabase client not available');
          setDebugInfo('Database connection not available');
          setStatus('Database connection failed. Please try again.');
          setShowFallback(true);
          return;
        }

        // Determine user role
        let userRole = 'student';
        if (user.user_metadata?.role === 'loved_one') {
          userRole = 'loved_one';
          console.log('🔍 User role from metadata: loved_one');
        } else if (user.email) {
          // Check if email exists in awy_connections as a loved one
          // This works even if loved_one_id is not yet set (first-time login)
          const { data: connectionData } = await supabase
            .from('awy_connections')
            .select('id, loved_one_id, relationship, status')
            .eq('loved_email', user.email.toLowerCase())
            .in('status', ['active', 'accepted', 'granted', 'pending', 'invited'])
            .limit(1)
            .maybeSingle();

          if (connectionData) {
            // Email matches a loved one connection - this is a loved one!
            userRole = 'loved_one';
            console.log('🔍 User role from awy_connections (email match): loved_one');
          }
        }

        console.log(`✅ Final user role determined: ${userRole}`);
        setDebugInfo(`User role: ${userRole}`);

        // Link AWY connection for loved ones (ensure IDs/status are updated)
        if (userRole === 'loved_one' && user.email) {
          try {
            const normalizedEmail = user.email.toLowerCase();
            
            // Update AWY connection with loved one's user ID
            await supabase
              .from('awy_connections')
              .update({
                loved_one_id: user.id,
                loved_user_id: user.id,
                status: 'active',
                accepted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('loved_email', normalizedEmail);
            
            // CRITICAL: Send heartbeat immediately to mark loved one as "online"
            // Loved ones are always available when logged in
            try {
              await supabase.rpc('awy_heartbeat', { p_is_available: true });
              console.log('💓 Loved one heartbeat sent - now visible to student');
            } catch (hbErr: any) {
              console.warn('Heartbeat failed:', hbErr?.message || hbErr);
            }
          } catch (linkErr: any) {
            console.warn('Failed to link loved one connection:', linkErr?.message || linkErr);
          }
        }

        // Check profile
        const {
          data: existingProfile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('id, user_role, year_group, display_name, agreed_to_terms')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('🚨 Profile lookup error:', profileError);
          setDebugInfo(`Profile lookup error: ${profileError.message}`);
          setStatus('Profile lookup failed. Please try again.');
          setShowFallback(true);
          return;
        }

        if (existingProfile) {
          const profileRole = existingProfile.user_role || userRole;
          const displayName =
            existingProfile.display_name || user.email?.split('@')[0] || 'User';
          const metaYear =
            (user.user_metadata as any)?.year_group ||
            (user.user_metadata as any)?.user_type ||
            existingProfile.year_group ||
            'year1';

          if (existingProfile.user_role !== userRole) {
            console.log(
              `🔄 Updating user role from ${existingProfile.user_role} to ${userRole}`
            );
            await supabase
              .from('profiles')
              .update({
                user_role: userRole,
                year_group: metaYear,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }

          console.log('✅ Existing profile found:', { role: userRole, displayName });

          if (userRole === 'loved_one') {
            setStatus(`Welcome back, ${displayName}! Redirecting to your family dashboard...`);
            navigateOnce('/loved-one-dashboard', 1500);
          } else {
            const yearGroup = existingProfile.year_group;
            setStatus(
              `Welcome back, ${displayName}! Redirecting to your ${yearGroup} dashboard...`
            );

            const dashboardRoute = getDashboardRoute(yearGroup);
            navigateOnce(dashboardRoute, 1500);
          }
        } else {
          console.log(`🆕 New ${userRole} detected, creating profile...`);

          // ✅ CRITICAL FIX: Get display_name from signup metadata!
          const { retrieveSignupMetadata } = await import('@/lib/utils/metadata-storage');
          const signupMetadata = retrieveSignupMetadata();
          console.log('📋 Retrieved signup metadata:', signupMetadata);
          
          const actualDisplayName = signupMetadata?.display_name || 
                                    user.user_metadata?.display_name ||
                                    user.user_metadata?.full_name ||
                                    user.email?.split('@')[0] || 
                                    'User';

          const baseProfileData: any = {
            id: user.id,
            user_role: userRole,
            display_name: actualDisplayName,  // ✅ Use actual name from signup!
            agreed_to_terms: userRole === 'loved_one' ? true : ((signupMetadata as any)?.agreed_to_terms || false),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_via: 'manual',
          };

          if (userRole === 'student') {
            const yearValue = signupMetadata?.year_group ||
              (user.user_metadata as any)?.year_group ||
              (user.user_metadata as any)?.user_type ||
              'year1';
            baseProfileData.year_group = yearValue;
            baseProfileData.year_of_study = yearValue; // Sync both columns!
            console.log('📚 Year assigned:', yearValue);
          } else {
            // Loved ones - sync both columns
            baseProfileData.year_group = 'year1';
            baseProfileData.year_of_study = 'year1';
          }

          const { error: createError } = await supabase.from('profiles').insert([baseProfileData]);

          if (createError) {
            console.error('🚨 Profile creation error:', createError);
            setDebugInfo(`Profile creation error: ${createError.message}`);
            setStatus('Profile creation failed. Please try again.');
            setShowFallback(true);
            return;
          }

          if (userRole === 'loved_one') {
            setStatus(`Welcome! Redirecting to your family dashboard...`);
            navigateOnce('/loved-one-dashboard', 1500);
          } else {
             // CHECK FOR STRIPE PLAN
             const selectedPlan = (signupMetadata as any)?.plan;
             if (selectedPlan && selectedPlan !== 'free') {
                 setStatus("Account created! Redirecting to payment...");
                 console.log(`[auth/callback] Initiating checkout for plan: ${selectedPlan}`);
                 
                 try {
                     const res = await fetch('/api/stripe/checkout', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ plan: selectedPlan })
                     });
                     
                     if (res.ok) {
                         const { url } = await res.json();
                         if (url) {
                             console.log('[auth/callback] Redirecting to Stripe:', url);
                             window.location.href = url;
                             return;
                         }
                     } else {
                         console.error('[auth/callback] Checkout creation failed');
                     }
                 } catch (e) {
                     console.error('[auth/callback] Checkout error:', e);
                 }
             }

            setStatus("Welcome! Let's complete your profile...");
            navigateOnce('/complete-profile', 1500);
          }
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error('🚨 Auth callback error:', error);
        setDebugInfo(`Unexpected error: ${error.message}`);
        setStatus('Something went wrong. Please try again.');
        setShowFallback(true);
      }
    };

    handleAuthCallback();

    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>

        <h1 className="text-2xl font-bold text-purple-700 mb-4">Almost there!</h1>
        <p className="text-lg text-gray-700 mb-4">{status}</p>

        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600">Debug: {debugInfo}</p>
          </div>
        )}

        {showFallback && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <p className="text-sm text-gray-600 mb-4">Taking longer than expected?</p>
            <div className="space-y-3">
              <button
                onClick={() => safeReplace(router, '/loved-one-dashboard')}
                className="block w-full bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-700 transition-colors"
              >
                Family Dashboard
              </button>
              <button
                onClick={() => safeReplace(router, '/complete-profile')}
                className="block w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={() => safeReplace(router, '/signup')}
                className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => safeReplace(router, '/')}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
