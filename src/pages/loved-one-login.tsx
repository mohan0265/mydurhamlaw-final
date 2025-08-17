'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Heart, Mail, ArrowRight, Lock, Shield } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BrandTitle } from '@/components/ui/BrandTitle'
import toast from 'react-hot-toast'

export default function LovedOneLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [studentInfo, setStudentInfo] = useState<any>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        toast.error('Unable to connect to database');
        setIsLoading(false);
        return;
      }
      
      // Check if this email is authorized as a parent/loved one
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id, display_name, user_type, parent1_email, parent1_relationship, parent1_display_name, parent2_email, parent2_relationship, parent2_display_name')
        .or(`parent1_email.eq.${email},parent2_email.eq.${email}`)

      if (error) throw error

      if (!students || students.length === 0) {
        toast.error('This email is not authorized as a loved one for any student. Please ask your student to add you in their settings.')
        setIsLoading(false)
        return
      }

      // For simplicity, take the first student (in real app, handle multiple)
      const student = students[0]
      if (!student) {
        toast.error('Student information not found. Please try again.')
        setIsLoading(false)
        return
      }
      
      setStudentInfo(student)

      // Generate a secure login token
      const loginToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store the token
      const { error: tokenError } = await supabase
        .from('parent_session_tokens')
        .insert({
          parent_email: email,
          student_id: student.id,
          token_hash: loginToken, // In production, hash this
          expires_at: expiresAt.toISOString()
        })

      if (tokenError) throw tokenError

      // Store token in session storage for this session
      sessionStorage.setItem('parent_token', loginToken)
      sessionStorage.setItem('parent_email', email)
      sessionStorage.setItem('student_id', student.id)

      // Show success and redirect
      toast.success(`Welcome! You're connected to ${student.display_name}`)
      router.push('/loved-one-dashboard')

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('Failed to verify access. Please try again.')
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
            
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit}>
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
                      placeholder="Enter the email your student added"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This must be the email address your student added to their account
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
                      <span>Connect</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Secure Access</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your access is completely controlled by your student. They can add or remove loved ones at any time, and you can only see what they choose to share.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Features */}
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Lock className="w-3 h-3" />
                <span>Student controls what you can see</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-3 h-3" />
                <span>Video calls only when student is available</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-3 h-3" />
                <span>Respects quiet hours and do-not-disturb</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Need help? Ask your student to check their{' '}
              <span className="font-medium">Family Settings</span> in their dashboard.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}