import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Brain, Heart, Calendar, Shield, CheckCircle, Target, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
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

   const currentImage = images[slide] || images[0];
   if (!currentImage) return null;

   return (
      <div className="relative group w-full">
         <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 aspect-[16/10] shadow-sm">
             <Image 
                src={currentImage.src} 
                alt={currentImage.caption} 
                fill 
                className="object-cover object-top transition-all duration-500"
             />
             {/* Note: Privacy overlay is hardcoded in the image or logic if needed, but we assume clean assets for carousels or user provided ones */}
         </div>
         
         <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-900 flex-1">{currentImage.caption}</p>
            
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
        <meta name="description" content="Turn lectures into clarity. Turn deadlines into a plan. Integrity-first AI for Durham Law students." />
        <meta property="og:title" content="MyDurhamLaw - Durham Law support, 24/7" />
        <meta property="og:description" content="Turn lectures into clarity. Turn deadlines into a plan. Integrity-first AI for Durham Law students." />
        <meta property="og:image" content="https://mydurhamlaw.com/og/og-home.png" />
        <meta property="og:url" content="https://mydurhamlaw.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://mydurhamlaw.com/og/og-home.png" />
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
                    img: "/images/dashboard.png", // Fixed 404
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
                        "Turn Panopto captions or transcripts into structured, readable notes",
                        "Key points, glossary, and 'why it matters' in a Durham-ready layout",
                        "Lecturer emphasis signals (with transcript evidence) to guide revision",
                        "Ask Durmah inside the lecture page — save only what's worth keeping"
                      ],
                      carouselImages: [
                         { src: "/assets/onboarding/blackboard-courses-list.png", caption: "1) Your lecture library — searchable, organised, Durham-ready" },
                         { src: "/images/dashboard.png", caption: "2) Add a lecture in minutes — paste Panopto captions or upload a transcript" },
                         { src: "/images/durmah.png", caption: "3) Exam Prep tab — emphasis signals + integrity-safe practice prompts" }
                      ]
                   },
                   { 
                      id: 'my-assignments',
                      title: "My Assignments", 
                      content: "Calmer progress. Better structure.",
                      bullets: [
                         "Convert a brief into a clear plan: requirements → approach → structure",
                         "Guided workflow: understanding, research, structure, drafting, review",
                         "Integrity-first scaffolds — you stay in control of your final writing",
                         "Keep everything tied to your deadline, word limit, and marking criteria"
                      ],
                      carouselImages: [
                         { src: "/assets/onboarding/blackboard-assessment-info.png", caption: "1) Assignment Hub — every deadline and progress status in one view" },
                         { src: "/assets/onboarding/blackboard-due-dates.png", caption: "2) Create an assignment — capture the brief, word limit, and due date" },
                         { src: "/images/dashboard.png", caption: "3) Assignment Assistant — step-by-step guidance without taking over your writing" }
                      ]
                   },
                   { 
                      id: 'exam-prep',
                      title: "Exam Prep", 
                      content: "Practice understanding, application, and structure — without shortcuts.",
                      bullets: [
                        "Build confidence with issue-spotting and IRAC-style practice drills",
                        "Generate practice prompts from what you actually learned in lectures",
                        "Focus on application and reasoning — never 'exam predictions'",
                        "Revision prompts that respect academic integrity and your own voice"
                      ],
                      carouselImages: [
                         { src: "/images/durmah.png", caption: "1) Lecturer emphasis signals — what was stressed, with transcript evidence" },
                         { src: "/images/dashboard.png", caption: "2) Practice prompts — apply concepts using short, focused drills" },
                         { src: "/images/durmah.png", caption: "3) Filter by emphasis — revise what mattered most, not what's loudest" }
                      ]
                   },
                   { 
                      id: 'durmah',
                      title: "Durmah AI", 
                      content: "Always available — and aware of what you're working on.",
                      bullets: [
                        "Ask questions in-context (lectures, assignments, exam prep, wellbeing)",
                        "Clear explanations, examples, and 'check-your-understanding' prompts",
                        "Optional voice mode for quick support while studying",
                        "Your saved highlights become your personal revision memory"
                      ],
                      carouselImages: [
                         { src: "/images/durmah.png", caption: "1) Ask anything — clear explanations, examples, and check-your-understanding" },
                         { src: "/images/durmah.png", caption: "2) Voice mode — quick support while you study" },
                         { src: "/images/durmah.png", caption: "3) Saved highlights — your personal revision memory across the app" }
                      ]
                   },
                   { 
                      id: 'yaag',
                      title: "Year At A Glance", 
                      content: "See the whole year in 3 terms — then drill down to month/week/day.",
                      bullets: [
                         "A true eagle-eye view of your workload across Michaelmas → Epiphany → Easter",
                         "Deadlines and assessments sit where they belong in the calendar",
                         "Click from year → month → week → day without losing context",
                         "Your current year links into full detail views; other years stay overview-only"
                      ],
                      carouselImages: [
                          { src: "/images/yaag.png", caption: "1) Year view — three terms side-by-side, at a glance" },
                          { src: "/images/yaag.png", caption: "2) Month view — see deadlines in context, not scattered across tabs" },
                          { src: "/assets/onboarding/mytimetable-export.png", caption: "3) Week view — your workload, timetable, and tasks together" }
                      ]
                   },
                   { 
                      id: 'awy',
                      title: "Always With You", 
                      content: "Optional presence support — calm, not intrusive.",
                      bullets: [
                         "See when loved ones are available (opt-in only)",
                         "One-click video call when you want support",
                         "Designed for emotional presence, not distraction",
                         "You control visibility, availability, and privacy"
                      ],
                      carouselImages: [
                          { src: "/images/awy.png", caption: "1) Presence, not pressure — opt-in availability for loved ones" },
                          { src: "/images/awy.png", caption: "2) One-click video call — support when you choose" }
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
                     link: '/learn/durham-lectures'
                  },
                  { 
                     step: 2, 
                     title: 'My Assignments', 
                     desc: 'Break briefs into steps. Draft with focus.',
                     link: '/learn/durham-assignments'
                  },
                  { 
                     step: 3, 
                     title: 'Exam Prep + Durmah', 
                     desc: 'Integrity-safe practice prompts & revision logic.',
                     link: '/learn/durham-exam-prep'
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
