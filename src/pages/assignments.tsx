// src/pages/assignments.tsx
'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { FileText, ArrowLeft, BookOpen, Clock } from 'lucide-react'

type Assignment = {
  id: string
  title: string
  due_date?: string
}

const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const { user } = useContext(AuthContext)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return
      
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
        if (!error && data) setAssignments(data as Assignment[])
      } catch (error) {
        console.error('Error fetching assignments:', error)
      }
    }
    fetchAssignments()
  }, [user?.id])

  return assignments
}

export default function AssignmentsPage() {
  useScrollToTop()

  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  const assignments = useAssignments()

  useEffect(() => {
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
          <p className="text-gray-600">Loading Assignment Assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0`}>
        <BackToHomeButton />
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            <Card gradient className="flex-1">
              <CardContent className="py-3 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-2xl">
                    <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Assignment Assistant</h1>
                    <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Your AI helper for legal coursework and research</p>
                    <p className="text-xs text-gray-600 sm:hidden">AI coursework helper</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Current Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-blue-50 rounded-lg p-2 sm:p-3 border-l-4 border-blue-500"
                      >
                        <p className="font-medium text-gray-800 text-xs sm:text-sm">{assignment.title}</p>
                        <p className="text-xs text-gray-600">
                          Due: {assignment.due_date ? new Date(assignment.due_date).toDateString() : 'TBD'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-500">No assignments found.</div>
                  )}
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Assistant Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2">
                  <p>• Essay structure guidance</p>
                  <p>• Research methodology help</p>
                  <p>• Citation format assistance</p>
                  <p>• Legal argument development</p>
                  <p>• Study planning support</p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Academic Writing & Research Assistant</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Ask about essay structure, research methods, or get help with your assignments...</p>
              </div>
            </div>
          </div>
        </main>



      </div>
    </div>
  )
}
