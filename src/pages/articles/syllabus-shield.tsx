import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Target,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";

export default function SyllabusShieldArticle() {
  return (
    <div className="bg-white dark:bg-[#0B1412] min-h-screen flex flex-col transition-colors duration-500">
      <Head>
        <title>SyllabusShield™ | Total Content Coverage | Caseway</title>
        <meta
          name="description"
          content="Never miss a lecture concept again. Learn how SyllabusShield™ helps you digest your curriculum while reinforcing the value of attendance."
        />
        <meta
          name="keywords"
          content="syllabus shield, law student productivity, lecture digestion, Durham Law curriculum, exam readiness"
        />
        <link
          rel="canonical"
          href="https://www.casewaylaw.ai/articles/syllabus-shield"
        />
      </Head>

      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-[#0f766e] dark:text-teal-400 font-black mb-8 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guides Hub
          </Link>

          <div className="prose prose-teal dark:prose-invert max-w-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest border border-teal-200 dark:border-teal-800 mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>CHAMPION FEATURE</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              Syllabus
              <span className="text-purple-600 dark:text-purple-400">
                Shield™
              </span>
              : <br />
              No Content Left Behind
            </h1>

            <p className="text-xl text-gray-600 dark:text-teal-100/70 leading-relaxed mb-12 font-medium">
              The volume of a Law syllabus is legendary. SyllabusShield™ is your
              proactive defense against the "content creep" that causes
              end-of-term panic.
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">
              The Architecture of Exam Readiness
            </h2>

            <p className="text-lg leading-relaxed mb-8">
              Success in Law isn't just about hard work; it's about
              **coverage**. If you miss a single core concept in a module like
              Tort or Contract, entire essay questions can become inaccessible.
              SyllabusShield™ tracks your progress across every lecture,
              ensuring you bridge every gap.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <Target className="w-5 h-5" />
                  Coverage Tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visual indicators of your "Syllabus Readiness" based on
                  lecture digestion and concept mastery.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <FileCheck className="w-5 h-5" />
                  Lecture Digestion
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload your notes, links, or audio to have SyllabusShield™
                  extract the core legal principles for your revision.
                </p>
              </div>
            </div>

            {/* ETHICAL SECTION */}
            <div className="not-prose my-16 p-8 md:p-12 bg-gradient-to-br from-[#0f766e] to-[#134e4a] rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-teal-200 mb-6">
                  <Shield className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Academic Integrity & Growth
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white mb-8 tracking-tight">
                  Recovery is Not Replacement
                </h2>

                <div className="space-y-6 text-teal-50/90 text-lg leading-relaxed">
                  <p>
                    SyllabusShield™ is designed to catch you if you fall—not to
                    encourage you to stay home. **Attending actual lectures is a
                    non-negotiable part of your development as a future
                    lawyer.**
                  </p>

                  <p>
                    Law isn't just about facts; it's about presence. Sitting in
                    a lecture hall and paying attention for an hour in a
                    crowded, sometimes distracted environment is exactly what
                    you will be required to do in a professional courtroom.
                  </p>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                    <p className="font-bold text-white uppercase tracking-wider text-xs">
                      The Ethics of Attendance:
                    </p>
                    <ul className="list-disc pl-5 space-y-3 text-sm">
                      <li>
                        **Professional Discipline**: Showing up when you're
                        tired, distracted, or unmotivated builds the character
                        required for the Bar.
                      </li>
                      <li>
                        **Collective Intelligence**: Listening to how others
                        react to a concept helps you understand its real-world
                        impact.
                      </li>
                      <li>
                        **Sensory Memory**: The specific environment of the
                        lecture hall helps anchor concepts in your memory in a
                        way that isolated learning cannot.
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm italic text-teal-200/80 pt-4">
                    "A lawyer who cannot focus in a busy room cannot win in a
                    busy court. Use SyllabusShield™ to reinforce your knowledge,
                    but never use it as an excuse to miss the experience of the
                    hall."
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-6">
              Empowering Students in Difficulty
            </h2>

            <p className="mb-8">
              We know that sometimes life happens. Sickness, personal
              emergencies, or mental health days are real. SyllabusShield™
              ensures that if you **happen** to miss a session for legitimate
              reasons, you aren't permanently disadvantaged.
            </p>

            <div className="space-y-4 mb-12">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span className="font-bold">Bridging the Gap:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Digest missed content quickly so you can rejoin the cohort at
                  speed.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span className="font-bold">Exam Insurance:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Confirm you've covered 100% of the examinable syllabus before
                  finals.
                </span>
              </div>
            </div>

            <div className="py-12 border-t border-gray-100 dark:border-white/5">
              <Link href="/articles/caseway-lexicon" className="group block">
                <div className="flex items-center justify-between p-8 rounded-3xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-teal-500/20">
                  <ArrowLeft className="w-8 h-8 text-gray-300 group-hover:text-teal-600 transition-all transform group-hover:-translate-x-2" />
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-2 block">
                      Previous Guide
                    </span>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
                      Mastering Legal Language: The Lexicon™
                    </h4>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <RelatedGuides
            currentSlug="syllabus-shield"
            categories={["Productivity", "Ethics"]}
            pinnedSlugs={["no-question-is-a-stupid-question"]}
          />

          {/* CTA Block */}
          <div className="mt-20 p-8 md:p-12 bg-gradient-to-br from-[#0f766e] to-[#0B1412] rounded-[2.5rem] border border-teal-500/20 text-center text-white shadow-2xl">
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Activate Your <span className="text-teal-400">Shield</span>
            </h2>
            <p className="text-lg text-teal-100/60 mb-8 max-w-2xl mx-auto font-medium">
              Take control of your syllabus. Ensure no lecture is left behind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/study/lectures">
                <Button className="bg-teal-500 text-white hover:bg-teal-600 px-8 py-6 text-lg w-full sm:w-auto font-black rounded-2xl shadow-lg border-none">
                  Go to My Lectures
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
