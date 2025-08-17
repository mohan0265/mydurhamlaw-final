// src/pages/dashboard/calendar.tsx
'use client'

import { useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function CalendarPage() {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto py-8 sm:py-16 px-3 sm:px-4">
        <Button
          onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
          variant="ghost"
          className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold mb-4">📅 Calendar</h1>
        <p className="text-sm sm:text-base text-gray-700">This is your legal study calendar. Attendance, deadlines, and lecture timelines will be shown here.</p>
      </main>
    </div>
  )
}
