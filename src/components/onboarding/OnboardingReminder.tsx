'use client'

import React, { useContext, useState, useEffect } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Calendar, Target, FileText, Clock, BookOpen, X, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface ReminderCard {
  id: string
  icon: React.ComponentType<any>
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  bgColor: string
  iconColor: string
}

export const OnboardingReminder: React.FC = () => {
  const { session } = useContext(AuthContext)
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<number>(0)
  const [documentsUploaded, setDocumentsUploaded] = useState<any[]>([])
  const [academicGoal, setAcademicGoal] = useState<string | null>(null)
  const [reminderCards, setReminderCards] = useState<ReminderCard[]>([])
  const [dismissedCards, setDismissedCards] = useState<string[]>([])

  useEffect(() => {
    const fetchOnboardingData = async () => {
      if (session?.user) {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) return
          
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_status, onboarding_progress, uploaded_docs, academic_goal')
            .eq('id', session.user.id)
            .single()

          if (!error && data) {
            setOnboardingStatus(data.onboarding_status)
            setOnboardingProgress(data.onboarding_progress || 0)
            setDocumentsUploaded(data.uploaded_docs || [])
            setAcademicGoal(data.academic_goal)
          }
        } catch (err) {
          console.error('Error fetching onboarding data:', err)
        }
      }
    }

    fetchOnboardingData()
  }, [session])

  useEffect(() => {
    if (onboardingStatus === 'complete') {
      setReminderCards([])
      return
    }

    const cards: ReminderCard[] = []
    const uploadedDocTypes = documentsUploaded.map(doc => doc.stepId)

    // Check for missing documents
    if (!uploadedDocTypes.includes('timetable')) {
      cards.push({
        id: 'timetable-missing',
        icon: Calendar,
        title: '📅 Timetable Missing',
        message: 'Upload your term calendar to enable smart reminders and deadline tracking.',
        priority: 'high',
        bgColor: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600'
      })
    }

    if (!uploadedDocTypes.includes('syllabus')) {
      cards.push({
        id: 'syllabus-missing',
        icon: FileText,
        title: '📚 Course Syllabus Missing',
        message: 'Upload your course syllabus to unlock personalized study recommendations.',
        priority: 'high',
        bgColor: 'bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600'
      })
    }

    if (!uploadedDocTypes.includes('assignments')) {
      cards.push({
        id: 'assignments-missing',
        icon: Target,
        title: '📝 Assignment Deadlines Missing',
        message: 'Add your assignment information to get deadline reminders and progress tracking.',
        priority: 'medium',
        bgColor: 'bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600'
      })
    }

    if (!uploadedDocTypes.includes('exams')) {
      cards.push({
        id: 'exams-missing',
        icon: Clock,
        title: '⏰ Exam Timetable Missing',
        message: 'Upload your exam schedule to create optimal study plans and revision reminders.',
        priority: 'high',
        bgColor: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600'
      })
    }

    if (!academicGoal) {
      cards.push({
        id: 'goals-not-set',
        icon: Target,
        title: '🎯 Academic Goals Not Set',
        message: 'Set your academic goals to unlock personalized coaching insights and motivation.',
        priority: 'medium',
        bgColor: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600'
      })
    }

    // Filter out dismissed cards
    const filteredCards = cards.filter(card => !dismissedCards.includes(card.id))
    
    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    filteredCards.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    
    setReminderCards(filteredCards.slice(0, 3)) // Show max 3 cards
  }, [onboardingStatus, documentsUploaded, academicGoal, dismissedCards])

  const dismissCard = (cardId: string) => {
    setDismissedCards(prev => [...prev, cardId])
  }

  if (onboardingStatus === 'complete' || reminderCards.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Main onboarding progress card */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-teal-800">🚀 Complete Your Onboarding</h3>
                <p className="text-sm text-teal-600">
                  {onboardingProgress}% complete • Unlock smart reminders & personalized AI study tips
                </p>
              </div>
            </div>
            <Link
              href="/onboarding/OnboardingPage"
              className="inline-flex items-center px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="w-full bg-teal-200 rounded-full h-2">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${onboardingProgress}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Individual reminder cards */}
      {reminderCards.map((card) => {
        const IconComponent = card.icon
        return (
          <Card key={card.id} className={`${card.bgColor} border`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-1">{card.title}</h4>
                    <p className="text-sm text-gray-600">{card.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissCard(card.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Dismiss reminder"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Motivational message */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700 font-medium">
          🧠 <strong>The more we know about your modules and schedule, the better we can help you study smarter, not harder.</strong>
        </p>
        <p className="text-xs text-purple-600 mt-1">
          ⏳ Still missing some details? Upload now to activate your full academic dashboard.
        </p>
      </div>
    </div>
  )
}

export default OnboardingReminder