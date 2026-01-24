import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { 
   Brain, Shield, CheckCircle, 
   ArrowRight, 
   BookOpen, TrendingUp, FileText 
} from 'lucide-react'
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
        <title>MyDurhamLaw — Learn Law | Write Law | Speak Law</title>
        <meta name="description" content="Durham-specific law support — lectures, assignments, revision, and legal reasoning (text + voice)." />
        <meta property="og:title" content="Learn law. Write law. Speak law." />
        <meta property="og:description" content="Durham-specific law support — lectures, assignments, revision, and legal reasoning (text + voice)." />
        <meta property="og:image" content="https://mydurhamlaw.com/og/og-hero.png?v=3" />
        <meta property="og:site_name" content="MyDurhamLaw" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://mydurhamlaw.com/" />
        <link rel="canonical" href="https://mydurhamlaw.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn law. Write law. Speak law." />
        <meta name="twitter:description" content="Durham-specific law support — lectures, assignments, revision, and legal reasoning (text + voice)." />
        <meta name="twitter:image" content="https://mydurhamlaw.com/og/og-hero.png?v=3" />
      </Head>

      {/* 1) HERO SECTION */}
      <div 
        className="relative min-h-screen flex items-center justify-center py-16 lg:py-24 bg-gray-950 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]"></span>
            <span className="text-sm font-medium text-gray-400 tracking-wide uppercase">Accepting all years (Foundation → Year 3)</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-black mb-6 tracking-tighter leading-[0.9] text-white flex flex-col items-center">
            <span className="block">Learn law.</span>
            <span className="block text-purple-400/90">Write law.</span>
            <span className="block">Speak law.</span>
          </h1>
          
          <p className="mt-8 text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
            Durham-specific law support that helps students think, write, and reason like real lawyers — out loud.
          </p>

          <div className="mt-12 mb-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
             {[
               { name: "Learn", href: "/learn/durham-law-ai-study-assistant", sub: "Durham Law understanding" },
               { name: "Write", href: "/learn/durham-law-academic-integrity-ai", sub: "Structured legal writing" },
               { name: "Speak", href: "/learn/durham-law-exam-technique", sub: "Legal reasoning & viva logic" }
             ].map((pVal) => (
                <Link key={pVal.name} href={pVal.href}>
                  <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm cursor-pointer border-b-2 border-b-purple-500/50">
                    <div className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-widest">{pVal.name}</div>
                    <div className="text-xs text-gray-500 font-medium group-hover:text-gray-300 transition-colors">{pVal.sub}</div>
                  </div>
                </Link>
             ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <button className="w-full sm:w-auto bg-white text-gray-950 font-black py-5 px-12 rounded-full text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] active:scale-95 uppercase tracking-widest">
                Start Free Trial
              </button>
            </Link>
            <Link href="/pricing">
              <button className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold py-5 px-12 rounded-full text-lg transition-all backdrop-blur-sm active:scale-95 uppercase tracking-widest">
                See Pricing
              </button>
            </Link>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 text-[10px] text-gray-500 flex items-center justify-center gap-3 uppercase tracking-[0.2em] font-bold">
             <Shield className="w-3 h-3 text-purple-400" />
             <span>Learning support • Academic Integrity • Professional awareness</span>
          </div>
        </div>
      </div>

      {/* 2) SKILL PILLARS SECTION */}
      <section className="py-20 bg-white relative z-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">The Core Pillars</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Philosophy-led, tool-supported. Built specifically for the Durham University Law syllabus.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Learn Law",
                  desc: "Durham Law understanding",
                  link: "/learn/durham-law-ai-study-assistant",
                  icon: <BookOpen className="w-6 h-6 text-purple-600" />,
                  color: "purple"
                },
                {
                  title: "Write Law",
                  desc: "Structured legal writing",
                  link: "/learn/durham-law-academic-integrity-ai",
                  icon: <FileText className="w-6 h-6 text-orange-600" />,
                  color: "orange"
                },
                {
                  title: "Speak Law",
                  desc: "Legal reasoning & viva logic",
                  link: "/learn/durham-law-exam-technique",
                  icon: <Brain className="w-6 h-6 text-indigo-600" />,
                  color: "indigo"
                },
                {
                  title: "Live News",
                  desc: "Professional legal awareness",
                  link: "/legal/tools/legal-news-feed",
                  icon: <TrendingUp className="w-6 h-6 text-red-600" />,
                  color: "red"
                }
              ].map((pillar, i) => (
                <Link key={pillar.title} href={pillar.link}>
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {pillar.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{pillar.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{pillar.desc}</p>
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-600">
                      Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
           </div>
        </div>
      </section>



      {/* 3) HOW IT WORKS (Workflow) */}
      <section id="how-it-works" className="py-20 bg-white border-b border-gray-100">
         <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-gray-900">Durham Law exam prep & revision workflow</h2>
               <p className="mt-2 text-base text-gray-600">A simple loop designed for Durham Law students: clarity → coursework → confidence.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { 
                     step: 1, 
                     title: 'My Lectures', 
                     desc: 'Structured notes, key points, and lecturer signals.',
                     link: '/learn/durham-law-ai-study-assistant',
                     cta: 'Read lecture guide'
                  },
                  { 
                     step: 2, 
                     title: 'My Assignments', 
                     desc: 'Break briefs into steps. Draft with focus.',
                     link: '/learn/durham-law-academic-integrity-ai',
                     cta: 'Read assignment guide'
                  },
                  { 
                     step: 3, 
                     title: 'Exam Prep + Durmah', 
                     desc: 'Integrity-safe practice prompts & revision logic.',
                     link: '/learn/durham-law-exam-technique',
                     cta: 'Read exam guide'
                  }
               ].map((s) => (
                  <Link href={s.link} key={s.step} className="block group">
                     <div className="rounded-[1.5rem] border border-gray-200 bg-white shadow-sm p-8 hover:shadow-xl hover:border-purple-200 transition-all duration-300 h-full">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                           {s.step}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">{s.title}</h3>
                        <p className="text-base text-gray-600 leading-relaxed mb-6">{s.desc}</p>
                        
                        <div className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                           Learn more <ArrowRight className="w-4 h-4" />
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      </section>

      {/* 5) LIVE NEWS USP SECTION */}
      <section className="py-24 bg-gray-950 text-white relative overflow-hidden border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
           <div className="max-w-3xl">
              <h2 className="text-4xl sm:text-5xl font-black mb-8 leading-tight tracking-tight">
                 Why Law Students Must <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-300">Stay Current</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-8 font-light">
                 Law does not evolve in isolation. Every new judgment, regulatory shift, and public controversy shapes the development of the common law.
              </p>
              <p className="text-xl text-gray-400 leading-relaxed mb-10 font-light">
                 MyDurhamLaw includes a regularly refreshed legal news feed to help students build the habit of engaging with real-world legal developments — not just lecture notes and textbooks.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
                 {[
                    "Connect cases to real judgments",
                    "Develop commercial awareness",
                    "Build habits of practitioners",
                    "Durham-specific legal lens"
                 ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                       <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                          <CheckCircle className="w-4 h-4" />
                       </div>
                       <span className="text-gray-300 font-medium text-sm">{benefit}</span>
                    </div>
                 ))}
              </div>

              <Link href="/legal/tools/legal-news-feed">
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full transition-all shadow-xl shadow-red-600/20 flex items-center gap-2 uppercase tracking-widest text-sm">
                  Explore Live Legal News <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
           </div>
        </div>
      </section>


      {/* 4) OUTCOME CARDS (Replacing Oversized Screenshots) */}
      <section className="py-20 bg-gray-50 border-b border-gray-200">
         <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Focus on Outcomes</h2>
               <p className="text-gray-500 mt-2">Built around real Durham workflows, not just buttons and bars.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                  { title: "Master Doctrine", desc: "Turn dense Panopto transcripts into structured legal clarity." },
                  { title: "Plan Better", desc: "Break any law brief into manageable research and writing steps." },
                  { title: "Speak Clearly", desc: "Practice oral reasoning with Durmah until it becomes second nature." },
                  { title: "Stay Aligned", desc: "Your study schedule automatically follows the Durham term dates." },
                  { title: "Cite Safely", desc: "Built-in integrity checks ensure you build your own arguments." },
                  { title: "Stay Connected", desc: "Presence widgets keep you linked to support while you study." }
               ].map((card, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                     <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* POPULAR DURHAM LAW GUIDES */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              Learning Hub
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular <span className="text-purple-600">Durham Law Guides</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Evidence-based study techniques, ethical AI use, and exam strategies—all Durham-specific.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Durham Law AI Study Assistant',
                desc: 'Master Durmah for ethical case research, IRAC issue spotting, and exam prep.',
                slug: 'durham-law-ai-study-assistant',
                readTime: '12 min read'
              },
              {
                title: 'Academic Integrity & AI Use',
                desc: 'Understand Durham\'s AI policy. What\'s permitted, prohibited, and how to stay compliant.',
                slug: 'durham-law-academic-integrity-ai',
                readTime: '10 min read'
              },
              {
                title: 'How to Ask Better Legal Questions',
                desc: 'The 4-layer questioning framework for tutorials, research, and Durmah.',
                slug: 'how-to-ask-better-legal-questions',
                readTime: '8 min read'
              },
              {
                title: 'Durham Law Study Groups',
                desc: 'Build effective, compliant study groups with optimal meeting structures.',
                slug: 'durham-law-study-groups',
                readTime: '9 min read'
              },
              {
                title: 'Durham Law Wellbeing Routine',
                desc: 'Balance intensive study with sustainable sleep, movement, and connection habits.',
                slug: 'durham-law-wellbeing-routine',
                readTime: '7 min read'
              },
              {
                title: 'Durham Law Exam Technique',
                desc: 'IRAC method, essay structuring, time management, and ethical AI exam prep.',
                slug: 'durham-law-exam-technique',
                readTime: '11 min read'
              }
            ].map((guide) => (
              <Link key={guide.slug} href={`/learn/${guide.slug}`}>
                <div className="group p-6 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {guide.desc}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{guide.readTime}</span>
                    <div className="text-purple-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read guide <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/learn">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-purple-600 text-purple-600 font-bold hover:bg-purple-600 hover:text-white transition-all">
                View All Guides <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section (Add new FAQ here or replace existing) */}
      <section id="faq" className="py-20 bg-gray-50 border-t border-gray-100">
         <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-black text-gray-900 mb-12 text-center tracking-tight">Common Questions</h2>
            <div className="grid gap-8">
               {[
                  {
                    q: "Is MyDurhamLaw part of Durham University?",
                    a: "No. MyDurhamLaw is an independent educational technology platform. It is not affiliated with or endorsed by Durham University. We provide expert AI-powered assistance designed to support Durham Law students in building real legal skills."
                  },
                  {
                    q: "What is the One Plan?",
                    a: "We believe in treating all students equally. Unlike other tools with complex tiers, we offer one 'Full Access' plan. Every subscriber gets the same high-quality voice coaching, ethical assignment planning, and legal news updates."
                  },
                  {
                    q: "How does the 14-day trial work?",
                    a: "Your trial includes Full Access so you can experience the real workflow. After 14 days, Full Access is £24.99/month (or save up to 33% with an annual plan). You can cancel anytime during or after the trial."
                  },
                  {
                    q: "What is Durmah Voice?",
                    a: "It's your 24/7 tutor-like companion. Use it for seminar rehearsals, viva-style practice, or rapid clarification of complex principles. We apply a 'fair-use' promise to keep it high-performance for everyone."
                  },
                  {
                    q: "Will this do my assignments for me?",
                    a: "Absolutely not. We are an integrity-first platform. Durmah helps you plan, structure, and understand the Law, but you always do the final writing. It's a support tool, not a shortcut."
                  }
               ].map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200">
                     <h3 className="text-lg font-bold text-gray-900 mb-3">{item.q}</h3>
                     <p className="text-gray-600 leading-relaxed text-sm">{item.a}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 5) CTA Footer */}
      <section className="py-24 bg-gray-900 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/assets/images/hero-supreme-court-uk.webp')] opacity-10 bg-cover bg-center"></div>
         <div className="relative z-10 max-w-3xl mx-auto px-6 text-white text-balance">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Ready to build real legal confidence?</h2>
            <p className="text-xl text-gray-400 mb-10">One plan. Everything included. Fair-use keeps it affordable for everyone.</p>
            <div className="space-y-6">
               <div className="space-y-1">
                  <div className="text-sm font-bold text-white/90">Start free. Full Access is £24.99/month after your trial.</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest font-bold">14-day trial • cancel anytime • no commitment</div>
               </div>
               <div>
                  <Link href="/signup">
                     <button className="bg-white text-gray-900 font-black py-4 px-12 rounded-full text-lg shadow-xl hover:scale-105 transition-all">
                        Start Your Free Trial &rarr;
                     </button>
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </>
  )
}
