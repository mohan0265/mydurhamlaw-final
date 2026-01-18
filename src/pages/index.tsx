import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Brain, Heart, Calendar, Shield, CheckCircle, Target, ArrowRight } from 'lucide-react'
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

      {/* 1) HERO SECTION */}
      <div 
        className="relative min-h-[90vh] flex items-center py-20 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        <div className="absolute inset-0 bg-gray-900/85 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-gray-200">Accepting Foundation & Year 1 Students</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1] text-white">
                  Durham Law support, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">24/7.</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed opacity-90">
                  Turn transcripts into clarity. Capture lecturer emphasis. Plan your entire Durham year in one view.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/signup">
                    <button className="w-full sm:w-auto bg-white text-purple-900 font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                      Start Free Trial
                    </button>
                  </Link>
                  <Link href="/pricing">
                    <button className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold py-4 px-8 rounded-full text-lg transition-all backdrop-blur-sm">
                      See Pricing
                    </button>
                  </Link>
                </div>
                
                <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-400">
                   <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-300" /> Integrity First
                   </div>
                   <div className="flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-gray-300" /> Durham Specific
                   </div>
                </div>
              </div>

              {/* Right: Screenshot (Desktop only mostly) */}
              <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                 <div className="relative rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-gray-900">
                       <Image 
                          src="/images/dashboard.png" 
                          alt="MyDurhamLaw Dashboard" 
                          width={800} 
                          height={600} 
                          className="w-full h-auto object-cover opacity-95 hover:opacity-100 transition-opacity"
                          priority
                       />
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                           <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 font-semibold uppercase">Status</div>
                           <div className="text-sm font-bold text-gray-900">All Systems Operational</div>
                        </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* 2) WIDGET GALLERY (Product Proof) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything needed to survive (and thrive)</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Not just generic tools. A suite built specifically for the Durham Law syllabus.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                 { 
                    title: "Smart Dashboard", 
                    desc: "Your daily focus, prioritized by deadlines.",
                    img: "/images/dashboard.png",
                    link: "#"
                 },
                 { 
                    title: "Year At A Glance", 
                    desc: "The entire 3-term structure in one view.",
                    img: "/images/yaag.png",
                    link: "#"
                 },
                 { 
                    title: "Durmah AI", 
                    desc: "24/7 clarifications without judgement.",
                    img: "/images/durmah.png",
                    link: "#"
                 },
                 { 
                    title: "Always With You", 
                    desc: "Stay connected to home, stress-free.",
                    img: "/images/awy.png",
                    link: "#"
                 }
              ].map((item, i) => (
                 <div key={i} className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col">
                    <div className="rounded-xl overflow-hidden border border-gray-100 mb-4 bg-gray-100 aspect-[4/3] relative">
                       <Image 
                          src={item.img} 
                          alt={item.title} 
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                       />
                    </div>
                    <div className="mt-auto">
                       <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                       <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                       <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                          See feature <ArrowRight className="w-3 h-3" />
                       </span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* 3) LECTURER EMPHASIS & INTEGRITY */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
           <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                 <div className="inline-flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider">
                    New Feature
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    Capture what your lecturer <span className="text-purple-600">actually emphasized</span>
                 </h2>
                 <p className="text-lg text-gray-600 leading-relaxed">
                    We parse your uploaded lecture transcripts to find the concepts they repeated, the pitfalls they warned about, and the distinctions they stressed.
                 </p>
                 
                 <div className="space-y-4 pt-4">
                    {[
                       "Identify high-yield exam topics",
                       "Spot common mistakes before you make them",
                       "Turn emphasis into integrity-safe practice prompts"
                    ].map((feat, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                             <CheckCircle className="w-4 h-4" />
                          </div>
                          <span className="text-gray-800 font-medium">{feat}</span>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="flex-1 w-full relative">
                 {/* Visual Stack */}
                 <div className="relative z-10 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform hover:rotate-1 transition-transform duration-500">
                    <Image 
                       src="/images/durmah.png" 
                       alt="Durmah Chat Interface" 
                       width={600} 
                       height={400} 
                       className="w-full h-auto bg-white"
                    />
                    {/* Overlay showing 'Signal' */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] bg-white/95 backdrop-blur shadow-xl rounded-xl p-4 border border-purple-100 animate-in fade-in zoom-in duration-700 delay-300">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded uppercase">High Emphasis Signal</span>
                           <span className="text-xs text-gray-400">04:12</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">"The Neighbour Principle"</p>
                        <p className="text-xs text-gray-500 italic">"I cannot stress this enough: do not confuse the duty of care with the standard of care..."</p>
                    </div>
                 </div>
                 {/* Decorative blob */}
                 <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 z-0"></div>
              </div>
           </div>
        </div>
      </section>

      {/* 4) DURHAM PROOF STRIP */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
         <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">Designed around real Durham workflows</p>
            <div className="relative max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 group">
               <Image 
                  src="/assets/onboarding/blackboard-due-dates.png" 
                  alt="Blackboard Integration Proof" 
                  width={1000} 
                  height={400}
                  className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700"
               />
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-6 pt-12 flex justify-center">
                  <span className="text-white text-sm font-medium bg-black/50 backdrop-blur px-3 py-1 rounded-full">Synced with your module timeline</span>
               </div>
            </div>
         </div>
      </section>

      {/* 5) CTA Footer */}
      <section className="py-24 bg-gray-900 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/assets/images/hero-supreme-court-uk.webp')] opacity-10 bg-cover bg-center"></div>
         <div className="relative z-10 max-w-3xl mx-auto px-6">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">Ready to feel confident?</h2>
            <p className="text-xl text-gray-400 mb-10">Join students from every Durham college.</p>
            <Link href="/signup">
               <button className="bg-white text-purple-950 font-bold py-4 px-12 rounded-full text-lg shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all transform">
                  Start Your 14-Day Trial
               </button>
            </Link>
            <p className="mt-6 text-sm text-gray-500">No credit card required • Cancel anytime</p>
         </div>
      </section>
    </>
  )
}

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
