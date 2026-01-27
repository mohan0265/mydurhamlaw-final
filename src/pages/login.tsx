// src/pages/login.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { BookOpen, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { getSupabaseClient } from "@/lib/supabase/client";
import { BrandTitle } from "@/components/ui/BrandTitle";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [alreadyConnectedUser, setAlreadyConnectedUser] = useState<{ email?: string } | null>(null);

    // CHANGED: Removed auto-redirect to prevent infinite loops with Middleware
    // Instead, we let the UI handle the "Already logged in" state
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        setAlreadyConnectedUser({ email: data.session.user.email });
        // Optional: Pre-fill email state if they want to switch accounts
        if (data.session.user.email) setEmail(data.session.user.email);
      }

      // Subscribe to auth changes just to keep internal state fresh, but NO redirects
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
         if (session?.user) {
            setAlreadyConnectedUser({ email: session.user.email });
         } else {
            setAlreadyConnectedUser(null);
         }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => { unsub?.(); };
  }, [router]);

  // ... (handlers)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              <BrandTitle variant="light" size="xl" as="span" /> Login
            </h1>
          </div>
          <Link href="/" className="text-sm text-purple-600 hover:underline min-h-[44px] flex items-center px-2 flex-shrink-0">
            Back to Home
          </Link>
        </div>

        {alreadyConnectedUser ? (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You are already signed in</h2>
              <p className="text-sm text-gray-600 mb-6">
                Connected as <span className="font-semibold text-gray-900">{alreadyConnectedUser.email}</span>
              </p>

              <div className="space-y-3">
                 <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-bold shadow-lg shadow-purple-200 transition-all hover:shadow-purple-300"
                 >
                    Go to Dashboard
                 </button>
                 
                 <button
                    onClick={async () => {
                        const sb = getSupabaseClient();
                        if (sb) await sb.auth.signOut();
                        setAlreadyConnectedUser(null);
                        toast.success('Signed out');
                    }}
                    className="w-full bg-white border border-gray-200 text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                 >
                    Sign Out & Switch Account
                 </button>
              </div>
            </div>
        ) : (
           <>
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {showEmailLogin ? "Sign in with your email and password" : "Sign in to continue"}
                </p>
              </div>

        {!showEmailLogin ? (
          <>
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium text-base sm:text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Redirecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Email login toggle */}
            <button
              onClick={() => setShowEmailLogin(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium text-base flex items-center justify-center space-x-2 transition-colors min-h-[48px]"
            >
              <Mail className="w-5 h-5" />
              <span>Sign in with Email</span>
            </button>
          </>
        ) : (
          <>
            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium text-base sm:text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Back to Google */}
            <button
              onClick={() => setShowEmailLogin(false)}
              className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
            >
              ← Back to Google Sign-in
            </button>
          </>
        )}
      </>
      )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-purple-600 hover:underline font-medium min-h-[44px] inline-flex items-center px-2 -mx-2">
            Sign Up
          </Link>
        </p>

        {process.env.NODE_ENV === "development" && router.query.error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-600">OAuth Error: {router.query.error as string}</p>
          </div>
        )}

        {/* Development Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-gray-500">DEBUG</span>
               <span className="text-[10px] text-gray-400">env check</span>
             </div>
             <p className="text-xs text-gray-600">
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </p>
            <p className="text-xs text-gray-600">
              Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
