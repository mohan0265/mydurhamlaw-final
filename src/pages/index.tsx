import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Brain, Heart } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 min-h-[160px] flex flex-col hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-blue-100 text-sm leading-relaxed flex-1 opacity-90">{description}</p>
  </div>
)

type PreviewCardProps = {
  title: string
  description: string
  imageSrc: string
}

const PreviewCard: React.FC<PreviewCardProps> = ({ title, description, imageSrc }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gray-100 flex flex-col h-full group">
    <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
        <span className="text-white text-sm font-bold px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 tracking-wide">
          View Feature
        </span>
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
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
        className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center pt-20 pb-20"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gray-900/70" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="animate-fadeIn w-full max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
              Welcome to{' '}
              <span className="text-pink-300">
                MyDurhamLaw
              </span>
            </h1>

            <div className="mb-12 sm:mb-16">
              <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-blue-50 leading-relaxed drop-shadow-lg max-w-3xl mx-auto">
                Your AI-powered Durham Law mentor — and an emotional lifeline for students far from home.
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto px-2">
              
              {/* Student Card */}
              <div className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/20 shadow-xl hover:shadow-purple-500/30 hover:-translate-y-2 hover:bg-white/15 transition-all duration-300 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="relative z-10 text-2xl sm:text-3xl font-bold text-white mb-4">I'm a Durham Law Student</h3>
                <p className="relative z-10 text-blue-100 text-lg mb-8 flex-1 leading-relaxed">
                  Get your Legal Eagle mentor, personalised study plans, and a calmer, more organised year at Durham Law.
                </p>
                
                <Link href="/login" className="relative z-10 w-full" aria-label="Student Login">
                  <button className="w-full bg-white text-purple-700 font-bold py-4 px-8 rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg group-hover:gap-4">
                    Student Login / Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>

              {/* Loved One Card */}
              <div className="group relative bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/20 shadow-xl hover:shadow-pink-500/30 hover:-translate-y-2 hover:bg-white/15 transition-all duration-300 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Heart className="w-12 h-12 text-white fill-white" />
                </div>
                
                <h3 className="relative z-10 text-2xl sm:text-3xl font-bold text-white mb-4">I'm a Loved One</h3>
                <p className="relative z-10 text-blue-100 text-lg mb-8 flex-1 leading-relaxed">
                  Stay close, see when they're available, and be just one click away with the "Always With You" widget.
                </p>
                
                <Link href="/loved-one-login" className="relative z-10 w-full" aria-label="Loved One Login">
                  <button className="w-full bg-white text-pink-600 font-bold py-4 px-8 rounded-xl hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg group-hover:gap-4">
                    Loved Ones Login
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/patterns/grid.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for Law Students
          </h2>
          <p className="text-blue-200 text-lg sm:text-xl mb-16 max-w-2xl mx-auto">
            Everything you need to succeed at Durham and beyond
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon="⚖️" title="Ask AI Legal Questions" description="Instant legal analysis with AI-powered context." />
            <FeatureCard icon="📅" title="Plan Deadlines" description="Schedule, track, and never miss an assignment." />
            <FeatureCard icon="📝" title="Summarise Lecture Notes" description="Turn walls of text into smart recall blocks." />
            <FeatureCard icon="🧘‍♂️" title="Personal Wellbeing Support" description="Focus, recharge and maintain balance during your studies with Durmah." />
          </div>
        </div>
      </section>

      {/* See Inside the App Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              See Inside the App
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A calm, structured hub for your Durham Law journey - with everything in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
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
              description="A simple view for loved ones to see availability and stay emotionally close." 
              imageSrc="/images/awy.png"
            />
          </div>
        </div>
      </section>

      {/* Member Quick Access Section (only when logged in) */}
      {user && (
        <section className="py-16 sm:py-24 bg-gradient-to-br from-green-50 to-blue-50 border-t border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                Welcome back, {displayName}!
              </h2>
              <p className="text-gray-600 text-lg">
                Quick access to your most used features
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-2">
              <Link href="/dashboard" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[180px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-md group-hover:rotate-6 transition-transform">
                    📊
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Dashboard</h3>
                  <p className="text-sm text-gray-500">Your study overview</p>
                </div>
              </Link>

              <Link href="/wellbeing" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[180px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-md group-hover:-rotate-6 transition-transform">
                    💬
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Durmah</h3>
                  <p className="text-sm text-gray-500">Wellbeing companion</p>
                </div>
              </Link>

              <Link href="/study-schedule" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[180px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-md group-hover:rotate-6 transition-transform">
                    📅
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Schedule</h3>
                  <p className="text-sm text-gray-500">Timetable & calendar</p>
                </div>
              </Link>

              <Link href="/assignments" className="group">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[180px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-md group-hover:-rotate-6 transition-transform">
                    📝
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Assignments</h3>
                  <p className="text-sm text-gray-500">Writing & Research</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            What Students & Parents Say
          </h2>
          <p className="text-gray-500 mb-16 text-xl">Real impact, real feedback</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-4">
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl text-purple-300 mb-6 font-serif leading-none">“</div>
              <p className="text-gray-700 text-lg mb-8 italic leading-relaxed">
                I looked through the App. I wish I had such an App to support me during my undergrad years.
              </p>
              <div className="pl-4 border-l-4 border-purple-200">
                <p className="font-bold text-gray-900 text-lg">SK Soon</p>
                <p className="text-purple-600 font-medium">2020 Batch Durham Law Graduate</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 text-left shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl text-pink-300 mb-6 font-serif leading-none">“</div>
              <p className="text-gray-700 text-lg mb-8 italic leading-relaxed">
                I saw the preview of the App and it looks impressive. I am waiting for it to launch officially soon. I think it will help my daughter who is going to start her Foundation Year at Durham.
              </p>
              <div className="pl-4 border-l-4 border-pink-200">
                <p className="font-bold text-gray-900 text-lg">Mark D.</p>
                <p className="text-pink-600 font-medium">Parent of a 2025 Foundation Student</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32 bg-gradient-to-r from-blue-600 to-purple-600 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/patterns/grid.svg')] opacity-10"></div>
        <div className="px-4 sm:px-6 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight">
            Where future Durham Legal Eagles<br/> begin their journey.
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto font-medium">
            If you want to study like a true Durham Legal Eagle, this is where you start.
          </p>
          <Link href="/signup">
            <button className="bg-white text-purple-600 font-bold py-5 px-12 rounded-full text-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-white/20">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>
    </>
  )
}
