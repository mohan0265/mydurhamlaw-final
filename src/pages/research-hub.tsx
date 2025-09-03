'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import AIResearchAssistant from '@/components/AIResearchAssistant'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { 
  ArrowLeft,
  ExternalLink, 
  Library, 
  FileText, 
  Scale,
  GraduationCap,
  Globe,
  Search,
  BookOpen,
  Bookmark
} from 'lucide-react'
import { useScrollToTop } from '@/hooks/useScrollToTop'

export default function ResearchHubPage() {
  useScrollToTop()
  
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [user, setUser] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/login');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading Research Hub...</p>
        </div>
      </div>
    )
  }

  const essentialResources = [
    {
      name: 'BAILII - Case Law Database',
      description: 'Free access to UK and Irish case law, legislation, and legal materials',
      url: 'https://www.bailii.org/',
      badge: 'Free',
      icon: Scale,
      color: 'text-blue-600'
    },
    {
      name: 'Westlaw UK',
      description: 'Comprehensive legal database with case law, legislation, and commentary',
      url: 'https://www.westlaw.co.uk/',
      badge: 'Durham Access',
      icon: Library,
      color: 'text-green-600'
    },
    {
      name: 'GOV.UK Legislation',
      description: 'Official source for UK primary and secondary legislation',
      url: 'https://www.legislation.gov.uk/',
      badge: 'Official',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      name: 'Durham Law Library',
      description: 'Direct access to legal databases and study materials',
      url: 'https://libguides.durham.ac.uk/law',
      badge: 'Durham',
      icon: GraduationCap,
      color: 'text-amber-600'
    }
  ]

  const quickSearches = [
    'Constitutional Law cases',
    'Contract Law principles',
    'Criminal Law statutes',
    'Tort Law precedents',
    'Human Rights Act',
    'European Union law'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Sidebar */}
      <ModernSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <BackToHomeButton />
        <main className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(getDashboardRoute())}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            
            <Card gradient className="flex-1">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                    🔍
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Legal Research Hub</h1>
                    <p className="text-gray-600">Trusted resources for UK law research and study</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Research Assistant */}
          <Card hover>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg">
                  🤖
                </div>
                <div>
                  <CardTitle>AI Research Assistant</CardTitle>
                  <p className="text-sm text-gray-600">
                    Get instant help with legal research, case summaries, and concept explanations
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AIResearchAssistant />
            </CardContent>
          </Card>

          {/* Essential Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {essentialResources.map((resource, index) => (
              <Card key={index} hover>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center`}>
                      <resource.icon className={`w-6 h-6 ${resource.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{resource.name}</h3>
                        <Badge variant={resource.badge === 'Free' ? 'success' : resource.badge === 'Official' ? 'info' : 'purple'}>
                          {resource.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                      <Link 
                        href={resource.url} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Access Resource
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Search Suggestions */}
          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Quick Search Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickSearches.map((search, index) => (
                  <button
                    key={index}
                    className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 group"
                    onClick={() => {
                      // This could trigger a search in the AI assistant
                      const searchInput = document.querySelector('textarea[placeholder*="legal query"]') as HTMLTextAreaElement
                      if (searchInput) {
                        searchInput.value = search
                        searchInput.focus()
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-200">
                        {search}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Law Trove - Oxford Textbooks', url: 'https://www.oxfordlawtrove.com/' },
                  { name: 'OSCOLA Referencing Guide', url: 'https://www.law.ox.ac.uk/research-subject-groups/publications/oscola' },
                  { name: 'Durham Course Materials', url: 'https://libguides.durham.ac.uk/law' }
                ].map((resource, index) => (
                  <Link
                    key={index}
                    href={resource.url}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  Professional Bodies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'The Law Society', url: 'https://www.lawsociety.org.uk/' },
                  { name: 'Bar Council', url: 'https://www.barcouncil.org.uk/' },
                  { name: 'UK Supreme Court', url: 'https://www.supremecourt.uk/' }
                ].map((resource, index) => (
                  <Link
                    key={index}
                    href={resource.url}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* More Resources Link */}
          <Card hover>
            <CardContent className="py-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Need More Resources?</h3>
                <p className="text-gray-600 mb-4">
                  Explore our comprehensive collection of legal databases, case law repositories, and study materials.
                </p>
                <Link
                  href="/references"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <Bookmark className="w-4 h-4" />
                  View All References
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>


        {/* Footer */}
        <footer className="mt-16 border-t border-white/20 backdrop-blur-sm bg-white/50 py-12 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">📘</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MyDurhamLaw</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              &copy; 2024 MyDurhamLaw AI Study Assistant. Built with ❤️ for legal excellence.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your intelligent companion for UK law mastery
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Support</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}