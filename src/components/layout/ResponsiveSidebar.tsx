'use client'

import { useState, useEffect, useContext, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { clsx } from 'clsx'
import { 
  Home,
  MessageSquare,
  BookOpen,
  Calendar,
  FileText,
  Search,
  Brain,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Menu,
  X
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'

interface ResponsiveSidebarProps {
  className?: string
}

export default function ResponsiveSidebar({ className }: ResponsiveSidebarProps) {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [user, setUser] = useState<any>(null)
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<number>(0)
  
  // Desktop collapse state - default to true (closed)
  const [isCollapsed, setIsCollapsed] = useState(true)
  // Mobile overlay state
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mdl:navCollapsed')
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Auto-close mobile sidebar on route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsMobileOpen(false)
    }
    
    router.events.on('routeChangeStart', handleRouteChangeStart)
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
    }
  }, [router])

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('mdl:navCollapsed', JSON.stringify(isCollapsed))
    
    // Update CSS variable for main content margin
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      isCollapsed ? '4rem' : '16rem'
    )
  }, [isCollapsed])

  // Handle escape key for mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileOpen])

  // Handle outside click for mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileOpen])

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return
      
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user)
      
      // Fetch onboarding status and progress if user exists
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_status, onboarding_progress')
            .eq('id', session.user.id)
            .single()

          if (!error && data) {
            setOnboardingStatus(data.onboarding_status)
            setOnboardingProgress(data.onboarding_progress || 0)
          }
        } catch (err) {
          console.error('Error fetching onboarding status:', err)
        }
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const openMobileMenu = () => {
    setIsMobileOpen(true)
  }

  const closeMobileMenu = () => {
    setIsMobileOpen(false)
  }

  const shouldShowOnboardingBadge = () => {
    return false // Always hide onboarding badges to remove gating
  }

  const getOnboardingBadgeText = () => {
    return null // Always return null to remove trial/incomplete gating
  }

  const getOnboardingBadgeColor = () => {
    if (onboardingStatus === 'partial' && onboardingProgress >= 50) {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-red-100 text-red-800'
  }

  const navigationItems = [
    {
      title: 'Dashboard',
      href: getDashboardRoute(),
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Research Hub',
      href: '/research-hub',
      icon: Search,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Study Schedule',
      href: '/study-schedule',
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Assignments',
      href: '/assignments',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Reflect & Grow',
      href: '/tools/memory-manager',
      icon: Brain,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Wellbeing',
      href: '/wellbeing',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ]

  const personalizationItems = [
    {
      title: '🎓 Onboarding Setup',
      href: '/onboarding/OnboardingPage',
      icon: GraduationCap,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      needsBadge: true
    }
  ]

  const isActive = (href: string) => {
    if (href.includes('#')) {
      return router.pathname === href.split('#')[0]
    }
    return router.pathname === href
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className={clsx(
            'flex items-center gap-3',
            isCollapsed && 'justify-center'
          )}>
            {isCollapsed ? (
              <Logo variant="dark" size="sm" href="/" showIcon={true} showText={false} />
            ) : (
              <div className="flex flex-col">
                <Logo variant="dark" size="sm" href="/" />
                <p className="text-xs text-gray-500 ml-7">Study Assistant</p>
              </div>
            )}
          </div>
          
          {/* Desktop toggle button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] items-center justify-center"
            aria-expanded={!isCollapsed}
            aria-controls="sidebar-nav"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav id="sidebar-nav" className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon
          const active = isActive(item.href)

          return (
            <Link 
              key={index} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={clsx(
                'group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 min-h-[44px]',
                active 
                  ? `${item.bgColor} ${item.color} shadow-sm` 
                  : 'text-gray-600 hover:bg-gray-50',
                isCollapsed && 'justify-center'
              )}>
                <IconComponent className={clsx(
                  'w-5 h-5 transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-105'
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}

                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                )}
              </div>
            </Link>
          )
        })}

        {/* Personalization Section */}
        {!isCollapsed && (
          <div className="pt-6">
            <div className="px-3 pb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personalization</h3>
            </div>
            {personalizationItems.map((item, index) => {
              const IconComponent = item.icon
              const active = isActive(item.href)

              return (
                <Link 
                  key={`personalization-${index}`} 
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className={clsx(
                    'group relative flex items-center justify-between p-3 rounded-xl transition-all duration-200 min-h-[44px]',
                    active 
                      ? `${item.bgColor} ${item.color} shadow-sm` 
                      : 'text-gray-600 hover:bg-gray-50'
                  )}>
                    <div className="flex items-center gap-3">
                      <IconComponent className={clsx(
                        'w-5 h-5 transition-transform duration-200',
                        active ? 'scale-110' : 'group-hover:scale-105'
                      )} />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.needsBadge && shouldShowOnboardingBadge() && (
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getOnboardingBadgeColor()
                      )}>
                        {getOnboardingBadgeText()}
                      </span>
                    )}

                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-teal-500 to-blue-600 rounded-r-full" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Collapsed Personalization Section */}
        {isCollapsed && personalizationItems.map((item, index) => {
          const IconComponent = item.icon
          const active = isActive(item.href)

          return (
            <Link 
              key={`personalization-collapsed-${index}`} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={clsx(
                'group relative flex items-center justify-center p-3 rounded-xl transition-all duration-200 min-h-[44px]',
                active 
                  ? `${item.bgColor} ${item.color} shadow-sm` 
                  : 'text-gray-600 hover:bg-gray-50'
              )}>
                <IconComponent className={clsx(
                  'w-5 h-5 transition-transform duration-200',
                  active ? 'scale-110' : 'group-hover:scale-105'
                )} />
                {item.needsBadge && shouldShowOnboardingBadge() && (
                  <div className={clsx(
                    'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                    onboardingStatus === 'partial' && onboardingProgress >= 50 ? 'bg-orange-400' : 'bg-red-400'
                  )}></div>
                )}

                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-teal-500 to-blue-600 rounded-r-full" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200/50">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">MyDurhamLaw Student</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => {
              router.push('/settings')
              setIsMobileOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors duration-200 min-h-[44px]',
              isCollapsed && 'justify-center'
            )}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </button>

          <button
            onClick={() => {
              handleLogout()
              setIsMobileOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 min-h-[44px]',
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button - positioned absolutely */}
      <button
        onClick={openMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200"
        aria-label="Open menu"
        aria-expanded={isMobileOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop sidebar */}
      <div 
        className={clsx(
          'hidden lg:block fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 ease-in-out shadow-lg z-30',
          isCollapsed ? 'w-16' : 'w-64',
          'hover:w-64 group'
        )}
        onMouseEnter={() => {
          if (isCollapsed) {
            document.documentElement.style.setProperty('--sidebar-width', '16rem')
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed) {
            document.documentElement.style.setProperty('--sidebar-width', '4rem')
          }
        }}
      >
        <div className={clsx(
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'group-hover:block' : 'block'
        )}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div 
        ref={sidebarRef}
        id="mobile-sidebar"
        className={clsx(
          'lg:hidden fixed left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 shadow-lg z-50 transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}