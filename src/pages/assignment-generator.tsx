'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardContent } from '@/components/ui/Card'
import AssignmentGenerator from '@/components/assignment/AssignmentGenerator'
import IntegrityPledge from '@/components/integrity/IntegrityPledge'
import DisclosureBanner from '@/components/integrity/DisclosureBanner'
import { ArrowLeft, Wand2, Shield, Brain, Zap } from 'lucide-react'

export default function AssignmentGeneratorPage() {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPledge, setShowPledge] = useState(false)

  useEffect(() => {
    // Auto-scroll to top on page load
    window.scrollTo(0, 0)
    
    const getUser = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.warn('Supabase client not available')
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
        } else {
          setUser(session.user)
          // Integrity pledge check removed for now
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading Assignment Generator...</p>
        </div>
      </div>
    )
  }

  const handlePledgeAcknowledged = () => {
    setShowPledge(false)
    // AuthContext will automatically update from database
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0`}>
        {/* AI Disclosure Banner - temporarily disabled */}
        {false && (
          <DisclosureBanner />
        )}
        
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
              className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            <Card gradient className="flex-1">
              <CardContent className="py-3 sm:py-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <Wand2 className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Assignment Generator</h1>
                    <p className="text-sm sm:text-base text-gray-600">AI-powered assignment writing with your personal style</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
            <Card hover className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Human-Mode Drafting™</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  AI learns your unique writing style for personalized, undetectable content
                </p>
              </CardContent>
            </Card>

            <Card hover className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">AI Detection Proof</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Advanced algorithms bypass AI detection tools for natural writing
                </p>
              </CardContent>
            </Card>

            <Card hover className="text-center">
              <CardContent className="p-4 sm:p-6">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Instant Generation</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Generate high-quality legal assignments in seconds with AI
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Generator */}
          <AssignmentGenerator userId={user?.id} />

          {/* How It Works */}
          <Card>
            <CardContent className="p-4 sm:p-8">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
                How Human-Mode Drafting™ Works
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm sm:text-base">
                    1
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-2">Upload Samples</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Add your past essays or writing samples to build your style profile
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm sm:text-base">
                    2
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-2">AI Analysis</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Advanced AI analyzes your writing patterns, vocabulary, and style
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm sm:text-base">
                    3
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-2">Style Matching</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Generate content that perfectly matches your unique writing voice
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4 font-bold text-sm sm:text-base">
                    4
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold mb-2">Continuous Learning</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    System improves with each assignment and edit you make
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  !
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-yellow-800 mb-2">Academic Integrity Notice</h3>
                  <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
                    This tool is designed to assist with learning and understanding legal concepts. 
                    Always ensure your work complies with your institution&apos;s academic integrity policies. 
                    Use generated content as a starting point for your own analysis and research.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/20 backdrop-blur-sm bg-white/50 py-4 sm:py-8 text-center">
          <div className="max-w-6xl mx-auto px-3 sm:px-6">
            <p className="text-xs sm:text-sm text-gray-500">
              &copy; 2024 MyDurhamLaw AI Study Assistant. Human-Mode Drafting™ and Private Style Memory™ are proprietary technologies.
            </p>
            <p className="text-xs text-gray-400 mt-1 sm:mt-2">
              Powered by advanced AI and vector similarity matching for personalized content generation.
            </p>
          </div>
        </footer>
      </div>

      {/* Integrity Pledge Modal */}
      <IntegrityPledge
        isOpen={showPledge}
        onClose={() => setShowPledge(false)}
        onAcknowledged={handlePledgeAcknowledged}
      />
    </div>
  )
}