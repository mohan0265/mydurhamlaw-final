import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Brain, Heart, Calendar, Shield, CheckCircle, Target } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { isRouteAbortError } from '@/lib/navigation/safeNavigate'

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
        <title>MyDurhamLaw – Durham Law Support, 24/7</title>
        <meta name="description" content="Stay on top of modules, deadlines, and exams with a study partner built for Durham." />
        <meta property="og:title" content="MyDurhamLaw - Durham Law support, 24/7" />
        <meta property="og:image" content="/assets/images/hero-supreme-court-uk.webp" />
      </Head>

      {/* HERO SECTION (Option A - Clean + Premium) */}
      <div 
        className="relative min-h-[85vh] flex items-center justify-center py-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            Durham Law support, <span className="text-purple-300">24/7.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-blue-50 mb-8 max-w-2xl mx-auto leading-relaxed">
            Turn lectures into clarity. Turn deadlines into plans.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-10">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-200">Integrity-first. Learning support, not shortcutting.</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl">
                Start Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="w-full sm:w-auto bg-transparent hover:bg-white/10 border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg transition-all">
                See Pricing
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* INTEGRITY MICRO-PANEL */}
      <section className="py-6 bg-indigo-50 border-b border-indigo-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
           <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-700" />
              <span className="font-bold text-gray-900">Built for academic integrity</span>
           </div>
           <span className="hidden md:block text-gray-300">|</span>
           <p className="text-gray-600 text-sm md:text-base">
              We help you understand and plan — we don’t generate work to submit as your own.
           </p>
        </div>
      </section>

      {/* 3 MOBILE BENEFIT BULLETS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bullet 1 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">YAAG: Year → Month → Week → Day</h3>
              <p className="text-gray-600 text-sm">
                Turning the entire Durham syllabus into a navigable, manageable plan.
              </p>
            </div>

            {/* Bullet 2 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Help when you’re stuck (even late night)</h3>
              <p className="text-gray-600 text-sm">
                Durmah explains concepts and drills understanding instantly, 24/7.
              </p>
            </div>

            {/* Bullet 3 */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 text-pink-600">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Optional parent support (opt-in)</h3>
              <p className="text-gray-600 text-sm">
                Let loved ones stay firmly in your corner without being invasive.
              </p>
            </div>

            {/* Bullet 4 - NEW */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lecturer Emphasis Signals</h3>
              <p className="text-gray-600 text-sm">
                Spot the concepts your lecturer stressed most — with transcript evidence.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* FEATURE: LECTURER EMPHASIS */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
           <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                 <div className="inline-flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-4">
                    New Feature
                 </div>
                 <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    Learn what your lecturer <span className="text-purple-600">is really stressing</span>
                 </h2>
                 <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    MyDurhamLaw highlights lecturer emphasis from your uploaded lecture transcript — the concepts they repeat, the distinctions they stress, and the common mistakes they warn about — so you revise smarter and with more confidence.
                 </p>
                 
                 <div className="space-y-4 mb-8">
                    {[
                       "Spots “high-yield” concepts your lecturer repeatedly emphasizes",
                       "Flags common pitfalls students typically miss",
                       "Turns emphasis into practice prompts and revision checklists",
                       "Helps you stay aligned with what’s being taught — week by week"
                    ].map((item, i) => (
                       <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">{item}</span>
                       </div>
                    ))}
                 </div>

                 <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <Shield className="w-5 h-5 text-gray-400 shrink-0" />
                    <span><strong>Built for academic integrity:</strong> We highlight emphasis in the lecture to guide revision. We don’t generate work to submit as your own.</span>
                 </div>
              </div>
              
              <div className="flex-1 flex justify-center w-full">
                 <div className="relative w-full max-w-sm aspect-square bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 flex flex-col justify-center items-center shadow-inner border border-gray-100">
                    {/* Mock Card */}
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-5 w-full transform rotate-3 transition-transform hover:rotate-0 duration-500">
                       <div className="flex justify-between items-center mb-3">
                          <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-xs font-bold uppercase">Signal Strength 5/5</span>
                       </div>
                       <div className="font-bold text-gray-900 text-lg mb-1">Donoghue v Stevenson</div>
                       <p className="text-sm text-gray-500 italic mb-4 border-l-2 border-purple-200 pl-3">
                         &quot;I've stressed this three times now: the neighbour principle is the foundation...&quot;
                       </p>
                       <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="text-xs font-bold text-green-800 uppercase mb-1">Master This:</div>
                          <div className="text-xs text-gray-700">Define the 'Neighbour Principle' and its 2 limitations.</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* WHAT IT DOES (Keep this, valuable for context) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">What you can do every week</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[
               "Turn lecture content into clear understanding",
               "Build strong essay plans and argument structure",
               "Practise problem questions + get marking guidance",
               "Create revision plans that actually stick",
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                 <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                 <span className="text-gray-700 font-medium text-sm">{item}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* MOBILE CTA FOOTER */}
      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to feel on top of Durham Law?</h2>
          <p className="text-xl text-gray-400 mb-10">Start free in minutes.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="w-full sm:w-auto bg-white text-gray-900 font-bold py-4 px-10 rounded-full text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Start Free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-white/10 transition-all">
                See Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
