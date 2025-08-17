'use client'

import React from 'react'
import Link from 'next/link'
import { 
  MessageCircle, 
  Heart, 
  Calendar, 
  Newspaper, 
  Search, 
  Shield, 
  BookOpen, 
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react'

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
  benefits: string[]
  ctaText: string
  ctaLink: string
  gradient: string
  iconBg: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  benefits, 
  ctaText, 
  ctaLink, 
  gradient,
  iconBg 
}) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 text-white hover:transform hover:scale-105 transition-all duration-300 shadow-2xl`}>
    <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-6`}>
      {icon}
    </div>
    
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-lg mb-6 opacity-90">{description}</p>
    
    <ul className="space-y-2 mb-8">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-start space-x-2">
          <Sparkles className="w-4 h-4 mt-1 text-yellow-300 flex-shrink-0" />
          <span className="text-sm opacity-90">{benefit}</span>
        </li>
      ))}
    </ul>
    
    <Link href={ctaLink}>
      <button className="group w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
        <span>{ctaText}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
      </button>
    </Link>
  </div>
)

export const FeatureShowcase: React.FC = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8 text-white" />,
      title: "Durmah Wellbeing Coach",
      description: "Your 24/7 mental health companion that understands law student stress",
      benefits: [
        "Personalized stress management techniques",
        "Anonymous mental health check-ins", 
        "Study-life balance coaching",
        "Crisis support and resource connections"
      ],
      ctaText: "Try Durmah",
      ctaLink: "/wellbeing",
      gradient: "from-pink-500 to-rose-600",
      iconBg: "bg-white/20"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-white" />,
      title: "Human Mode Drafting™",
      description: "Ethical assignment assistance with built-in integrity guardrails",
      benefits: [
        "Three assistance levels (Hints, Outlines, Examples)",
        "Mandatory integrity pledge before access",
        "Transparent AI disclosure tracking",
        "OSCOLA citation assistance"
      ],
      ctaText: "Start Writing",
      ctaLink: "/assignments",
      gradient: "from-blue-600 to-indigo-700",
      iconBg: "bg-white/20"
    },
    {
      icon: <Calendar className="w-8 h-8 text-white" />,
      title: "Smart Timetable & Calendar",
      description: "Durham-specific academic calendar with intelligent deadline tracking",
      benefits: [
        "Sync with Durham academic calendar",
        "Assignment deadline predictions",
        "Study schedule optimization",
        "Exam period preparation alerts"
      ],
      ctaText: "Organize Studies",
      ctaLink: "/study-schedule",
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-white/20"
    },
    {
      icon: <Newspaper className="w-8 h-8 text-white" />,
      title: "Legal News Feed",
      description: "Curated UK legal news with AI analysis and voice narration",
      benefits: [
        "Real-time UK legal developments",
        "Durham University law faculty news",
        "AI-generated case summaries",
        "Voice narration for busy students"
      ],
      ctaText: "Read Latest",
      ctaLink: "/legal/tools/legal-news-feed",
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-white/20"
    },
    {
      icon: <Search className="w-8 h-8 text-white" />,
      title: "AI Legal Research",
      description: "Intelligent case law research with context-aware suggestions",
      benefits: [
        "Smart case law database search",
        "Precedent analysis and connections",
        "Research methodology guidance",
        "Citation formatting automation"
      ],
      ctaText: "Start Research",
      ctaLink: "/legal/research",
      gradient: "from-orange-500 to-red-600",
      iconBg: "bg-white/20"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Ethical AI Guardrails",
      description: "Transparent AI use with built-in academic integrity protection",
      benefits: [
        "Plagiarism prevention technology",
        "Usage audit trail for transparency",
        "Academic honesty coaching",
        "Pre-submission integrity checks"
      ],
      ctaText: "Learn Ethics",
      ctaLink: "/legal/ethics",
      gradient: "from-teal-500 to-cyan-600",
      iconBg: "bg-white/20"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Excel at Durham Law
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Six powerful tools designed specifically for Durham University Law students, 
            with ethical AI at the core and your success as the goal.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Link href="/signup">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl">
              Access All Features Free for 30 Days
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeatureShowcase