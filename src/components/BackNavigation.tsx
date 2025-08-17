// Reusable back navigation component for legal pages
// Shows "Back to Home" for non-authenticated users and "Back to Dashboard" for authenticated users

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'

interface BackNavigationProps {
  className?: string
}

export const BackNavigation: React.FC<BackNavigationProps> = ({ className = '' }) => {
  const { user, userProfile, getDashboardRoute } = useAuth()

  // Determine navigation destination
  const isAuthenticated = !!user
  const hasProfile = !!userProfile
  
  let destination = '/'
  let buttonText = 'Back to Home'
  let icon = <Home className="w-4 h-4" />
  
  if (isAuthenticated && hasProfile) {
    destination = getDashboardRoute?.() || '/dashboard'
    buttonText = 'Back to Dashboard'
    icon = <LayoutDashboard className="w-4 h-4" />
  } else if (isAuthenticated && !hasProfile) {
    destination = '/complete-profile'
    buttonText = 'Complete Profile'
    icon = <LayoutDashboard className="w-4 h-4" />
  }

  return (
    <div className={`flex justify-start ${className}`}>
      <Link
        href={destination}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        {icon}
        <span>{buttonText}</span>
      </Link>
    </div>
  )
}

export default BackNavigation