// src/pages/login.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";

import { getSupabaseClient } from "@/lib/supabase/client";
import { BrandTitle } from "@/components/ui/BrandTitle";
import { getAuthRedirect } from "@/lib/authRedirect";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect away if already authenticated AND listen for state changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let unsub: (() => void) | undefined;

    (async () => {
      // If already logged in, go to dashboard
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      // Subscribe so UI updates immediately after OAuth redirect
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          router.replace("/dashboard");
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => { unsub?.(); };
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error("Unable to connect to authentication service");
        setLoading(false);
        return;
      }

      const redirectTo = getAuthRedirect(); // should be your /auth/redirect route
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: "openid email profile",
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        toast.error(`Google Sign-in failed: ${error.message}`);
        setLoading(false);
      }
      // OAuth redirect takes over on success
    } catch (err: any) {
      console.error("Sign-in error:", err);
      toast.error(`Google sign-in failed: ${err.message || "Please try again."}`);
      setLoading(false);
    }
  };

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

        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-sm sm:text-base text-gray-600">Sign in with your Google account to continue</p>
        </div>

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
      </div>
    </div>
  );
}
