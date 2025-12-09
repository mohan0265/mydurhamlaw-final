'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Heart, Mail, ArrowRight, Lock, Shield, Check } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandTitle } from '@/components/ui/BrandTitle'
import toast from 'react-hot-toast'

export default function LovedOneLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    const supabase = getSupabaseClient()
    if (!supabase) {
      toast.error('System unavailable')
      setIsLoading(false)
      return
    }

    try {
      // We use signInWithOtp for Magic Link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/loved-one-dashboard`,
          data: {
            role: 'loved_one' // Hint to create profile with this role if new
          }
        },
      })

      if (error) throw error

      setIsSent(true)
      toast.success('Login link sent!')
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to send login link')
    } finally {
      setIsLoading(false)
    }
  }

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
              <div className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-full">
                <Heart className="w-8 h-8 text-white" />
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

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
            
            {!isSent ? (
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    We'll send you a secure Magic Link to log in. No password needed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <span>Send Login Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a login link to <strong>{email}</strong>. Click it to sign in instantly.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-pink-600 hover:text-pink-700 font-medium text-sm"
                >
                  Use a different email
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Secure Access</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your access is completely controlled by your student. They must add your email to their settings first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}