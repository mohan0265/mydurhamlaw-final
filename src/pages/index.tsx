import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowRight, Brain, Heart, Shield, Clock, Calendar, MessageCircle, BarChart } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { isRouteAbortError } from '@/lib/navigation/safeNavigate'
import { Card } from '@/components/ui/Card'

export default function DurhamLanding() {
  const router = useRouter()
  const { user } = useAuth()

  // Redirect logged-in users
  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard').catch((err) => {
        if (!isRouteAbortError(err)) console.error('Redirect error:', err);
      });
    }
  }, [user, router])

  return (
    <>
      <Head>
        <title>MyDurhamLaw – Your Always-On Study Partner</title>
        <meta name="description" content="Durham Law support that’s always with you. Built for the Durham syllabus to explain, plan, and guide—without shortcuts." />
        <meta property="og:title" content="MyDurhamLaw - Always-on Study Partner" />
        <meta property="og:image" content="/assets/images/hero-supreme-court-uk.webp" />
      </Head>

      {/* HERO SECTION */}
      <div 
        className="relative min-h-[90vh] flex items-center justify-center py-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            MyDurhamLaw
          </h1>
          <p className="text-xl md:text-2xl font-medium text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Durham Law support that’s always with you — day or night.
          </p>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
             Built for the Durham syllabus. Designed to keep students consistent, confident, and calm — without crossing academic integrity lines.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl">
                Start Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-2 border-white/30 font-bold py-4 px-8 rounded-full text-lg transition-all">
                See Pricing
              </button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
             Works best as a study partner: explain concepts, plan work, practise exams, and build skills.
          </p>
        </div>
      </div>

      {/* TRUST / WHY */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">The real challenge isn’t intelligence — it’s consistency.</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Durham Law moves fast. Students get hit with reading load, deadlines, and pressure all at once. 
            MyDurhamLaw turns the year into a clear plan, then supports the student every day.
          </p>
        </div>
      </section>

      {/* 3 CORE BENEFITS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Benefit 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">A year that finally feels manageable</h3>
              <p className="text-gray-600">
                YAAG shows the whole academic year at a glance — terms, deadlines, modules, workload. Click into month → week → day and stay on top of what matters.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">A tutor-like companion that doesn’t disappear</h3>
              <p className="text-gray-600">
                Durmah explains difficult concepts, drills understanding, helps structure arguments, and guides revision — even at 3am before an exam.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Peace of mind — without being invasive</h3>
              <p className="text-gray-600">
                Optional parent connection (opt-in) lets families stay emotionally present and supportive. Students stay in control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">What students use it for (every week)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
             {[
               "Turn lecture content into clear understanding (not confusion)",
               "Build strong essay plans and legal argument structure",
               "Practise problem questions + get marking guidance",
               "Create revision plans that actually stick",
               "Stay emotionally steady during high-pressure weeks"
             ].map((item, i) => (
               <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                 <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                   <div className="w-2 h-2 rounded-full bg-green-600" />
                 </div>
                 <span className="text-gray-700 font-medium">{item}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC INTEGRITY */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/patterns/grid.svg')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Shield className="w-8 h-8 text-indigo-300" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Designed to support learning — not shortcut it.</h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
            MyDurhamLaw is built around academic integrity. We help students understand, plan, and improve. 
            We do not encourage copying, contract cheating, or submitting AI-written work as their own.
          </p>
          <div className="inline-block px-6 py-3 bg-indigo-800/50 rounded-lg border border-indigo-700">
            <p className="text-lg font-medium text-indigo-200">
              Think of it as a coach: it trains the student — it doesn’t run the race.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Simple plans. Real value.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-sm text-gray-600">To explore YAAG and try Durmah</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-100 relative">
               <span className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">POPULAR</span>
              <h3 className="font-bold text-indigo-900 mb-2">Core</h3>
              <p className="text-sm text-indigo-700">For full year planning + workflows</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-sm text-gray-600">For voice support and intensive prep</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/signup">
               <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                  Start Free
               </button>
            </Link>
            <Link href="/pricing">
               <button className="text-indigo-600 font-bold py-3 px-8 hover:bg-indigo-50 rounded-lg transition-colors">
                  Compare Plans
               </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
           <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Freqently Asked Questions</h2>
           </div>
           
           <div className="space-y-8">
             {[
               {
                 q: "Is this a replacement for human tutors?",
                 a: "It replaces routine help (explaining, drilling, planning, practice). For truly complex or personal issues, human tutors still help — but you’ll need them less."
               },
               {
                 q: "Will this get me into academic trouble?",
                 a: "It’s designed for integrity. It supports learning and skill-building, not copying or submission."
               },
               {
                 q: "Do parents see everything?",
                 a: "No. Parent features are opt-in and student-controlled."
               }
             ].map((faq, i) => (
               <div key={i}>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                 <p className="text-gray-600 leading-relaxed">{faq.a}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Start free today.</h2>
          <p className="text-xl text-gray-300 mb-10">Make Durham Law feel structured, doable, and supported — every single week.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="bg-white text-gray-900 font-bold py-4 px-10 rounded-full text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Start Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="bg-transparent border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/10 transition-all">
                See Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
