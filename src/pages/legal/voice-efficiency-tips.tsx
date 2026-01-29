import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeft,
  Mic2,
  Clock,
  Target,
  MessageSquare,
  Zap,
  GraduationCap,
  Layout,
  Search,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function VoiceEfficiencyTips() {
  return (
    <>
      <Head>
        <title>Durmah Voice Efficiency Tips | Caseway</title>
        <meta
          name="description"
          content="Learn how to get maximum value from Durmah Voice in just 10 minutes with focused habits and smart tutor-style prompts."
        />
      </Head>

      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <Link
            href="/pricing"
            className="inline-flex items-center text-slate-600 hover:text-indigo-600 mb-8 font-bold transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Pricing
          </Link>

          {/* Article Header */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-200 overflow-hidden relative mb-12">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-16 -mt-16 pointer-events-none opacity-50" />

            <div className="relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 shadow-lg shadow-indigo-100">
                Study Habit
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                How to Get Maximum Value from Durmah Voice in 10 Minutes
              </h1>
              <p className="text-lg md:text-xl text-slate-600 font-bold leading-relaxed mb-4">
                Durmah Voice works best when you use it like a smart tutor
                session — focused, interactive, and time-boxed.
              </p>
              <p className="text-slate-500 font-medium">
                These quick habits help you learn faster and keep voice time
                efficient.
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 mb-16">
            {/* Section 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  1. Start with a 1-sentence goal
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest px-1">
                  Say this first:
                </p>
                <ul className="space-y-3">
                  {[
                    "Test me on consideration in Contract law.",
                    "Help me plan a 1,500-word essay structure for Tort — don’t write it for me.",
                    "Do a 10-minute seminar rehearsal on judicial review.",
                  ].map((prompt, i) => (
                    <li
                      key={i}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-700 italic flex gap-3"
                    >
                      <span className="text-indigo-400">“</span>
                      {prompt}
                      <span className="text-indigo-400">”</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why it works:
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    A clear goal makes Durmah ask the right questions and saves
                    time.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  2. Ask for 3 questions at a time (not 20)
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest px-1">
                  Best prompt:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-700 italic flex gap-3">
                  <span className="text-indigo-400">“</span>
                  Ask me 3 exam-style questions. After each answer, tell me
                  what’s missing and ask the next.
                  <span className="text-indigo-400">”</span>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why it works:
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    You get fast feedback loops and don’t waste time on long
                    monologues.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  3. Use “Stop me when I go wrong”
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest px-1">
                  Best prompt:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-700 italic flex gap-3">
                  <span className="text-indigo-400">“</span>
                  Stop me as soon as my reasoning goes off track, then help me
                  correct it.
                  <span className="text-indigo-400">”</span>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why it works:
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    This mimics a real tutor and builds exam-ready thinking.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                  <Layout className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  4. Speak in IRAC / structured steps
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest px-1">
                  Best prompt:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-700 italic flex gap-3">
                  <span className="text-indigo-400">“</span>
                  Make me answer in IRAC. If I skip a step, interrupt me.
                  <span className="text-indigo-400">”</span>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why it works:
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    You build reliable structure under pressure.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                  <Search className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  5. End every session with a summary + next drills
                </h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest px-1">
                  Best prompt:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-700 italic flex gap-3">
                  <span className="text-indigo-400">“</span>
                  Summarise my mistakes in 5 bullets, then give me 3 drills to
                  practise next.
                  <span className="text-indigo-400">”</span>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why it works:
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    You leave with action steps, not just conversation.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                <h3 className="text-xl font-black mb-6">
                  Voice is perfect for:
                </h3>
                <ul className="space-y-4 font-bold text-indigo-100">
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                    Seminar rehearsal
                  </li>
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                    Oral exams / confidence building
                  </li>
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                    Rapid clarification
                  </li>
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                    “Teach it back” learning
                  </li>
                </ul>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                <h3 className="text-xl font-black mb-6">Text is better for:</h3>
                <ul className="space-y-4 font-bold text-slate-400">
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    Long outlines
                  </li>
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    Citations & reading lists
                  </li>
                  <li className="flex items-start gap-2 italic">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    Multi-part structured notes
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Closing CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] p-10 md:p-14 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/assets/images/hero-supreme-court-uk.webp')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 tracking-tight">
                Want a simple routine?
              </h2>
              <p className="text-xl text-indigo-100 font-bold mb-10 leading-relaxed max-w-xl mx-auto italic">
                Try this weekly: 10 minutes voice → 3 exam questions → 5-bullet
                feedback → 3 drills.
              </p>
              <Link href="/quiz">
                <button className="bg-white text-indigo-950 font-black py-5 px-14 rounded-2xl text-xl hover:scale-105 transition-all shadow-2xl shadow-black/20 flex items-center gap-3 mx-auto group">
                  <span>Start a Quiz Me session</span>
                  <Mic2 className="w-6 h-6 text-indigo-600 group-hover:animate-pulse" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
