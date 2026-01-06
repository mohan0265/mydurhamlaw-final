import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Brain, Heart } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { isRouteAbortError } from '@/lib/navigation/safeNavigate'

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 min-h-[140px] flex flex-col hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 text-left">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-blue-100 text-sm leading-relaxed flex-1 opacity-90">{description}</p>
  </div>
)

type PreviewCardProps = {
  title: string
  description: string
  imageSrc: string
}

const PreviewCard: React.FC<PreviewCardProps> = ({ title, description, imageSrc }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-100 flex flex-col h-full group">
    <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-100">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
        <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 tracking-wide">
          View Feature
        </span>
      </div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{title}</h3>
      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

export default function DurhamLanding() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect logged-in users straight to their dashboard.
  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard').catch((err) => {
        // Swallow route cancellation errors that happen if user navigates during redirect
        if (isRouteAbortError(err)) {
          return;
        }
        console.error('Unexpected navigation error:', err);
      });
    }
  }, [user, router])

  // Safely extract displayName
  const displayName = React.useMemo(() => {
    if (!user) return 'there';
    const emailName = user.email?.split('@')[0]?.replace(/[0-9]/g, '');
    const fullName = user.user_metadata?.full_name;
    if (typeof emailName === 'string' && emailName.trim()) return emailName;
    if (typeof fullName === 'string' && fullName.trim()) return fullName;
    return 'there';
  }, [user]);

  return (
    <>
      <Head>
        <title>MyDurhamLaw – AI Study Mentor & Emotional Support</title>
        <meta
          name="description"
          content="MyDurhamLaw is an AI-powered study companion and emotional lifeline for Durham University Law students and their loved ones."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mydurhamlaw.com/" />
        <meta property="og:title" content="MyDurhamLaw - AI Study Mentor & Emotional Support" />
        <meta property="og:description" content="Your AI-powered Durham Law mentor - and an emotional lifeline for students far from home." />
        <meta property="og:image" content="/assets/images/hero-supreme-court-uk.webp" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="MyDurhamLaw - AI Study Mentor & Emotional Support" />
        <meta property="twitter:description" content="Your AI-powered Durham Law mentor - and an emotional lifeline for students far from home." />
        <meta property="twitter:image" content="/assets/images/hero-supreme-court-uk.webp" />
      </Head>

      {/* Hero Section */}
      <div
        className="relative min-h-[90vh] sm:min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center py-12 sm:py-16"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gray-900/70" />

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="animate-fadeIn w-full max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-2xl">
              Welcome to{' '}
              <span className="text-pink-300">
                MyDurhamLaw
              </span>
            </h1>

            <div className="mb-8 sm:mb-12">
              <p className="text-lg sm:text-xl lg:text-2xl font-medium text-blue-50 leading-relaxed drop-shadow-lg max-w-2xl mx-auto">
                Your AI-powered Durham Law mentor — and an emotional lifeline for students far from home.
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto px-2">
              
              {/* Student Card */}
              <div className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 flex flex-col items-center text-center overflow-hidden min-h-[260px]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-white mb-2">I'm a Durham Law Student</h3>
                <p className="relative z-10 text-blue-100 text-sm sm:text-base mb-6 flex-1 leading-relaxed">
                  Get your Legal Eagle mentor, personalised study plans, and a calmer, more organised year.
                </p>
                
                <Link href="/login" className="relative z-10 w-full" aria-label="Student Login">
                  <button className="w-full bg-white text-purple-700 font-bold py-3 px-6 rounded-lg hover:bg-purple-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base group-hover:gap-3">
                    Student Login
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Loved One Card */}
              <div className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 shadow-xl hover:shadow-pink-500/30 hover:-translate-y-1 hover:bg-white/15 transition-all duration-300 flex flex-col items-center text-center overflow-hidden min-h-[260px]">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Heart className="w-8 h-8 text-white fill-white" />
                </div>
                
                <h3 className="relative z-10 text-xl sm:text-2xl font-bold text-white mb-2">I'm a Loved One</h3>
                <p className="relative z-10 text-blue-100 text-sm sm:text-base mb-6 flex-1 leading-relaxed">
                  Stay close, see their availability, and be just one click away with the "Always With You" widget.
                </p>
                
                <Link href="/loved-one-login" className="relative z-10 w-full" aria-label="Loved One Login">
                  <button className="w-full bg-white text-pink-600 font-bold py-3 px-6 rounded-lg hover:bg-pink-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base group-hover:gap-3">
                    Loved Ones Login
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-2 bg-white/80 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/patterns/grid.svg')] opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Built for Law Students
          </h2>
          <p className="text-blue-200 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
            Everything you need to succeed at Durham and beyond
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <FeatureCard icon="⚖️" title="Ask AI Legal Questions" description="Instant legal analysis with AI-powered context." />
            <FeatureCard icon="📅" title="Plan Deadlines" description="Schedule, track, and never miss an assignment." />
            <FeatureCard icon="📝" title="Summarise Lecture Notes" description="Turn walls of text into smart recall blocks." />
            <FeatureCard icon="🧘‍♂️" title="Personal Wellbeing Support" description="Focus, recharge and maintain balance." />
          </div>
        </div>
      </section>

      {/* See Inside the App Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              See Inside the App
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A calm, structured hub for your Durham Law journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-2">
            <PreviewCard 
              title="Personalised Dashboard" 
              description="See your tasks, deadlines and progress at a glance each day." 
              imageSrc="/images/dashboard.png"
            />
            <PreviewCard 
              title="Year-at-a-Glance Planner" 
              description="Visualise your Michaelmas, Epiphany and Easter terms with clarity." 
              imageSrc="/images/yaag.png"
            />
            <PreviewCard 
              title="Durmah Voice Mentor" 
              description="Ask questions, plan your week, and get explanations in natural language." 
              imageSrc="/images/durmah.png"
            />
            <PreviewCard 
              title="Always With You (AWY)" 
              description="A simple view for loved ones to see availability and stay close." 
              imageSrc="/images/awy.png"
            />
          </div>
        </div>
      </section>

      {/* Member Quick Access Section (only when logged in) */}
      {user && (
        <section className="py-12 bg-gradient-to-br from-green-50 to-blue-50 border-t border-blue-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Welcome back, {displayName}!
              </h2>
              <p className="text-gray-600 text-base">
                Quick access to your most used features
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-2">
              <Link href="/dashboard" className="group">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl mb-3 shadow-md group-hover:rotate-6 transition-transform">
                    📊
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Dashboard</h3>
                  <p className="text-xs text-gray-500">Your study overview</p>
                </div>
              </Link>

              <Link href="/wellbeing" className="group">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-pink-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-2xl mb-3 shadow-md group-hover:-rotate-6 transition-transform">
                    💬
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Durmah</h3>
                  <p className="text-xs text-gray-500">Wellbeing companion</p>
                </div>
              </Link>

              <Link href="/study-schedule" className="group">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl mb-3 shadow-md group-hover:rotate-6 transition-transform">
                    📅
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Schedule</h3>
                  <p className="text-xs text-gray-500">Timetable & calendar</p>
                </div>
              </Link>

              <Link href="/assignments" className="group">
                <div className="bg-white rounded-xl shadow-lg p-5 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl mb-3 shadow-md group-hover:-rotate-6 transition-transform">
                    📝
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">Assignments</h3>
                  <p className="text-xs text-gray-500">Writing & Research</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            What Students & Parents Say
          </h2>
          <p className="text-gray-500 mb-10 text-lg">Real impact, real feedback</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl text-purple-300 mb-4 font-serif leading-none">“</div>
              <p className="text-gray-700 text-base mb-6 italic leading-relaxed">
                I looked through the App. I wish I had such an App to support me during my undergrad years.
              </p>
              <div className="pl-4 border-l-4 border-purple-200">
                <p className="font-bold text-gray-900 text-sm">SK Soon</p>
                <p className="text-purple-600 text-xs font-medium">2020 Batch Durham Law Graduate</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl text-pink-300 mb-4 font-serif leading-none">“</div>
              <p className="text-gray-700 text-base mb-6 italic leading-relaxed">
                I saw the preview of the App and it looks impressive. I am waiting for it to launch officially soon. I think it will help my daughter who is going to start her Foundation Year at Durham.
              </p>
              <div className="pl-4 border-l-4 border-pink-200">
                <p className="font-bold text-gray-900 text-sm">Mark D.</p>
                <p className="text-pink-600 text-xs font-medium">Parent of a 2025 Foundation Student</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/patterns/grid.svg')] opacity-10"></div>
        <div className="px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
            Where future Durham Legal Eagles<br/> begin their journey.
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
            If you want to study like a true Durham Legal Eagle, this is where you start.
          </p>
          <Link href="/signup">
            <button className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-white/20">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>
    </>
  )
}
