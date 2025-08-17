'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, Calendar, Award, Brain, Target } from 'lucide-react'
import { DURHAM_LAW_MODULES } from '@/lib/durham/modules'
import { DELSATracker, DELSA_MILESTONES } from '@/lib/durham/delsa'

interface ProgressWidgetProps {
  studentProfile?: {
    academicYear: 1 | 2 | 3
    selectedModules: string[]
    delsa_progress: number
    career_path?: 'barrister' | 'solicitor' | 'academic' | 'other'
  }
}

export function ProgressWidget({ studentProfile }: ProgressWidgetProps) {
  // Generate progress data from student's actual modules
  const progressData = studentProfile?.selectedModules.map((moduleCode, index) => {
    const moduleInfo = DURHAM_LAW_MODULES[moduleCode]
    if (!moduleInfo) return null
    
    // Mock progress data - in real app, this would come from user data
    const mockProgress = [78, 65, 45, 89, 72, 83][index] || 70
    const colors = ['blue', 'green', 'purple', 'amber'] as const
    const icons = ['⚖️', '📋', '🔍', '⚡', '🏛️', '📚']
    
    return {
      subject: moduleInfo.name,
      progress: mockProgress,
      color: colors[index % colors.length],
      icon: icons[index % icons.length],
      nextDeadline: mockProgress > 85 ? 'On track' : mockProgress > 60 ? 'Assignment due soon' : 'Catch up needed'
    }
  }).filter(Boolean) || [
    {
      subject: 'Contract Law',
      progress: 65,
      color: 'blue' as const,
      icon: '📋',
      nextDeadline: 'Please update your profile'
    }
  ]

  const overallProgress = Math.round(
    progressData.reduce((sum, item) => sum + (item?.progress || 0), 0) / progressData.length
  )

  return (
    <Card hover>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Study Progress
          </CardTitle>
          <Badge variant="success">
            {overallProgress}% Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* DELSA Progress */}
        {studentProfile && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-800">DELSA Progress</h4>
                <p className="text-sm text-gray-600">Durham Employability & Legal Skills Award</p>
              </div>
            </div>
            <ProgressBar 
              progress={Math.round((studentProfile.delsa_progress / 16) * 100)} 
              color="blue" 
              size="lg"
              showLabel
              label={`${studentProfile.delsa_progress}/16 Milestones`}
            />
            <div className="mt-2 text-xs text-blue-600">
              {DELSATracker.getMotivationalMessage(
                Array.from({ length: studentProfile.delsa_progress }, (_, i) => ({
                  milestoneId: i + 1,
                  completed: true,
                  completedDate: new Date()
                }))
              )}
            </div>
          </div>
        )}
        
        {/* Overall Module Progress */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-gray-800">Module Progress</h4>
              <p className="text-sm text-gray-600">Across all current modules</p>
            </div>
          </div>
          <ProgressBar 
            progress={overallProgress} 
            color="green" 
            size="lg"
            showLabel
            label="Overall Academic Progress"
          />
        </div>

        {/* Subject Progress */}
        <div>
          <h5 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Module Progress
          </h5>
          <div className="space-y-4">
            {progressData.filter(subject => subject != null).map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{subject.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {subject.subject}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {subject.progress}%
                  </span>
                </div>
                <ProgressBar 
                  progress={subject.progress} 
                  color={subject.color}
                  size="sm"
                />
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{subject.nextDeadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}