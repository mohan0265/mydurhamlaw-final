'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/router'
import { 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  FileText, 
  Brain,
  Search,
  Clock,
  Target,
  Users,
  Award
} from 'lucide-react'

export function QuickActionsWidget() {
  const router = useRouter()

  const quickActions = [
    {
      title: 'AI Assistant',
      description: 'Ask legal questions',
      icon: MessageSquare,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      onClick: () => {
        // Navigate to wellbeing page where AI chat is available
        router.push('/wellbeing')
      }
    },
    {
      title: 'Research Hub',
      description: 'Legal references & cases',
      icon: Search,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      onClick: () => router.push('/references')
    },
    {
      title: 'Study Schedule',
      description: 'Plan your week',
      icon: Calendar,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      onClick: () => router.push('/study-schedule')
    },
    {
      title: 'Assignments',
      description: 'Track deadlines',
      icon: FileText,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      onClick: () => router.push('/assignments')
    },
    {
      title: 'Reflect & Grow',
      description: 'Save important notes',
      icon: Brain,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      onClick: () => router.push('/tools/memory-manager')
    },
    {
      title: 'DELSA Tracking',
      description: 'Career milestones',
      icon: Award,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      onClick: () => router.push('/delsa')
    },
    {
      title: 'Durham Societies',
      description: 'Mooting & Pro Bono',
      icon: Users,
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      onClick: () => router.push('/societies')
    },
    {
      title: 'Wellbeing',
      description: 'Mental health support',
      icon: Target,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      onClick: () => router.push('/wellbeing')
    }
  ]

  return (
    <Card hover>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                group relative p-4 rounded-xl border border-gray-200 min-h-[44px] min-w-[44px] 
                ${action.color} ${action.hoverColor}
                text-white transition-all duration-300
                hover:scale-105 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <action.icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                <div>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <p className="text-xs opacity-90">{action.description}</p>
                </div>
              </div>
              
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}