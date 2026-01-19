import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Brain, Heart, Calendar, Shield, CheckCircle, Target, ArrowRight, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { isRouteAbortError } from '@/lib/navigation/safeNavigate'

export default function DurhamLanding() {
  const router = useRouter()
  const { user } = useAuth()
  const [activePanel, setActivePanel] = React.useState<string | null>('dashboard')

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
                
                <div className="mt-4 text-lg text-white/80 max-w-xl leading-relaxed">
                  Turn lectures into clarity. Turn deadlines into a plan.
                </div>
                <div className="mt-2 text-sm text-white/70">
                  Durham-specific. Integrity-first. Built for Michaelmas → Epiphany → Easter.
                </div>
                
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
                
                <div className="mt-4 text-xs text-white/75 flex items-center justify-center lg:justify-start gap-2">
                   <Shield className="w-3 h-3" /> Integrity-first learning support — we help you understand and practise, not shortcut.
                </div>
              </div>

               <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                  <div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                     <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-gray-900 w-full h-auto relative">
                        <Image 
                           src="/images/dashboard.png" 
                           alt="MyDurhamLaw Dashboard" 
                           width={800} 
                           height={600} 
                           className="w-full h-auto object-cover opacity-95 hover:opacity-100 transition-opacity"
                           priority
                        />
                         {/* Name Overlay (Privacy) */}
                         <div className="absolute top-[8%] left-[28%] bg-gray-100 rounded-md px-3 py-1 flex items-center justify-center shadow-sm z-10 w-[180px] h-[30px]">
                            <span className="text-gray-800 font-bold text-lg">Student</span>
                         </div>
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
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything needed to survive (and thrive)</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Not just generic tools. A suite built specifically for the Durham Law syllabus.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                 { 
                    id: 'dashboard',
                    title: "Smart Dashboard", 
                    desc: "Your next best action, based on deadlines and workload.",
                    img: "/images/dashboard.png",
                 },
                 { 
                    id: 'yaag',
                    title: "Year At A Glance", 
                    desc: "See the whole year in 3 terms — then drill down to week/day.",
                    img: "/images/yaag.png",
                 },
                 { 
                    id: 'durmah',
                    title: "Durmah AI", 
                    desc: "Ask anything. Get explanations, practice prompts, and marking-style guidance.",
                    img: "/images/durmah.png",
                 },
                 { 
                    id: 'awy',
                    title: "Always With You", 
                    desc: "Optional parent presence — supportive, never intrusive.",
                    img: "/images/awy.png",
                 }
              ].map((item, i) => (
                 <div key={item.id} className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col">
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
                       <button 
                           onClick={() => {
                               setActivePanel(item.id);
                               document.getElementById('feature-spotlight')?.scrollIntoView({ behavior: 'smooth' });
                           }}
                           className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all hover:bg-purple-50 rounded px-2 py-1 -ml-2 w-fit"
                       >
                          See feature <ArrowRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* 2.5) FEATURE SPOTLIGHT (Accordion) */}
      <section id="feature-spotlight" className="py-12 bg-white border-b border-gray-100">
         <div className="max-w-4xl mx-auto px-6">
             <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900">Feature spotlight</h2>
                <p className="text-gray-500 text-sm mt-1">A closer look — with real screenshots.</p>
             </div>
             
             <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
                {[
                   { 
                      id: 'dashboard',
                      title: "Smart Dashboard", 
                      content: "Starts your day with clarity. We aggregate your deadlines, lecture schedule, and workload into one view.",
                      bullets: ["Prioritized daily task list", "Weather & Campus status integration", "Morning briefing with key academic updates"],
                      img: "/images/dashboard.png" 
                   },
                   { 
                      id: 'yaag',
                      title: "Year At A Glance", 
                      content: "The eagle-eye view of your entire Durham specific degree journey.",
                      bullets: ["Navigate Foundation to Year 3", "Interactive term columns (Michaelmas/Epiphany)", "Click to drill down into weekly details"],
                      img: "/images/yaag.png" 
                   },
                   { 
                      id: 'durmah',
                      title: "Durmah AI", 
                      content: "Your always-on legal study partner. Ask specific questions about your modules or cases.",
                      bullets: ["Trained on legal reasoning structure", "Upload transcripts for analysis", "Voice-enabled for natural conversation"],
                      img: "/images/durmah.png" 
                   },
                   { 
                      id: 'awy',
                      title: "Always With You", 
                      content: "Stay connected to your support network without it becoming a distraction.",
                      bullets: ["See loved ones' online status", "One-tap video calling", "Privacy-focused design"],
                      img: "/images/awy.png" 
                   }
                ].map((panel) => (
                    <div key={panel.id} className="group">
                        <button 
                           onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
                           className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors ${activePanel === panel.id ? 'bg-gray-50' : ''}`}
                        >
                           <span className={`text-base font-semibold ${activePanel === panel.id ? 'text-purple-700' : 'text-gray-900'}`}>{panel.title}</span>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${activePanel === panel.id ? 'rotate-180 bg-white shadow-sm' : ''}`}>
                               <ChevronDown className={`w-4 h-4 text-gray-500`} />
                           </div>
                        </button>
                        
                        {/* Panel Content */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activePanel === panel.id ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="px-6 pb-6 pt-0">
                               <p className="text-sm text-gray-600 mb-4">{panel.content}</p>
                               <ul className="space-y-2 list-disc pl-5 text-sm text-gray-600 mb-6">
                                   {panel.bullets.map((b, i) => <li key={i}>{b}</li>)}
                               </ul>
                               
                               <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
                                   <Image src={panel.img} alt={`${panel.title} Preview`} width={700} height={400} className="w-full h-auto" />
                               </div>

                               <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                  <Link href="/signup">
                                    <button className="text-sm bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-purple-700 transition shadow-sm">
                                        Start your 14-day trial
                                    </button>
                                  </Link>
                                  <Link href="/pricing">
                                     <button className="text-sm border border-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-50 transition">
                                        See pricing
                                     </button>
                                  </Link>
                               </div>
                           </div>
                        </div>
                    </div>
                ))}
             </div>
         </div>
      </section>

      {/* 3) HOW IT WORKS (New Section) */}
      <section id="how-it-works" className="py-14 bg-white border-b border-gray-100">
         <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
               <p className="mt-2 text-base text-gray-600">Three steps. Less stress. More clarity.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                  { step: 1, title: 'Upload or pick a lecture', desc: 'Add a transcript or open a lecture you’ve uploaded.' },
                  { step: 2, title: 'Get structured clarity', desc: 'Notes, key points, glossary, and lecturer emphasis — with evidence.' },
                  { step: 3, title: 'Turn it into a plan', desc: 'Practice prompts + deadlines + YAAG keep your week on track.' }
               ].map((s) => (
                  <div key={s.step} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition">
                     <div className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 text-xs font-semibold mb-4">
                        Step {s.step}
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                     <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 4) LECTURER EMPHASIS & INTEGRITY */}
      <section id="lecturer-emphasis" className="py-20 bg-white border-y border-gray-100">
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
                       "Identify lecturer-emphasised concepts (with transcript evidence)",
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
            <div className="mt-4 text-center">
               <div className="text-sm font-semibold text-white/90">£24.99 / month • £199 / year (save ~33%)</div>
               <div className="mt-1 text-xs text-white/70">14-day trial • cancel anytime • no commitment</div>
            </div>
            <Link href="/signup">
               <button className="mt-6 bg-white text-purple-950 font-bold py-4 px-12 rounded-full text-lg shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all transform">
                  Start your 14-day trial
               </button>
            </Link>
         </div>
      </section>
    </>
  )
}
