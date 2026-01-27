// src/pages/signup.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Brain, Users, Trophy } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isRouteAbortError } from '@/lib/navigation/safeNavigate'
import { Logo } from '@/components/ui/Logo'
import { BrandTitle } from '@/components/ui/BrandTitle'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

type YearGroup = 'foundation' | 'year1' | 'year2' | 'year3'

export default function SignUpPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [yearGroup, setYearGroup] = useState<YearGroup | ''>('')
  const [agree, setAgree] = useState(false)
  
  const { plan } = router.query;
  const planId = Array.isArray(plan) ? plan[0] : plan;

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Logged-in guard: redirect to dashboard
        router.replace('/dashboard').catch((err) => {
          if (!isRouteAbortError(err)) console.error('Nav error:', err);
        });
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <Logo variant="dark" size="md" href="/" />
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
            Already have an account? Sign In
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex items-center justify-center min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6 w-full">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome to <BrandTitle variant="light" size="4xl" as="span" />
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto font-medium">
              MyDurhamLaw is an independent study companion designed around the Durham Law journey. <br />
              It is not affiliated with or endorsed by Durham University.
            </p>
          </div>

          {/* Features (kept) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI Study Assistant</h3>
              <p className="text-gray-600">Personalised help with your legal studies</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Year-Specific Content</h3>
              <p className="text-gray-600">Tailored to your year of study</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
              <p className="text-gray-600">Monitor your learning journey</p>
            </div>
          </div>

          {/* The actual signup form */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Alex Chen"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year group</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['foundation', 'year1', 'year2', 'year3'] as YearGroup[]).map((yg) => (
                    <button
                      key={yg}
                      type="button"
                      onClick={() => setYearGroup(yg)}
                      className={`py-2 rounded-lg border ${
                        yearGroup === yg
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {yg === 'foundation' ? 'Foundation' : yg.replace('year', 'Year ')}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
                <span>
                  I agree to the{' '}
                  <Link href="/legal/terms-of-use" className="text-purple-600 hover:underline">
                    Terms of Use
                  </Link>{' '}
                  and{' '}
                  <Link href="/legal/privacy-policy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Use the *correct* button that passes metadata */}
            <GoogleSignInButton
              agree={agree}
              displayName={displayName}
              yearGroup={yearGroup as YearGroup}
              plan={planId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
