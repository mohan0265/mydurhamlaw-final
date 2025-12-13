// src/pages/wellbeing.tsx
'use client'

import { useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Heart, Brain, Mic, BookOpen } from 'lucide-react'

export default function WellbeingPage() {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-16 px-3 sm:px-4">
      <Button
        onClick={() => router.push(getDashboardRoute?.() || '/dashboard')}
        variant="ghost"
        className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>
      
      <div className="text-center mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-pink-500" />
          Wellbeing & AI Tools
        </h1>
        <p className="text-sm sm:text-base text-gray-700 max-w-2xl mx-auto">
          Access AI-powered tools for mental health support, voice chat, and academic assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-500" />
            <h2 className="text-lg font-semibold">AI Chat Assistant</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Chat with our AI assistant for academic support, study guidance, and general questions.
          </p>
          <Button 
            onClick={() => router.push('/chat')}
            className="w-full"
          >
            Start Chat
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-8 h-8 text-blue-500" />
            <h2 className="text-lg font-semibold">Voice Assistant</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Use voice commands and have spoken conversations with our AI assistant.
          </p>
          <Button 
            onClick={() => router.push('/voice-debug')}
            variant="outline"
            className="w-full"
          >
            Voice Chat
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-amber-500" />
            <h2 className="text-lg font-semibold">Transcript Library</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Review and manage transcripts from your Durmah voice sessions.
          </p>
          <Button 
            onClick={() => router.push('/my/voice-transcripts')}
            variant="outline"
            className="w-full"
          >
            View Library
          </Button>
        </div>
      </div>
    </div>
  )
}
