import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Play,
  Zap,
  FileText,
  Target,
  Activity,
  Award,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";

export default function ExamPrepDemo() {
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Exam Technique & Prep - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Master Durham Law exams. IRAC mastery, essay structuring, and ethical AI-assisted revision."
        />
        <link rel="canonical" href="https://mydurhamlaw.com/demo/exam-prep" />
      </Head>

      <main>
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-widest mb-6 border border-red-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Peak Performance
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Exam <span className="text-red-400">Technique</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium text-balance">
              The exam hall isn&apos;t just about memory—it&apos;s about
              pressure management and precision. We help you simulate the
              conditions and refine the techniques of a First-Class candidate.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">
                Simulated Pressure. <br />
                <span className="text-red-600 italic">Authentic Results.</span>
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                We believe in ethical AI usage. Our Exam Prep hub focuses on
                *technique coaching* and *scenario simulations* that force you
                to apply legal principles in novel, high-stakes contexts.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Scenario Pressure Tests",
                    desc: "Durmah presents you with a fresh, unseen legal problem and gives you 15 minutes to outline a response under a ticking clock.",
                    icon: <Activity className="w-5 h-5" />,
                  },
                  {
                    title: "Analytical Benchmarking",
                    desc: "See how your structural logic compares to standard 'First Class' criteria based on Durham's own assessment rubrics.",
                    icon: <Target className="w-5 h-5" />,
                  },
                  {
                    title: "The Revision Optimizer",
                    desc: "Identify your weakest modules based on your past 'Quiz Me' performance and focus your final hours where they matter most.",
                    icon: <Zap className="w-5 h-5" />,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-6 rounded-3xl border border-red-100 bg-red-50/30 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-[130px] opacity-10 rounded-full"></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative z-10 overflow-hidden group">
                <div className="aspect-video bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-red-100 group-hover:scale-110 transition cursor-pointer">
                    <Play className="w-8 h-8 ml-1 fill-current" />
                  </div>
                  <p className="text-xl font-black text-gray-900 mb-2">
                    Simulate an Exam Scenario
                  </p>
                  <p className="text-sm text-gray-400">
                    Experience a high-pressure scenario on Contract Law
                    misrepresentation.
                  </p>
                </div>

                <div className="mt-8 flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-black text-gray-900">
                      00:14:59
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Simulation Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-red-950 rounded-[3rem] p-12 md:p-20 text-white mb-24 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block px-4 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-widest mb-8 border border-red-500/30">
                Technique Mastery
              </span>
              <h3 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter italic">
                Confidence is earned <br /> in the arena.
              </h3>
              <p className="text-red-100/70 text-lg md:text-xl mb-12 leading-relaxed font-medium">
                Don&apos;t walk into your 2-hour finals hoping for the best.
                Train with a simulator that identifies your structural gaps and
                helps you close them before the big day.
              </p>
              <Link href="/signup">
                <Button className="bg-white text-red-900 hover:bg-gray-100 font-black px-12 py-8 text-xl rounded-2xl shadow-xl transition-all flex items-center gap-3">
                  Start Your Prep <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>
            </div>
            <Award className="absolute -bottom-12 -right-12 w-96 h-96 text-white/5 rotate-12 pointer-events-none" />
          </div>

          <RelatedGuides currentSlug="exam-prep" />
        </section>
      </main>
    </div>
  );
}
