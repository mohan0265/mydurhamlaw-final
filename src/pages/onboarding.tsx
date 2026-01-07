import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Brain, Check, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Student Onboarding Page
 * 
 * Captures: Display name, Year group, Terms & Privacy consent
 * Flow: User fills form → "Continue with Google" → OAuth → profile saved → dashboard
 * 
 * Called from:
 * - /request-access after trial approval
 * - Auth callback if profile missing
 */

const YEAR_OPTIONS = ['Foundation', 'Year 1', 'Year 2', 'Year 3'];

export default function OnboardingPage() {
  const router = useRouter();
  const { email, required } = router.query; // email from request-access, required from callback
  
  const [displayName, setDisplayName] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated (returning from failed profile check)
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session && required === 'true') {
        // User refreshed page - lost session, send back to login
        router.push('/login');
      }
    };
    checkAuth();
  }, [required, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim() || !yearGroup || !agreedToTerms) {
      setError('Please complete all fields and accept the terms');
      return;
    }

    // Store onboarding data in localStorage for OAuth callback
    const onboardingData = {
      displayName: displayName.trim(),
      yearGroup,
      acceptedAt: new Date().toISOString(),
      termsVersion: 'v1',
      privacyVersion: 'v1'
    };
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

    // Proceed to Google OAuth
    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?onboarding=true`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (authError) {
      setError(`Sign-in failed: ${authError.message}`);
      localStorage.removeItem('onboarding_data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back Link */}
        {!required && (
          <Link 
            href="/" 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-purple-100">
          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to MyDurhamLaw
          </h1>
          <p className="text-center text-gray-600 mb-8 text-sm">
            {email 
              ? `Complete your profile to continue with ${email}` 
              : required 
              ? 'Complete your profile to access your dashboard'
              : 'Set up your student profile'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Alex Chen"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is how Durmah will address you
              </p>
            </div>

            {/* Year Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Study *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {YEAR_OPTIONS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setYearGroup(year)}
                    className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition ${
                      yearGroup === year
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms & Privacy */}
            <div className="rounded-lg bg-gray-50 p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  required
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-purple-600 hover:text-purple-700 underline">
                    Terms of Use
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-purple-600 hover:text-purple-700 underline">
                    Privacy Policy
                  </Link>
                  {' '}*
                </span>
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !displayName.trim() || !yearGroup || !agreedToTerms}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-xs text-center text-gray-500">
              You'll sign in with Google using your verified Durham email
            </p>
          </form>
        </div>

        {/* Footer Note */}
        {!required && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Already set up?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
