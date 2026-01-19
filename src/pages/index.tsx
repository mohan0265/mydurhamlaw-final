import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Brain, Heart, Calendar, Shield, CheckCircle, Target, ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Handle deep linking to features
  React.useEffect(() => {
    if (router.isReady && router.query.feature) {
       const feat = router.query.feature as string;
       const validFeatures = ['my-lectures', 'my-assignments', 'exam-prep', 'durmah', 'yaag'];
       if (validFeatures.includes(feat)) {
          setActivePanel(feat);
          // Small delay to allow render
          setTimeout(() => {
             document.getElementById('feature-spotlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
       }
    }
  }, [router.isReady, router.query]);


// --- Internal Carousel Component ---
const FeatureCarousel = ({ images }: { images: { src: string, caption: string }[] }) => {
   const [slide, setSlide] = React.useState(0);
   
   if (!images || images.length === 0) return (
       <div className="rounded-xl border border-gray-200 bg-gray-50 h-64 flex items-center justify-center text-gray-400">
           No images available
       </div>
   );

   return (
      <div className="relative group w-full">
         <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 aspect-[16/10] shadow-sm">
             <Image 
                src={images[slide].src} 
                alt={images[slide].caption} 
                fill 
                className="object-cover object-top transition-all duration-500"
             />
             {/* Note: Privacy overlay is hardcoded in the image or logic if needed, but we assume clean assets for carousels or user provided ones */}
         </div>
         
         <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-900 flex-1">{images[slide].caption}</p>
            
            <div className="flex gap-2 shrink-0">
               <button 
                  onClick={() => setSlide(s => s === 0 ? images.length-1 : s-1)} 
                  className="p-1.5 hover:bg-gray-100 rounded-full border border-gray-200 text-gray-600 transition"
                  aria-label="Previous slide"
               >
                  <ChevronLeft className="w-4 h-4"/>
               </button>
               
               {/* Dots - only show if < 6 images */}
               {images.length < 6 && (
                   <div className="flex items-center gap-1.5 px-2">
                     {images.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === slide ? 'bg-purple-600' : 'bg-gray-300'}`} />
                     ))}
                   </div>
               )}

               <button 
                  onClick={() => setSlide(s => s === images.length-1 ? 0 : s+1)} 
                  className="p-1.5 hover:bg-gray-100 rounded-full border border-gray-200 text-gray-600 transition"
                  aria-label="Next slide"
               >
                  <ChevronRight className="w-4 h-4"/>
               </button>
            </div>
         </div>
      </div>
   )
}

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
        className="relative min-h-[95vh] flex items-center py-16 lg:py-24 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')" }}
      >
        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              
              {/* Left: Content */}
              <div className="text-center lg:text-left pt-8 lg:pt-0">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-gray-200">Accepting all years (Foundation → Year 3)</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05] text-white">
                  Durham Law support, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">24/7.</span>
                </h1>
                
                <div className="mt-4 text-xl sm:text-2xl text-white/90 max-w-xl leading-relaxed font-light">
                  Turn lectures into clarity.<br />Turn deadlines into a plan.
                </div>
                <div className="mt-4 text-sm text-white/60 font-medium tracking-wide uppercase">
                  Durham-specific • Integrity-first • Built around Michaelmas → Epiphany → Easter
                </div>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <Link href="/signup">
                    <button className="w-full sm:w-auto bg-white text-purple-950 font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                      Start Free Trial
                    </button>
                  </Link>
                  <Link href="/pricing">
                    <button className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg transition-all backdrop-blur-sm">
                      See Pricing
                    </button>
                  </Link>
                </div>
                
                {/* Pricing Preview */}
                <div className="mt-6 flex flex-col items-center lg:items-start text-white/80">
                   <div className="flex items-center gap-3 text-sm font-medium">
                      <span className="bg-white/10 px-2 py-0.5 rounded text-white">£24.99 / month</span>
                      <span className="text-white/40">•</span>
                      <span className="bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30">£199 / year (save ~33%)</span>
                   </div>
                   <div className="mt-2 text-xs text-white/50">
                      14-day free trial • cancel anytime • no commitment
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 text-xs text-white/60 flex items-start gap-3 max-w-md mx-auto lg:mx-0 text-left">
                   <Shield className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" /> 
                   <span>
                      <strong>Learning support</strong> — we help you understand, practise, and plan. We don’t generate work to submit as your own.
                   </span>
                </div>
              </div>

               {/* Right: Hero Image (Tighter Crop) */}
               <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                  <div className="relative rounded-[2.5rem] border border-white/20 bg-gray-900/50 p-2 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-[2.5rem]" />
                      <div className="rounded-[2rem] overflow-hidden shadow-2xl aspect-square relative">
                        <Image 
                           src="/images/dashboard.png" 
                           alt="MyDurhamLaw Dashboard" 
                           fill
                           className="object-cover object-left-top hover:scale-[1.02] transition-transform duration-700"
                           priority
                        />
                         {/* Name Overlay (Privacy) */}
                         <div className="absolute top-[8%] left-[28%] bg-gray-100 rounded-md px-3 py-1 flex items-center justify-center shadow-lg z-10 w-[180px] h-[34px] border border-gray-200">
                            <span className="text-gray-900 font-bold text-base">Durham Student</span>
                         </div>
                     </div>
                  </div>
               </div>

           </div>
        </div>
      </div>

      {/* 2) WIDGET GALLERY (Feature Grid) */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything needed to survive (and thrive)</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Not just generic tools. A suite built specifically for the Durham Law syllabus.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                 { 
                    id: 'my-lectures',
                    title: "My Lectures", 
                    desc: "Structured notes, key points, and lecturer signals.",
                    img: "/landing/features/my-lectures/01.png", // Using the first verified upload
                    isNew: true
                 },
                 { 
                    id: 'my-assignments',
                    title: "My Assignments", 
                    desc: "Break briefs into steps. Draft with focus.",
                    img: "/images/dashboard.png", // Facade for now
                    isNew: true
                 },
                 { 
                    id: 'exam-prep',
                    title: "Exam Prep", 
                    desc: "Integrity-safe practice prompts & revision logic.",
                    img: "/images/durmah.png", // Facade
                 },
                 { 
                    id: 'yaag',
                    title: "Year At A Glance", 
                    desc: "Interactive academic calendar.",
                    img: "/images/yaag.png",
                 }
              ].map((item, i) => (
                 <div key={item.id} className="group rounded-[1.5rem] border border-gray-100 bg-white shadow-lg hover:shadow-xl transition-all duration-300 p-3 flex flex-col items-start relative overflow-hidden">
                    <div className="w-full rounded-2xl overflow-hidden border border-gray-100 mb-4 bg-gray-50 aspect-[16/10] relative shadow-inner">
                       <Image 
                          src={item.img} 
                          alt={item.title} 
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                       />
                       {/* Label Pill */}
                       <div className="absolute top-2 left-2 bg-white/90 backdrop-blur border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold text-gray-600 shadow-sm uppercase tracking-wide">
                          {item.id.replace('-', ' ')}
                       </div>
                       
                       {/* Privacy Overlay for specific images */}
                       {(item.id === 'my-assignments' || item.id === 'yaag') && (
                          <div className="absolute top-[8%] left-[28%] bg-gray-100 rounded-sm px-1 flex items-center justify-center shadow-sm z-10 w-[20%] h-[8%]">
                             <span className="text-gray-800 font-bold text-[6px] sm:text-[8px]">Student</span>
                          </div>
                       )}
                    </div>
                    <div className="px-2 pb-2">
                       <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                       <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                       <button 
                           onClick={() => {
                               setActivePanel(item.id);
                               document.getElementById('feature-spotlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                           }}
                           className="text-sm font-bold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all hover:bg-purple-50 rounded-lg px-3 py-1.5 -ml-3 w-fit"
                       >
                          See feature <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* 2.5) FEATURE SPOTLIGHT (Accordion with Carousel) */}
      <section id="feature-spotlight" className="py-16 bg-white border-b border-gray-100 min-h-[600px]">
         <div className="max-w-5xl mx-auto px-6">
             <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900">Feature spotlight</h2>
                <p className="text-gray-500 text-sm mt-1">A closer look — with real screenshots.</p>
             </div>
             
             <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
                {[
                   { 
                      id: 'my-lectures',
                      title: "My Lectures", 
                      content: "The foundation of your week. Everything in one place.",
                      bullets: [
                        "Structured notes from your own transcript — clear, modular, and Durham-ready",
                        "Key points + glossary in one place (so revision is fast, not frantic)",
                        "Lecturer Emphasis with transcript evidence — what they repeated and stressed",
                        "Practice prompts for understanding and application (integrity-safe, no shortcuts)"
                      ],
                      carouselImages: [
                         { src: "/landing/features/my-lectures/01.png", caption: "1) Your lecture library — everything organised by module and lecturer" },
                         { src: "/landing/features/my-lectures/02.png", caption: "2) Add a lecture in minutes — paste Panopto captions or upload transcript" },
                         { src: "/landing/features/my-lectures/03.png", caption: "3) Key points you can revise from — concise, searchable, week-ready" },
                         { src: "/landing/features/my-lectures/04.png", caption: "4) Lecturer Emphasis signals — with evidence pulled from the transcript" },
                         { src: "/landing/features/my-lectures/05.png", caption: "5) Practice prompts — strengthen understanding and application, safely" }
                      ]
                   },
                   { 
                      id: 'my-assignments',
                      title: "My Assignments", 
                      content: "Calmer progress. Better structure.",
                      bullets: [
                        "Turn a brief into a clear plan: requirements → approach → structure",
                        "Guided workflow: understanding, research, structure, drafting hygiene, review",
                        "Helps you learn the skill — you stay in control of the final writing",
                        "Built for calmer progress, not last-minute panic"
                      ],
                      carouselImages: [
                         { src: "/landing/features/my-assignments/01.png", caption: "1) Assignment Hub — see every deadline and progress status at a glance" },
                         { src: "/landing/features/my-assignments/02.png", caption: "2) Create an assignment — capture the brief, word limit, and due date" },
                         { src: "/landing/features/my-assignments/03.png", caption: "3) Step-by-step assistant — understanding → research → structure" },
                         { src: "/landing/features/my-assignments/04.png", caption: "4) Drafting hygiene + review — clarity, citations, and final checks" },
                         { src: "/landing/features/my-assignments/05.png", caption: "5) Save & resume — pick up exactly where you left off" }
                      ]
                   },
                   { 
                      id: 'exam-prep',
                      title: "Exam Prep", 
                      content: "Practice that respects academic integrity.",
                      bullets: [
                        "Integrity-safe practice that follows your learning — not “predictions”",
                        "IRAC / structure drills for application and reasoning (marks live here)",
                        "Practice prompts generated from your lectures and course content",
                        "Clear reassurance: no exam paper guessing, no work to submit as your own"
                      ],
                      carouselImages: [
                         { src: "/landing/features/exam-prep/01.png", caption: "1) Exam Prep overview — revision that feels organised, not overwhelming" },
                         { src: "/landing/features/exam-prep/02.png", caption: "2) Practice prompts — tailored to what you learned in this lecture/module" },
                         { src: "/landing/features/exam-prep/03.png", caption: "3) Structure drills — IRAC, issue-spotting, and application practice" },
                         { src: "/landing/features/exam-prep/04.png", caption: "4) Integrity-first badge — built to help learning, not shortcut it" }
                      ]
                   },
                   { 
                      id: 'durmah',
                      title: "Durmah AI", 
                      content: "Your 24/7 Legal Eagle Buddy.",
                      bullets: [
                        "Your Legal Eagle Buddy: tutor-style explanations + reasoning practice",
                        "Ask “why”, “how”, “what if” — and get calm, structured answers",
                        "Helps you revise by understanding, not memorising blindly",
                        "Always available — especially when you’re stuck late at night"
                      ],
                      carouselImages: [
                         { src: "/landing/features/durmah/01.png", caption: "1) Ask a focused question — get a clear explanation, not waffle" },
                         { src: "/landing/features/durmah/02.png", caption: "2) Reasoning mode — step-by-step understanding and application" },
                         { src: "/landing/features/durmah/03.png", caption: "3) Build confidence — practice explaining concepts in your own words" },
                         { src: "/landing/features/durmah/04.png", caption: "4) Support without judgement — helpful when stress is high" }
                      ]
                   },
                   { 
                      id: 'yaag',
                      title: "Year At A Glance", 
                      content: "The eagle-eye view of your entire Durham specific degree journey.",
                      bullets: ["Navigate Foundation to Year 3", "Interactive term columns (Michaelmas/Epiphany)", "Click to drill down into weekly details"],
                      carouselImages: [
                          { src: "/landing/features/yaag/01.png", caption: "1) See your entire academic year at a glance" },
                          { src: "/landing/features/yaag/02.png", caption: "2) Drill down into specific weeks and days" }
                      ]
                   }
                ].map((panel) => (
                    <div key={panel.id} className="group">
                        <button 
                           onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
                           className={`w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors ${activePanel === panel.id ? 'bg-gray-50' : ''}`}
                        >
                           <span className={`text-lg font-bold ${activePanel === panel.id ? 'text-purple-700' : 'text-gray-900'}`}>{panel.title}</span>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${activePanel === panel.id ? 'rotate-180 bg-white shadow-sm' : ''}`}>
                               <ChevronDown className={`w-5 h-5 text-gray-500`} />
                           </div>
                        </button>
                        
                        {/* Panel Content */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activePanel === panel.id ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="px-6 pb-8 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                               <div>
                                  <p className="text-base text-gray-700 mb-6 leading-relaxed">{panel.content}</p>
                                  <ul className="space-y-3 list-disc pl-5 text-sm text-gray-600 mb-8">
                                      {panel.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                  </ul>
                                  
                                  <div className="flex flex-col sm:flex-row gap-3">
                                     <Link href="/signup">
                                       <button className="text-sm bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition shadow-sm w-full sm:w-auto">
                                           Start 14-day trial
                                       </button>
                                     </Link>
                                     <Link href="/pricing">
                                        <button className="text-sm border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition w-full sm:w-auto">
                                           See pricing
                                        </button>
                                     </Link>
                                  </div>
                               </div>

                               <div>
                                  {/* CAROUSEL INSTANCE */}
                                   <FeatureCarousel images={panel.carouselImages} />
                               </div>
                           </div>
                        </div>
                    </div>
                ))}
             </div>
         </div>
      </section>

      {/* 3) HOW IT WORKS (Workflow) */}
      <section id="how-it-works" className="py-20 bg-white border-b border-gray-100">
         <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-gray-900">How MyDurhamLaw helps you every week</h2>
               <p className="mt-2 text-base text-gray-600">A simple loop: clarity → coursework → confidence.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { 
                     step: 1, 
                     title: 'My Lectures', 
                     desc: 'Structured notes, key points, and lecturer signals.',
                     link: '/study/lectures'
                  },
                  { 
                     step: 2, 
                     title: 'My Assignments', 
                     desc: 'Break briefs into steps. Draft with focus.',
                     link: '/assignments'
                  },
                  { 
                     step: 3, 
                     title: 'Exam Prep + Durmah', 
                     desc: 'Integrity-safe practice prompts & revision logic.',
                     link: '/exam-prep'
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
                           Open tool <ArrowRight className="w-4 h-4" />
                        </div>
                     </div>
                  </Link>
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
