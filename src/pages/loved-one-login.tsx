'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Heart, ArrowRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { BrandTitle } from '@/components/ui/BrandTitle';
import toast from 'react-hot-toast';

export default function LovedOneLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('System unavailable');
      setLoading(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // We don't strictly need data: { role: 'loved_one' } here because 
          // LoginRedirectPage infers it from the DB invitation.
        },
      });

      if (error) throw error;
      // Redirect happens automatically
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to initiate login');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Loved One Access - MyDurhamLaw</title>
        <meta name="description" content="Connect with your student through MyDurhamLaw" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-full shadow-lg">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Always With You
            </h1>
            <BrandTitle variant="light" size="lg" as="span" className="text-gray-600 mb-4" />
            <p className="text-gray-600">
              Connect with your student securely and stay close during their law school journey.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Family Login
            </h2>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-sm mb-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-800 text-center">
                <strong>Note:</strong> Your student must grant you access first using your Google email address.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}