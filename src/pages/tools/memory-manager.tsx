import React, { useState, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { ArrowLeft } from 'lucide-react'

export default function ReflectAndGrowPage() {
  const router = useRouter()
  const authContext = useContext(AuthContext)
  const { getDashboardRoute } = authContext || { getDashboardRoute: () => '/dashboard' }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <BackToHomeButton />
        <main className="p-6 space-y-8 max-w-7xl mx-auto">
          <Button
            onClick={() => router.push(getDashboardRoute())}
            variant="ghost"
            className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="pt-6">
            <h1 className="text-3xl font-bold mb-4 text-purple-800">Reflect & Grow</h1>
            <p className="text-gray-600 mb-6">Your weekly space to track reflections, receive AI feedback, and monitor your personal growth.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📝 Memory Journal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Write and review your daily reflections. Track thoughts over time.</p>
                  <Link 
                    href="/memory-journal"
                    className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-sm mt-4"
                  >
                    Open Journal
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🧠 Memory Recall Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Test your recall of key cases and facts from prior weeks.</p>
                  <Link 
                    href="/tools/memory"
                    className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-sm mt-4"
                  >
                    Start Recall Test
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💬 My Personal Reflections</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Explore your emotional state and AI journaling prompts.</p>
                  <Link 
                    href="/mental-health"
                    className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-4 py-2 text-sm mt-4"
                  >
                    Go to My Health & Wellbeing
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 Weekly Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 italic">
                    &quot;Which legal principle challenged your assumptions this week? How will you carry that learning forward?&quot;
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} };
}
