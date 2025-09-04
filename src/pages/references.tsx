'use client'

import { useState, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import AIResearchAssistant from '@/components/AIResearchAssistant'
import { 
  ExternalLink, 
  Library, 
  FileText, 
  Scale,
  GraduationCap,
  Globe,
  ArrowLeft
} from 'lucide-react'

export default function ReferencesPage() {
  const router = useRouter()
  const { getDashboardRoute } = useContext(AuthContext)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const resourceCategories = [
    {
      title: 'Case Law & Judgments',
      icon: Scale,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      resources: [
        {
          name: 'BAILII - British and Irish Legal Information Institute',
          description: 'Free access to UK and Irish case law, legislation, and legal materials',
          url: 'https://www.bailii.org/',
          badge: 'Free'
        },
        {
          name: 'Westlaw UK',
          description: 'Comprehensive legal database with case law, legislation, and commentary',
          url: 'https://www.westlaw.co.uk/',
          badge: 'Durham Access'
        }
      ]
    },
    {
      title: 'Legal Databases',
      icon: Library,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      resources: [
        {
          name: 'Lexis+ UK',
          description: 'Extensive collection of case law, legislation, and legal analysis',
          url: 'https://www.lexisnexis.com/uk/legal/',
          badge: 'Durham Access'
        },
        {
          name: 'HeinOnline',
          description: 'Legal journals, historical documents, and government publications',
          url: 'https://heinonline.org/',
          badge: 'Academic'
        }
      ]
    },
    {
      title: 'Legislation',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      resources: [
        {
          name: 'GOV.UK Legislation',
          description: 'Official source for UK primary and secondary legislation',
          url: 'https://www.legislation.gov.uk/',
          badge: 'Official'
        },
        {
          name: 'Parliament UK',
          description: 'Bills, Hansard, and parliamentary publications',
          url: 'https://www.parliament.uk/',
          badge: 'Free'
        }
      ]
    }
  ]

  const academicResources = [
    {
      name: 'Durham University Library Law Resources',
      description: 'Direct access to legal databases and study materials',
      url: 'https://libguides.durham.ac.uk/law',
      badge: 'Durham'
    },
    {
      name: 'Law Trove - Oxford University Press',
      description: 'Access to hundreds of UK law textbooks',
      url: 'https://www.oxfordlawtrove.com/',
      badge: 'Academic'
    },
    {
      name: 'OSCOLA Referencing Guide',
      description: 'Official guide for legal citations in UK law schools',
      url: 'https://www.law.ox.ac.uk/research-subject-groups/publications/oscola',
      badge: 'Citation'
    }
  ]

  const professionalResources = [
    {
      name: 'The Law Society',
      description: 'Professional body for solicitors in England and Wales',
      url: 'https://www.lawsociety.org.uk/',
      badge: 'Professional'
    },
    {
      name: 'Bar Council',
      description: 'Professional body for barristers in England and Wales',
      url: 'https://www.barcouncil.org.uk/',
      badge: 'Professional'
    },
    {
      name: 'UK Supreme Court',
      description: 'Judgments and news from the UK highest court',
      url: 'https://www.supremecourt.uk/',
      badge: 'Official'
    }
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
        <main className="p-6 space-y-6 max-w-7xl mx-auto">
          <Button
            onClick={() => router.push(getDashboardRoute())}
            variant="ghost"
            className="mb-4 text-sm flex items-center gap-1 text-gray-700 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          {/* Header */}
          <Card gradient>
            <CardContent className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                    📚
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Legal Research Hub</h1>
                    <p className="text-gray-600">Trusted resources for UK law research and study</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-3xl">
                  Access curated legal databases, case law repositories, and research tools 
                  specifically chosen for Durham Law students and UK legal education.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Research Assistant */}
          <Card hover>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg">
                  🤖
                </div>
                <div>
                  <CardTitle>AI Legal Research Assistant</CardTitle>
                  <p className="text-sm text-gray-600">
                    Get instant help with legal concepts, case summaries, and research guidance
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AIResearchAssistant />
            </CardContent>
          </Card>

          {/* Resource Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {resourceCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} hover>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.resources.map((resource, resourceIndex) => (
                    <div key={resourceIndex} className="group border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
                          {resource.name}
                        </h4>
                        <Badge variant={resource.badge === 'Free' ? 'success' : resource.badge === 'Official' ? 'info' : 'purple'}>
                          {resource.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      <Link 
                        href={resource.url} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Resource
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  Academic Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {academicResources.map((resource, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{resource.name}</h4>
                      <Badge variant={resource.badge === 'Durham' ? 'info' : 'default'}>
                        {resource.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    <Link 
                      href={resource.url} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Access Resource
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Professional Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professionalResources.map((resource, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{resource.name}</h4>
                      <Badge variant={resource.badge === 'Official' ? 'info' : 'purple'}>
                        {resource.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    <Link 
                      href={resource.url} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Site
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/20 backdrop-blur-sm bg-white/50 py-8 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-sm text-gray-500">
              &copy; 2024 MyDurhamLaw AI Study Assistant. Built with ❤️ for legal excellence.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Your intelligent companion for UK law mastery
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} };
}