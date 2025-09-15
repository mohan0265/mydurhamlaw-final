// src/pages/index.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Play, Heart, Brain, Shield, BookOpen, Clock } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 min-h-[140px] flex flex-col">
    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{icon}</div>
    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-blue-100 text-sm leading-relaxed flex-1">{description}</p>
  </div>
)

type PreviewCardProps = {
  title: string
  description: string
}

const PreviewCard: React.FC<PreviewCardProps> = ({ title, description }) => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
    <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-32 sm:h-48 flex items-center justify-center">
      <div className="text-white text-4xl sm:text-6xl">📱</div>
    </div>
    <div className="p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
)

type TestimonialCardProps = {
  quote: string
  author: string
  role: string
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, role }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-white/10">
    <div className="text-4xl sm:text-6xl text-blue-300 mb-3 sm:mb-4">&ldquo;</div>
    <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 italic leading-relaxed">{quote}</p>
    <div>
      <p className="text-white font-semibold text-sm sm:text-base">{author}</p>
      <p className="text-blue-200 text-xs sm:text-sm">{role}</p>
    </div>
  </div>
)

export default function DurhamLanding() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect logged-in users straight to their dashboard.
  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  // Safely extract displayName to ensure it's always a string
  const displayName = React.useMemo(() => {
    if (!user) return 'there';

    const emailName = user.email?.split('@')[0]?.replace(/[0-9]/g, '');
    const fullName = user.user_metadata?.full_name;

    if (typeof emailName === 'string' && emailName.trim()) {
      return emailName;
    }
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName;
    }
    return 'there';
  }, [user]);

  return (
    <>
      <Head>
        <title>MyDurhamLaw - Study Companion</title>
        <meta
          name="description"
          content="AI for law students: memory, planning, case law, wellbeing"
        />
      </Head>

      {/* Hero Section */}
      <div
        className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12">
          <div className="animate-fadeIn">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                MyDurhamLaw
              </span>
            </h1>

            <div className="mb-4 sm:mb-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <p className="text-lg sm:text-2xl lg:text-3xl font-medium text-pink-200 leading-relaxed">
                <Heart className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-pink-400 mr-2 mb-1" />
                Built with heart, exclusively for Durham University Law Foundation and Undergraduate
                Students.
              </p>
            </div>

            <div className="mb-6 sm:mb-8 animate-slideUp" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-200 leading-relaxed">
                Your 24/7 AI Study Partner, Voice Buddy & Legal Mentor at Durham
              </h2>
            </div>

            {/* Key benefits */}
            <div className="mb-8 sm:mb-10 animate-slideUp" style={{ animationDelay: '0.6s' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        AI-Powered Academic Support
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Tailored to your year with intelligent study guidance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        Voice Mode with Memory
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Like a human study companion who remembers you
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        Legal Assignment Drafting
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Guidance with built-in ethics guardrails
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        Mental Wellness Support
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Journaling and reflection assistant
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        Case Law References
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Comprehensive legal research in one place
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 min-h-[80px] flex items-center">
                  <div className="flex items-start gap-3 w-full">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mt-1 shrink-0" />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                        Timetables & Deadlines
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        All your academic schedule in one place
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 animate-slideUp"
              style={{ animationDelay: '0.8s' }}
            >
              <Link href="/signup">
                <button className="group bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-2 min-h-[48px] w-full sm:w-auto justify-center max-w-xs">
                  <span>Start Exploring Now</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </Link>

              <Link href="/tour">
                <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold py-3 px-6 rounded-full text-base sm:text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2 min-h-[48px] w-full sm:w-auto justify-center max-w-xs">
                  <Play className="w-4 h-4" />
                  <span>See How It Works</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
            Built for Law Students
          </h2>
          <p className="text-blue-200 text-base sm:text-lg mb-8 sm:mb-12">
            Everything you need to succeed at Durham and beyond
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <FeatureCard icon="⚖️" title="Ask AI Legal Questions" description="Instant legal analysis with AI-powered context." />
            <FeatureCard icon="📅" title="Plan Deadlines" description="Schedule, track, and never miss an assignment." />
            <FeatureCard icon="📝" title="Summarise Lecture Notes" description="Turn walls of text into smart recall blocks." />
            <FeatureCard icon="🧘♂️" title="Personal Wellbeing Support" description="Focus, recharge and maintain balance during your studies with Durmah." />
          </div>
        </div>
      </section>

      {/* Member Quick Access Section (only when logged in) */}
      {user && (
        <section className="py-12 sm:py-20 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
                Welcome back, {displayName}!
              </h2>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Quick access to your most used features
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
              <Link href="/dashboard" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[120px] sm:min-h-[140px]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-2 sm:mb-4 mx-auto">
                    📊
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center">
                    Dashboard
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Your study overview and progress
                  </p>
                </div>
              </Link>

              <Link href="/wellbeing" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border border-pink-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[120px] sm:min-h-[140px]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-2 sm:mb-4 mx-auto">
                    💬
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center">
                    Durmah
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Your personal wellbeing companion
                  </p>
                </div>
              </Link>

              <Link href="/study-schedule" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[120px] sm:min-h-[140px]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-2 sm:mb-4 mx-auto">
                    📅
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center">
                    Study Schedule
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Timetable and calendar management
                  </p>
                </div>
              </Link>

              <Link href="/assignments" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[120px] sm:min-h-[140px]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-2 sm:mb-4 mx-auto">
                    📝
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 text-center">
                    Assignments
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">
                    Writing and Research Buddy
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* App Preview */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Explore the App</h2>
          <p className="text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
            See how AI elevates your study game
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <PreviewCard title="Chat With AI" description="Ask complex legal queries 24/7" />
            <PreviewCard title="Smart Calendar" description="Visualise deadlines with reminders" />
            <PreviewCard title="Memory Manager" description="Retain what matters most" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
            What Students & Parents Say
          </h2>
          <p className="text-blue-200 mb-8 sm:mb-12 text-sm sm:text-base">Real impact, real feedback</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <TestimonialCard
              quote="I looked through the App. I wish I had such an App to support me during my undergrad years."
              author="SK Soon"
              role="2020 Batch Durham Law Graduate"
            />
            <TestimonialCard
              quote="I saw the preview of the App and it looks impressive. I am waiting for it to launch officially soon. I think it will help my daughter who is going to start her Foundation Year at Durham."
              author="Mark D."
              role="Parent of a 2025 Foundation Student"
            />
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-center">
        <div className="px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
            A Personalised Study Experience
          </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8">
            Join thousands of Durham law students already using MyDurhamLaw
          </p>
          <Link href="/signup">
            <button className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>
    </>
  )
}
