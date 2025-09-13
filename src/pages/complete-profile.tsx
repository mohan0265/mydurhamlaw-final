'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { BookOpen, User, GraduationCap, ArrowRight } from 'lucide-react'
import { getSupabaseClient, debugAuthState } from '@/lib/supabase/client'
import { getDashboardRoute } from '@/lib/utils/metadata-storage'
import toast from 'react-hot-toast'
import { Logo } from '@/components/ui/Logo'
import { BrandTitle } from '@/components/ui/BrandTitle'

type YearGroup = 'foundation' | 'year1' | 'year2' | 'year3'

interface YearOption {
  value: YearGroup
  label: string
  description: string
  icon: string
}

const yearOptions: YearOption[] = [
  {
    value: 'foundation',
    label: 'Foundation Year',
    description: 'Preparing for undergraduate law studies',
    icon: '🎯'
  },
  {
    value: 'year1',
    label: 'Year 1',
    description: 'First year undergraduate law student',
    icon: '📚'
  },
  {
    value: 'year2',
    label: 'Year 2',
    description: 'Second year undergraduate law student',
    icon: '⚖️'
  },
  {
    value: 'year3',
    label: 'Year 3',
    description: 'Final year undergraduate law student',
    icon: '🎓'
  }
]

export default function CompleteProfilePage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<YearGroup | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { session, error } = await debugAuthState()
        
        if (error || !session?.user) {
          console.log('❌ No authenticated user, redirecting to signup')
          router.push('/signup')
          return
        }

        const currentUser = session.user
        setUser(currentUser)
        
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.log('❌ Supabase client not available, redirecting to signup')
          router.push('/signup')
          return
        }

        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, year_group, display_name')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (existingProfile) {
          console.log('✅ User already has profile, redirecting to dashboard')
          const dashboardRoute = getDashboardRoute(existingProfile.year_group)
          router.push(dashboardRoute)
          return
        }

        // Pre-fill display name from Google account
        const suggestedName = currentUser.user_metadata?.name || 
                             currentUser.user_metadata?.full_name || 
                             currentUser.email?.split('@')[0] || 
                             ''
        setDisplayName(suggestedName)
        
        setInitializing(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/signup')
      }
    }

    checkAuth()
  }, [router])

  const handleCompleteProfile = async () => {
    if (!selectedYear) {
      toast.error('Please select your academic year')
      return
    }

    if (!displayName.trim()) {
      toast.error('Please enter your display name')
      return
    }

    if (!user) {
      toast.error('Authentication error. Please try signing up again.')
      router.push('/signup')
      return
    }

    setLoading(true)

    try {
      console.log('🆕 Creating profile for user:', user.id)

      const profileData = {
        id: user.id,
        year_group: selectedYear,
        display_name: displayName.trim(),
        agreed_to_terms: true,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      }

      const supabase = getSupabaseClient()
      if (!supabase) {
        toast.error('Service unavailable. Please try again later.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([profileData])

      if (insertError) {
        console.error('🚨 Profile creation error:', insertError)
        
        if (insertError.code === '23505') {
          // Profile already exists, fetch it
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('year_group')
            .eq('id', user.id)
            .single()
          
          if (existingProfile) {
            console.log('✅ Profile already exists, redirecting')
            const dashboardRoute = getDashboardRoute(existingProfile.year_group)
            router.push(dashboardRoute)
            return
          }
        }
        
        toast.error(`Failed to create profile: ${insertError.message}`)
        setLoading(false)
        return
      }

      console.log('✅ Profile created successfully!')
      toast.success(`Welcome ${displayName}! Let's complete your onboarding setup...`)

      // Redirect to onboarding for new users
      setTimeout(() => {
        router.push('/onboarding/OnboardingPage')
      }, 1000)

    } catch (error: any) {
      console.error('🚨 Profile completion error:', error)
      toast.error(`Something went wrong: ${error.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Logo variant="dark" size="md" href="/" showIcon={true} showText={false} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900"><BrandTitle variant="light" size="2xl" as="span" /></h1>
              <p className="text-sm text-gray-600">Complete Your Profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Durham Law! 🎉
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Let&apos;s personalize your experience
          </p>
          <p className="text-gray-500">
            Just a couple more details to get you started with your AI study companion
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Display Name Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Your Display Name</h3>
              </div>
              <p className="text-gray-600 mb-4">
                This is how you&apos;ll be addressed throughout the app
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your preferred name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
                maxLength={50}
              />
            </div>

            {/* Academic Year Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Select Your Academic Year</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Choose your current year of study to get personalized content
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {yearOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedYear(option.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                      selectedYear === option.value
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{option.label}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Profile Button */}
            <button
              onClick={handleCompleteProfile}
              disabled={loading || !selectedYear || !displayName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Setting up your dashboard...</span>
                </div>
              ) : (
                <>
                  <span>Complete Profile & Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Preview */}
            {selectedYear && displayName.trim() && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <p className="font-medium text-gray-900">
                  Welcome <span className="text-purple-600">{displayName}</span>! 
                  You&apos;ll be redirected to your {yearOptions.find(y => y.value === selectedYear)?.label} dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}