import Head from 'next/head';
import Link from 'next/link';
import { Brain, CheckCircle, ArrowRight, BookOpen, Clock, AlertTriangle } from 'lucide-react';

export default function LnatPreparation() {
  return (
    <>
      <Head>
        <title>LNAT Preparation for Durham Law | MyDurhamLaw</title>
        <meta name="description" content="Specialized LNAT preparation for international and Foundation students. Master the reasoning format required for top UK law schools." />
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
                    The test that decides your <br className="hidden md:block"/> law school future.
                 </h1>
                 <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
                    For international and Foundation students, the LNAT is the "great equalizer". 
                    Excellent grades are not enough if you cannot reason under pressure.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/lnat/signup">
                        <button className="bg-white text-gray-900 font-black py-4 px-10 rounded-full text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            Start Free LNAT Trial
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
                        Top universities use it to filter applicants who have perfect grades but lack the "analytical stamina" required for a law degree.
                    </p>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">One Chance Only</h4>
                                <p className="text-sm text-gray-700">
                                    You can only sit the LNAT once per admissions cycle. There are no retakes. Walking in unprepared is a critical risk.
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
                            <span>Trial format available instantly</span>
                         </div>
                         <Link href="/lnat/signup" className="text-purple-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                            Create Free Account <ArrowRight className="w-4 h-4" />
                         </Link>
                    </div>
                </div>
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
                        Enter LNAT Mentor
                    </button>
                </Link>
                <p className="mt-4 text-xs text-gray-400">
                    MyDurhamLaw is an independent preparation provider and is not affiliated with LNAT Consortium or Pearson VUE.
                </p>
            </div>
        </div>

      </div>
    </>
  )
}
