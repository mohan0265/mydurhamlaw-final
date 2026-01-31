import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import { LexiconRotatingBanner } from "@/components/lexicon/LexiconRotatingBanner";

export default function CasewayLexiconArticle() {
  return (
    <div className="bg-white dark:bg-[#0B1412] min-h-screen flex flex-col transition-colors duration-500">
      <Head>
        <title>CASEWAY Lexicon™ | Mastering Legal Language | Caseway</title>
        <meta
          name="description"
          content="Master the difficult legal terminology with CASEWAY Lexicon™. Learn why attending live lectures is essential for legal training."
        />
        <meta
          name="keywords"
          content="legal lexicon, law terminology, courtroom language, legal education, Durham Law, Caseway"
        />
        <link
          rel="canonical"
          href="https://www.casewaylaw.ai/articles/caseway-lexicon"
        />
      </Head>

      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-[#123733] dark:text-[#D5BF76] font-black mb-8 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guides Hub
          </Link>

          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5BF76]/20 text-[#D5BF76] text-[10px] font-black uppercase tracking-widest border border-[#D5BF76]/30 mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              <span>CASEWAY ORIGINAL</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              Mastering Legal Language: <br />
              The CASEWAY <span className="text-[#D5BF76]">Lexicon™</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-teal-100/70 leading-relaxed mb-12 font-medium">
              Legal education is, in many ways, the process of learning a new
              language. The CASEWAY Lexicon™ is designed to ensure you don't
              just read the law, but speak it with total authority.
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">
              Why Language is the Lawyer's Primary Tool
            </h2>

            <p className="text-lg leading-relaxed mb-8">
              In the courtroom, clarity is power. A single misunderstood term
              can change the outcome of a case. For law students, the sheer
              volume of Latinate terms, archaic phrasing, and precise technical
              meanings can be the greatest barrier to top marks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D5BF76]" />
                  Interactive Mastery
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've isolated the most difficult legal terminology from your
                  specific curriculum into an interactive, memory-optimized
                  glossary.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  Contextual Learning
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Terms aren't just defined; they are explained in the context
                  of your lectures, making them easier to recall in exams.
                </p>
              </div>
            </div>

            {/* NEW: INTERACTIVE WIDGET SHOWCASE */}
            <div className="my-16 not-prose">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                  Interactive Reinforcement
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                  Experience the tool designed for your cross-page mastery.
                  Hover over a term to see its meaning, and click for Durmah's
                  deep-dive context.
                </p>
              </div>
              <LexiconRotatingBanner mode="public" className="shadow-2xl" />
            </div>

            {/* ETHICAL SECTION */}
            <div className="not-prose my-16 p-8 md:p-12 bg-[#123733] rounded-[2.5rem] border border-[#D5BF76]/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D5BF76]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-[#D5BF76] mb-6">
                  <Shield className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Academic Ethics & Professionalism
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white mb-8 tracking-tight">
                  The Importance of the Live Lecture
                </h2>

                <div className="space-y-6 text-teal-50/90 text-lg leading-relaxed">
                  <p>
                    While the CASEWAY Lexicon™ provides the building blocks of
                    legal language, it is essential to understand that **this
                    tool is a companion, not a replacement.**
                  </p>

                  <p>
                    Attending live lectures is a fundamental part of your legal
                    training. Sitting in a crowded lecture hall, surrounded by
                    hundreds of your peers, is a shared intellectual experience
                    that cannot be replicated behind a computer screen.
                  </p>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                    <p className="font-bold text-white uppercase tracking-wider text-xs">
                      Why Attendance Matters:
                    </p>
                    <ul className="list-disc pl-5 space-y-3 text-sm">
                      <li>
                        **Real-World Focus**: Learning to pay attention in a
                        distracted, crowded environment is an essential skill
                        for the courtroom.
                      </li>
                      <li>
                        **Professional Stamina**: Lawyers must be presence-led.
                        Attending lectures builds the physical and mental
                        stamina required for professional life.
                      </li>
                      <li>
                        **Nuance & Rhythm**: Hearing a professor deliver a
                        lecture provides insights into the "rhythm" and "nuance"
                        of legal debate that text alone cannot capture.
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm italic text-[#D5BF76]/80 pt-4">
                    "The courtroom is not a sterile, silent room. It is a live
                    environment. Every lecture you attend is a step toward
                    mastering that environment."
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">
              How to Use the Lexicon Effectively
            </h2>

            <p className="mb-8 font-medium">
              We recommend using the Lexicon to **reinforce** what you heard in
              the lecture hall. If a term flew by you during a session, the
              Lexicon is your recovery tool—ensuring you don't stay confused for
              long.
            </p>

            <ul className="list-none p-0 space-y-4 mb-12">
              <li className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Pre-Read Terminology:
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Scan relevant Lexicon terms before a lecture to prime your
                    brain for faster comprehension.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Post-Lecture Clarification:
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Use the search function immediately after a lecture to lock
                    in any terms that felt "fuzzy."
                  </p>
                </div>
              </li>
            </ul>

            <div className="py-12 border-t border-gray-100 dark:border-white/5">
              <Link href="/articles/syllabus-shield" className="group block">
                <div className="flex items-center justify-between p-8 rounded-3xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-[#D5BF76]/20">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D5BF76] mb-2 block">
                      Next Guide
                    </span>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-[#D5BF76] transition-colors">
                      SyllabusShield™: No Content Left Behind
                    </h4>
                  </div>
                  <ArrowRight className="w-8 h-8 text-gray-300 group-hover:text-[#D5BF76] transition-all transform group-hover:translate-x-2" />
                </div>
              </Link>
            </div>
          </div>

          <RelatedGuides
            currentSlug="caseway-lexicon"
            categories={["Productivity", "Ethics"]}
            pinnedSlugs={["no-question-is-a-stupid-question"]}
          />

          {/* CTA Block */}
          <div className="mt-20 p-8 md:p-12 bg-gradient-to-br from-[#123733] to-[#0B1412] rounded-[2.5rem] border border-[#D5BF76]/20 text-center text-white shadow-2xl">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Step Into the <span className="text-[#D5BF76]">Lexicon</span>
            </h2>
            <p className="text-lg text-teal-100/60 mb-8 max-w-2xl mx-auto font-medium">
              Start mastering the language of the law today. Accessible in your
              student dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/study/glossary">
                <Button className="bg-[#D5BF76] text-[#123733] hover:brightness-110 px-8 py-6 text-lg w-full sm:w-auto font-black rounded-2xl shadow-lg border-none">
                  Open Lexicon Hub
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto font-black rounded-2xl backdrop-blur-sm"
                >
                  Student Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
