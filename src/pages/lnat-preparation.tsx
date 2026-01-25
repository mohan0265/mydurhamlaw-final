import Head from 'next/head';
import Link from 'next/link';
import { Brain, CheckCircle, ArrowRight, BookOpen, Clock, AlertTriangle } from 'lucide-react';

export default function LnatPreparation() {
  const isLaunchEnabled = process.env.NEXT_PUBLIC_LNAT_LAUNCH_ENABLED === 'true';

  return (
    <>
      <Head>
        <title>LNAT Preparation for UK Law Admissions | MyDurhamLaw</title>
        <meta name="description" content="LNAT preparation for international and Foundation students. Build reading precision, logical reasoning, and structured argumentation for UK law admissions." />
        <meta property="og:title" content="LNAT Preparation for UK Law Admissions | MyDurhamLaw" />
        <meta property="og:description" content="LNAT preparation for international and Foundation students. Build reading precision, logical reasoning, and structured argumentation for UK law admissions." />
      </Head>

      <div className="min-h-screen bg-white font-sans text-gray-900">
        
        {/* HERO */}
        <div className="relative bg-gray-900 text-white overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50" />
             <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
                 <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold text-purple-200 mb-8 border border-white/10">
                    <Brain className="w-4 h-4" />
                    <span>LNAT Mentor by MyDurhamLaw</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-110">
                    The admissions test that can <br className="hidden md:block"/> shape your UK law offers.
                 </h1>
                 <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    For international and Foundation students, the LNAT can be a decisive differentiator. 
                    Strong grades help — but admissions teams also look for reasoning clarity under pressure.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <Link href="/lnat/signup">
                        <button className="bg-white text-gray-900 font-black py-4 px-10 rounded-full text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            {isLaunchEnabled ? 'Start Free LNAT Trial' : 'Join LNAT Waitlist'}
                        </button>
                    </Link>
                 </div>
             </div>
        </div>

        {/* CONTENT BLOCK */}
        <div className="max-w-4xl mx-auto px-6 py-20">
            <h2 className="text-3xl font-bold mb-8">Why prepare differently?</h2>
            
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <p className="text-lg text-gray-600 leading-relaxed">
                        The <strong>National Admissions Test for Law (LNAT)</strong> is not a test of legal knowledge. It is a grueling test of verbal reasoning and argumentation.
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        The LNAT is not a pass/fail exam. Universities use it alongside your application to assess reading comprehension, argument analysis, and written reasoning.
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Top universities use it to filter applicants who have perfect grades but lack the "analytical stamina" required for a law degree.
                    </p>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">One Chance Only</h4>
                                <p className="text-sm text-gray-700">
                                    You may only sit the LNAT once per admissions cycle. If you sit it twice in the same cycle, the later attempt is invalidated. Plan early and prepare properly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        What LNAT Mentor Covers
                    </h3>
                    <ul className="space-y-4">
                        {[
                            "Deconstructing dense argumentative texts",
                            "Identifying unstated assumptions",
                            "Distinguishing fact from opinion",
                            "Structuring Section B essays under time limits",
                            "Building vocabulary for 'unfamiliar' topics"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-gray-700 font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                         <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Clock className="w-4 h-4" />
                            <span>{isLaunchEnabled ? 'Trial format available instantly' : 'Early access opens soon'}</span>
                         </div>
                         <Link href="/lnat/signup" className="text-purple-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                            {isLaunchEnabled ? 'Create Free Account' : 'Join Priority List'} <ArrowRight className="w-4 h-4" />
                         </Link>
                    </div>
                </div>
            </div>
        </div>

        {/* UK CONTEXT BLOCK */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Planning applications beyond one university?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                   Many UK law schools use the LNAT as part of admissions. If you’re applying to multiple institutions, your preparation should be broad and skills-based — not tied to a single syllabus.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Link href="/lnat-preparation" className="text-purple-600 font-semibold hover:underline">LNAT preparation overview</Link>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <Link href="/learn" className="text-purple-600 font-semibold hover:underline">Legal reasoning & study guides</Link>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <Link href="/learn/durham-law-academic-integrity-ai" className="text-purple-600 font-semibold hover:underline">Academic integrity & responsible AI use</Link>
                </div>
                <p className="text-xs text-gray-400">
                   We focus on reading precision, argument structure, and reasoning habits that transfer across UK law admissions and early law study.
                </p>
            </div>
        </div>

        {/* CTA FOOTER */}
        <div className="bg-gray-100 py-16 text-center border-t border-gray-200">
            <div className="max-w-2xl mx-auto px-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Secure your advantage.</h2>
                <p className="text-gray-600 mb-8">
                    Use MyDurhamLaw's specialized platform to treat the LNAT with the seriousness it deserves.
                </p>
                <Link href="/lnat/signup">
                    <button className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition shadow-lg hover:shadow-purple-200">
                        {isLaunchEnabled ? 'Enter LNAT Mentor' : 'Join LNAT Waitlist'}
                    </button>
                </Link>
                <p className="mt-4 text-xs text-gray-400">
                    MyDurhamLaw is an independent preparation provider and is not affiliated with the LNAT Consortium or Pearson VUE. LNAT Mentor focuses on reasoning and writing skills and does not provide predictions or admission guarantees.
                </p>
            </div>
        </div>

      </div>
    </>
  )
}
