"use client";

import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Heart, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { BrandTitle } from "@/components/ui/BrandTitle";
import toast from "react-hot-toast";

export default function LovedOneLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"choose" | "email">("choose");

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("System unavailable");
      setLoading(false);
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback?role=lovedone`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to initiate login");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("System unavailable");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        toast.success("Welcome back!");
        router.push("/loved-one-dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Loved One Access - Caseway</title>
        <meta
          name="description"
          content="Connect with your student through Caseway"
        />
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
            <BrandTitle
              variant="light"
              size="lg"
              as="span"
              className="text-gray-600 mb-4"
            />
            <p className="text-gray-600">
              Connect with your student securely and stay close during their law
              school journey.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Family Login
            </h2>

            {loginMode === "choose" ? (
              <>
                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-sm mb-4 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-sm text-gray-400">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Email Login Option */}
                <button
                  onClick={() => setLoginMode("email")}
                  className="w-full bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 mb-6"
                >
                  <Mail className="w-5 h-5" />
                  <span>Sign in with Email & Password</span>
                </button>
              </>
            ) : (
              <>
                {/* Email/Password Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <button
                  onClick={() => setLoginMode("choose")}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  ← Back to login options
                </button>
              </>
            )}

            {loginMode === "choose" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-blue-900 text-sm">
                  How to Connect
                </h3>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                  <li>
                    Sign in with the <strong>exact email</strong> your student
                    added.
                  </li>
                  <li>
                    If admin created your account, use{" "}
                    <strong>email and password</strong>.
                  </li>
                  <li>
                    If you use a different email, you won&apos;t be able to
                    connect.
                  </li>
                </ul>
                <div className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                  Tip: Ask your student or admin for your login credentials if
                  you can&apos;t access the dashboard.
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
