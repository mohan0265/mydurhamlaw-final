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
                  <span className="text-sm font-medium text-gray-200">Accepting All Years (Foundation – Year 3)</span>
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
