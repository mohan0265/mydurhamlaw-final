'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Target, Clock, CheckCircle2 } from 'lucide-react'

export function StudyFocusWidget() {
  const [currentFocus] = useState({
    subject: 'Constitutional Law',
    topic: 'Parliamentary Sovereignty',
    timeAllocated: '2 hours',
    progress: 65,
    priority: 'high' as const
  })

  const todaysTasks = [
    { id: 1, task: 'Read Miller v Secretary of State case', completed: true },
    { id: 2, task: 'Review lecture notes on EU law', completed: true },
    { id: 3, task: 'Complete essay outline', completed: false },
    { id: 4, task: 'Practice past exam questions', completed: false }
  ]

  const completedTasks = todaysTasks.filter(task => task.completed).length

  return (
    <Card hover>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Today&rsquo;s Focus
          </CardTitle>
          <Badge variant={currentFocus.priority === 'high' ? 'warning' : 'info'}>
            {currentFocus.priority === 'high' ? '🔥 Priority' : '📚 Regular'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-800">{currentFocus.subject}</h4>
              <p className="text-sm text-gray-600">{currentFocus.topic}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{currentFocus.timeAllocated}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedTasks}/{todaysTasks.length} tasks</span>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-3">Today&rsquo;s Tasks</h5>
          <div className="space-y-2">
            {todaysTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  task.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {task.completed && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm ${
                  task.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                }`}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}