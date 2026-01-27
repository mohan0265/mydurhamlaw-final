import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Play, Zap, FileText } from "lucide-react";
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
              Feature Demo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Exam <span className="text-red-400">Prep</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Turn revision stress into exam-room confidence. Master the
              techniques that separate a good answer from a first-class one.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                What you get
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    title: "IRAC Mastery",
                    desc: "Step-by-step guidance on Issue, Rule, Application, and Conclusion for complex problem questions.",
                  },
                  {
                    title: "Essay Structuring",
                    desc: "Build high-level arguments and critical analysis with our structural templates.",
                  },
                  {
                    title: "Time Management",
                    desc: "Plan your revision blocks and mock exams with our intelligent scheduler.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-1">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="aspect-video bg-gray-100 rounded-[2.5rem] border-4 border-gray-50 shadow-2xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
              <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-red-200 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                Exam Prep Demo Coming Soon
              </p>
              <p className="text-sm text-gray-500 max-w-[200px]">
                Secure your first-class future.
              </p>
            </div>
          </div>

          <RelatedGuides currentSlug="exam-prep" />
        </section>
      </main>
    </div>
  );
}
