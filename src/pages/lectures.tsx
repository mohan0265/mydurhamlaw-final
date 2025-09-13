// src/pages/dashboard/lectures.tsx
'use client'

import { useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function LecturesPage() {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-16 px-3 sm:px-4">
        <Button
          onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
          variant="ghost"
          className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mb-4">🎓 Lectures</h1>
        <p className="text-sm sm:text-base text-gray-700">Lecture notes, summaries, and attendance tracking will appear here.</p>
    </div>
  )
}
