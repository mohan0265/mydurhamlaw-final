'use client'

import React, { useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ChevronDown, Menu, X, Scale, Home, MessageSquare, Settings, LogOut, User, Users, Calendar } from 'lucide-react'
import { Logo, useLogoVariant } from '@/components/ui/Logo'
import { UKTimeDisplay } from '@/components/ui/UKTimeDisplay'

const GlobalHeader = () => {
  const router = useRouter()
  const { session, userProfile } = useContext(AuthContext)
  const user = session?.user
  const userEmail = user?.email || null

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [aiToolsDropdownOpen, setAiToolsDropdownOpen] = useState(false)
  const [studyResourcesDropdownOpen, setStudyResourcesDropdownOpen] = useState(false)
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false)
  const [mobileSectionOpen, setMobileSectionOpen] = useState<string | null>(null)
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<number>(0)
  const [documentsUploaded, setDocumentsUploaded] = useState<any[]>([])
  
  // Get adaptive logo variant based on current route
  const logoVariant = useLogoVariant(router.pathname)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const aiToolsDropdownRef = useRef<HTMLDivElement | null>(null)
  const studyResourcesDropdownRef = useRef<HTMLDivElement | null>(null)
  const aboutDropdownRef = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (userProfile?.display_name) {
      setDisplayName(userProfile.display_name)
    } else if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name)
    } else {
      setDisplayName('')
    }

    const fetchAvatar = async () => {
      if (user) {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) return

          const { data: fileList, error: listError } = await supabase.storage
            .from('profile-pictures')
            .list('avatars', {
              limit: 1,
              search: `${user.id}.png`
            })

          if (listError || !fileList || fileList.length === 0) {
            setAvatarUrl(null)
            return
          }

          const { data, error } = await supabase.storage
            .from('profile-pictures')
            .createSignedUrl(`avatars/${user.id}.png`, 3600)

          if (error || !data?.signedUrl) {
            setAvatarUrl(null)
          } else {
            setAvatarUrl(data.signedUrl)
          }
        } catch (err) {
          console.error('Avatar fetch error:', err)
          setAvatarUrl(null)
        }
      }
    }

    fetchAvatar()

    // Fetch onboarding status and progress
    const fetchOnboardingStatus = async () => {
      if (user) {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) return

          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_status, onboarding_progress, uploaded_docs')
            .eq('id', user.id)
            .single()

          if (!error && data) {
            setOnboardingStatus(data.onboarding_status)
            setOnboardingProgress(data.onboarding_progress || 0)
            setDocumentsUploaded(data.uploaded_docs || [])
          }
        } catch (err) {
          console.error('Error fetching onboarding status:', err)
        }
      }
    }

    fetchOnboardingStatus()
  }, [user, userProfile])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (aiToolsDropdownRef.current && !aiToolsDropdownRef.current.contains(event.target as Node)) {
        setAiToolsDropdownOpen(false)
      }
      if (studyResourcesDropdownRef.current && !studyResourcesDropdownRef.current.contains(event.target as Node)) {
        setStudyResourcesDropdownOpen(false)
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target as Node)) {
        setAboutDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-close mobile menu and dropdowns on route changes
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setMobileMenuOpen(false)
      setAiToolsDropdownOpen(false)
      setStudyResourcesDropdownOpen(false)
      setAboutDropdownOpen(false)
      setDropdownOpen(false)
    }
    
    router.events.on('routeChangeStart', handleRouteChangeStart)
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
    }
  }, [router])

  const getDashboardPath = () => {
    const userType = userProfile?.user_type || userProfile?.year_group || user?.user_metadata?.year_group || 'year1'
    switch (userType) {
      case 'foundation':
        return '/dashboard/foundation'
      case 'year1':
        return '/dashboard/year1'
      case 'year2':
        return '/dashboard/year2'
      case 'year3':
        return '/dashboard/year3'
      default:
        return '/dashboard/year1'
    }
  }

  const handleProtectedClick = (href: string) => {
    setMobileMenuOpen(false)
    setAiToolsDropdownOpen(false)
    setStudyResourcesDropdownOpen(false)
    setAboutDropdownOpen(false)
    if (userEmail) {
      setTimeout(() => router.push(href), 100)
    } else {
      toast.error('Not a member yet? Please sign up to access this feature.')
      setTimeout(() => router.push('/signup'), 2000)
    }
  }

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false)
    setAiToolsDropdownOpen(false)
    setStudyResourcesDropdownOpen(false)
    setAboutDropdownOpen(false)
    router.push(href)
  }

  const toggleMobileSection = (section: string) => {
    setMobileSectionOpen(mobileSectionOpen === section ? null : section)
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

  // Navigation items
  const aiToolsItems = [
    { label: 'Ask Durmah', href: '/wellbeing', icon: MessageSquare },
    { label: 'Legal Summary Generator', href: '/assignments', icon: Scale },
    { label: 'Essay Review Tool', href: '/tools/memory-manager', icon: Settings },
    { label: 'Smart Legal Analysis', href: '/legal/tools/legal-news-feed', icon: Scale }
  ]

  const studyResourcesItems = [
    { label: '🎓 Onboarding Setup', href: '/onboarding/OnboardingPage', icon: Scale, needsBadge: true },
    { label: 'Past Exam Papers', href: '/study-materials', icon: Scale },
    { label: 'Assignment Templates', href: '/assignments', icon: Scale },
    { label: 'Assessment Criteria', href: '/study-schedule', icon: Scale },
    { label: 'Timetables & Deadlines', href: '/calendar', icon: Scale }
  ]

  const aboutItems = [
    { label: 'Mission', href: '/about', icon: Scale },
    { label: 'Ethics & Academic Integrity', href: '/ethics', icon: Scale },
    { label: 'Contact', href: '/about', icon: Scale }
  ]

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xl border-b border-purple-400/30' 
          : 'bg-gradient-to-r from-purple-600/95 to-indigo-600/95 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Logo variant={logoVariant} size="md" href="/" />
              
              {/* UK Time Display */}
              <div className="hidden md:block">
                <UKTimeDisplay 
                  className="text-white"
                  showLabel={false}
                  showIcon={true}
                  size="sm"
                  variant="inline"
                />
              </div>
              
              {/* Dynamic DisplayName */}
              {user && displayName && (
                <span className="text-teal-400 text-sm font-medium pl-2 border-l border-teal-400/50 hidden sm:inline-block">
                  {displayName}
                </span>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              
              {/* Home */}
              <button
                onClick={() => handleNavClick('/')}
                className={`flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px] ${
                  router.pathname === '/' ? 'text-purple-200 bg-white/10' : ''
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              {/* My Year at a Glance */}
              <button
                onClick={() => userEmail ? handleProtectedClick('/year-at-a-glance') : handleNavClick('/year-at-a-glance')}
                className={`flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px] ${
                  router.pathname.startsWith('/year-at-a-glance') ? 'text-purple-200 bg-white/10' : ''
                }`}
                title="Your complete academic year overview"
              >
                <Calendar className="w-4 h-4" />
                <span>My Year at a Glance</span>
              </button>

              {/* Legal News 🔥 - Featured */}
              <button
                onClick={() => handleNavClick('/legal/tools/legal-news-feed')}
                className={`relative flex items-center space-x-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 text-white hover:from-orange-500/30 hover:to-red-500/30 shadow-lg hover:shadow-orange-500/25 min-h-[44px] ${
                  router.pathname === '/legal/tools/legal-news-feed' ? 'from-orange-500/40 to-red-500/40' : ''
                }`}
              >
                <span>Legal News</span>
                <span className="text-orange-300">🔥</span>
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </div>
              </button>

              {/* AI Tools Dropdown */}
              <div className="relative" ref={aiToolsDropdownRef}>
                <button
                  onClick={() => setAiToolsDropdownOpen(!aiToolsDropdownOpen)}
                  className="flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px]"
                >
                  <span>AI Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${aiToolsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {aiToolsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {aiToolsItems.map(({ label, href, icon: Icon }) => (
                        <button
                          key={label}
                          onClick={() => userEmail ? handleProtectedClick(href) : handleNavClick(href)}
                          className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 min-h-[44px]"
                        >
                          <Icon className="w-4 h-4 text-purple-500" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Study Resources Dropdown */}
              <div className="relative" ref={studyResourcesDropdownRef}>
                <button
                  onClick={() => setStudyResourcesDropdownOpen(!studyResourcesDropdownOpen)}
                  className="flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px]"
                >
                  <span>Study Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${studyResourcesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {studyResourcesDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {studyResourcesItems.map(({ label, href, icon: Icon, needsBadge }) => (
                        <button
                          key={label}
                          onClick={() => userEmail ? handleProtectedClick(href) : handleNavClick(href)}
                          className="flex items-center justify-between w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 min-h-[44px]"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-blue-500" />
                            <span>{label}</span>
                          </div>
                          {needsBadge && shouldShowOnboardingBadge() && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOnboardingBadgeColor()}`}>
                              {getOnboardingBadgeText()}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Chat */}
              <button
                onClick={() => userEmail ? handleProtectedClick('/wellbeing') : handleNavClick('/wellbeing')}
                className={`flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px] ${
                  router.pathname === '/wellbeing' ? 'text-purple-200 bg-white/10' : ''
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Voice Chat</span>
              </button>

              {/* Premier Student Lounge - Premium Feature */}
              <button
                onClick={() => userEmail ? handleProtectedClick('/lounge') : handleNavClick('/lounge')}
                className={`group relative flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] ${
                  router.pathname.startsWith('/lounge') 
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-400/40 shadow-lg shadow-pink-500/25' 
                    : 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/30 hover:border-pink-400/50 shadow-lg hover:shadow-pink-500/25'
                }`}
                title="Your Premier Student Lounge — Connect. Share. Grow."
                aria-label="Go to Premier Student Lounge"
              >
                <Users className="w-4 h-4 group-hover:animate-pulse" />
                <span className="bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent font-semibold">
                  Student Lounge
                </span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Community Network */}
              <button
                onClick={() => handleNavClick('/community-network')}
                className={`flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px] ${
                  router.pathname === '/community-network' ? 'text-purple-200 bg-white/10' : ''
                }`}
                title="Meet students across year levels"
              >
                <User className="w-4 h-4" />
                <span>Community Network</span>
              </button>

              {/* About Dropdown */}
              <div className="relative" ref={aboutDropdownRef}>
                <button
                  onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                  className="flex items-center space-x-1 text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px]"
                >
                  <span>About</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {aboutDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {aboutItems.map(({ label, href, icon: Icon }) => (
                        <button
                          key={label}
                          onClick={() => handleNavClick(href)}
                          className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 min-h-[44px]"
                        >
                          <Icon className="w-4 h-4 text-green-500" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Menu & Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {/* Desktop Auth */}
              {userEmail ? (
                <div className="hidden lg:flex items-center space-x-3">
                  {/* Dashboard Button */}
                  <button
                    onClick={() => handleProtectedClick(getDashboardPath())}
                    className={`text-white hover:text-purple-200 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/10 min-h-[44px] ${
                      router.pathname.startsWith('/dashboard') ? 'text-purple-200 bg-white/10' : ''
                    }`}
                  >
                    My Dashboard
                  </button>

                  {/* Onboarding Badge near profile */}
                  {shouldShowOnboardingBadge() && (
                    <button
                      onClick={() => handleProtectedClick('/onboarding/OnboardingPage')}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 min-h-[44px] ${getOnboardingBadgeColor()}`}
                      title="Complete your onboarding to unlock all features"
                    >
                      {getOnboardingBadgeText()}
                    </button>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/10 transition-all duration-200 group min-w-[44px] min-h-[44px] justify-center"
                      title="Account menu"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 group-hover:border-white/60 transition-colors duration-200 shadow-lg">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="" className="w-full h-full object-cover" width={36} height={36} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                            {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{displayName || 'Student'}</p>
                          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setDropdownOpen(false)
                              handleProtectedClick('/settings')
                            }}
                            className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 min-h-[44px]"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={async () => {
                              setDropdownOpen(false)
                              const supabase = getSupabaseClient()
                              if (supabase) {
                                await supabase.auth.signOut()
                              }
                              router.push('/')
                            }}
                            className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 min-h-[44px]"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-white/90 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white hover:text-purple-200 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default GlobalHeader