'use client'

// Sidebar disabled via feature flag
const ENABLE_SIDEBAR = process.env.NEXT_PUBLIC_ENABLE_SIDEBAR === 'true'

import Link from 'next/link'
import { useState, useContext } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'

export default function Sidebar() {
  if (!ENABLE_SIDEBAR) return null
  const [isOpen, setIsOpen] = useState(true)
  const { getDashboardRoute } = useContext(AuthContext)

  // Provide a safe default function if getDashboardRoute is undefined
  const safeDashboardRoute = getDashboardRoute ? getDashboardRoute() : '/dashboard';

  return (
    <div className={`bg-white shadow-md transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} min-h-screen flex flex-col`}>
      {/* Toggle Button */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="text-lg font-bold text-blue-600 flex items-center space-x-2">
          {isOpen && <span>MyDurhamLaw</span>}
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-blue-600">
          {isOpen ? 'X' : 'Menu'}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-2">
        <Link href={safeDashboardRoute} className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-50">
          {isOpen && 'AI Assistant'}
        </Link>
        <Link href="/study-schedule" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-50">
          {isOpen && 'Study Calendar'}
        </Link>
        <Link href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-50">
          {isOpen && 'Study Materials'}
        </Link>
        <Link href="#" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-50">
          {isOpen && 'Reflect (Memory Manager)'}
        </Link>
        {/* ✅ References Link */}
        <Link href="/references" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-blue-50">
          {isOpen && 'References'}
        </Link>
      </nav>

      {/* Footer Settings */}
      <div className="p-4 border-t space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          {isOpen && <span>mohan0265@gmail.com</span>}
        </div>
        <Link href="#" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          {isOpen && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )
}
