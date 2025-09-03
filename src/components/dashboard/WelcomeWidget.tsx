'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { DurhamAcademicCalendar } from '@/lib/durham/academicCalendar'
import { DELSATracker } from '@/lib/durham/delsa'
import { DurhamActivitiesManager } from '@/lib/durham/activities'
import { BrandTitle } from '@/components/ui/BrandTitle'

interface WelcomeWidgetProps {
  userName?: string
  studentProfile?: {
    academicYear: 1 | 2 | 3
    selectedModules: string[]
    delsa_progress: number
    career_path?: 'barrister' | 'solicitor' | 'academic' | 'other'
  }
}

export function WelcomeWidget({ userName = 'Student', studentProfile }: WelcomeWidgetProps) {
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [calendar] = useState(() => new DurhamAcademicCalendar())
  const [termInfo, setTermInfo] = useState<any>(null)
  const [nextMilestone, setNextMilestone] = useState<any>(null)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now)
      
      const hour = now.getHours()
      if (hour < 12) setGreeting('Good Morning')
      else if (hour < 17) setGreeting('Good Afternoon')
      else setGreeting('Good Evening')
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    
    // Get term information
    const currentTerm = calendar.getCurrentTerm()
    const currentWeek = calendar.getCurrentWeek()
    const progress = calendar.getTermProgress()
    const motivationalMessage = calendar.getMotivationalMessage()
    
    setTermInfo({
      currentTerm,
      currentWeek,
      progress,
      motivationalMessage
    })
    
    // Get next DELSA milestone if student profile available
    if (studentProfile) {
      const mockProgress = Array.from({ length: studentProfile.delsa_progress }, (_, i) => ({
        milestoneId: i + 1,
        completed: true,
        completedDate: new Date()
      }))
      
      const nextMilestones = DELSATracker.getNextMilestones(mockProgress, 1)
      if (nextMilestones.length > 0) {
        setNextMilestone(nextMilestones[0])
      }
    }
    
    return () => clearInterval(interval)
  }, [calendar, studentProfile])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card gradient hover className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full translate-y-12 -translate-x-12" />
      
      <CardContent className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {greeting}, {userName} 👋
            </h1>
            {termInfo?.motivationalMessage ? (
              <p className="text-gray-600">{termInfo.motivationalMessage}</p>
            ) : (
              <p className="text-gray-600">Ready to excel in your legal studies today?</p>
            )}
          </div>
          <div className="text-right">
            <Badge variant="purple" size="lg" className="mb-2">
              ⚖️ <BrandTitle variant="light" size="sm" as="span" />
            </Badge>
            {studentProfile && (
              <div className="text-xs text-gray-500">
                Year {studentProfile.academicYear} Student
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <div>•</div>
            <span>{formatDate(currentTime)}</span>
          </div>
          
          {/* Term Progress */}
          {termInfo?.currentTerm && termInfo?.progress && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {termInfo.currentTerm.name}
                </span>
                <span className="text-xs text-gray-500">
                  Week {termInfo.progress.current} of {termInfo.progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${termInfo.progress.percentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Next DELSA Task */}
          {nextMilestone && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm">🎯</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Next DELSA Task:
                  </p>
                  <p className="text-xs text-blue-600">
                    {nextMilestone.title}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}