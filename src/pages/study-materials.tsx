import React, { useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function StudyMaterialsPage() {
  const router = useRouter()
  const authContext = useContext(AuthContext)
  const { getDashboardRoute } = authContext || { getDashboardRoute: () => '/dashboard' }
  
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-16 px-3 sm:px-4">
        <Button
          onClick={() => router.push(getDashboardRoute())}
          variant="ghost"
          className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold mb-4">📚 Study Materials</h1>
        <p className="text-sm sm:text-base text-gray-700">This page will offer curated case law, lecture slides, and textbook summaries.</p>
    </div>
  )
}
