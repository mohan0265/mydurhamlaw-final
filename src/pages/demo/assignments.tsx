import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Play,
  Zap,
  CheckCircle,
  FileText,
  Search,
  PenTool,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import { DemoPlayer } from "@/components/demos/DemoPlayer";
import { DEMO_VIDEOS } from "@/content/demoVideos";

export default function AssignmentsDemo() {
  const [showPlan, setShowPlan] = React.useState(false);
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Assignment Support - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Master legal assignments with MyDurhamLaw. From issue spotting to final polish, our AI guides you through every stage."
        />
        <link rel="canonical" href="https://casewaylaw.ai/demo/assignments" />
      </Head>

      <main>
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-6 border border-purple-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              Strategic Support
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Legal <span className="text-purple-400">Mastery</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium text-balance">
              The gap between a 2:1 and a First isn&apos;t just
              knowledge—it&apos;s structure. Our Assignment Hub guides you
              through the rigorous IRAC method with syllabus-grounded precision.
            </p>
          </div>
        </section>

        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Issue Spotting", icon: <Search className="w-4 h-4" /> },
              { label: "IRAC Structure", icon: <Layout className="w-4 h-4" /> },
              {
                label: "Case Retrieval",
                icon: <BookOpen className="w-4 h-4" />,
              },
              {
                label: "Critical Polish",
                icon: <PenTool className="w-4 h-4" />,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-[10px]"
              >
                <span className="text-purple-500">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start mb-32">
            <div className="sticky top-12">
              <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">
                The 4-Stage <br />
                <span className="text-purple-600 italic">
                  Success Workflow.
                </span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                We don&apos;t write your essays. We teach you how to think like
                a barrister. Every assignment is broken down into a logical
                progression that builds your legal voice.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "1. The Briefing Phase",
                    desc: "Upload your question. Durmah identifies initial issues and suggests the core legal tests required.",
                    icon: <FileText className="w-5 h-5 text-purple-600" />,
                  },
                  {
                    title: "2. The IRAC Blueprint",
                    desc: "Construct a robust skeleton using Issue, Rule, Application, and Conclusion. No more structure-less drifts.",
                    icon: <Zap className="w-5 h-5 text-purple-600" />,
                  },
                  {
                    title: "3. Syllabic Grounding",
                    desc: "Validate your arguments against your actual Durham module recordings and reading lists.",
                    icon: <CheckCircle className="w-5 h-5 text-purple-600" />,
                  },
                  {
                    title: "4. Analytical Critique",
                    desc: "Upload a paragraph. Get professor-level feedback on your use of 'critical analysis' vs 'descriptive writing'.",
                    icon: <Lightbulb className="w-5 h-5 text-purple-600" />,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-purple-100 transition-colors group"
                  >
                    {i === 3 && ( // Only render the input for the 4th item (index 3)
                      <input
                        type="text"
                        data-demo="input-assignment-title"
                        placeholder="e.g. Tort Law: Negligence Essay"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all mb-4"
                      />
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
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
                  </div>
                ))}
              </div>
            </div>

            <div className="relative pt-12">
              <div className="absolute inset-0 bg-purple-500 blur-[120px] opacity-10 rounded-full"></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 sticky top-24 overflow-hidden group">
                <DemoPlayer
                  video={DEMO_VIDEOS.assignments}
                  trigger={
                    <div className="aspect-[3/4] bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-purple-100 group-hover:scale-110 transition">
                        <Play className="w-8 h-8 ml-1 fill-current" />
                      </div>
                      <p className="text-xl font-black text-gray-900 mb-2">
                        Build a First-Class Plan
                      </p>
                      <p className="text-sm text-gray-400">
                        Watch Durmah guide a student through a complex Tort Law
                        problem scenario.
                      </p>
                    </div>
                  }
                />

                <div className="mt-8 space-y-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-purple-500 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Analytical Feedback Score</span>
                    <span className="text-purple-600">Improving...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="py-24 bg-purple-900 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
            <div className="relative z-10 px-6 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter text-balance">
                Write with high-performance{" "}
                <span className="italic text-purple-300 underline decoration-purple-400/30">
                  clarity.
                </span>
                <button
                  data-demo="btn-generate-plan"
                  onClick={() => setShowPlan(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
                >
                  Generate Plan
                </button>
                {showPlan && (
                  <div className="mt-8 p-6 bg-indigo-900/10 rounded-xl border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                      <Zap className="w-4 h-4" /> AI Analysis Ready
                    </div>
                    <p className="text-lg text-white font-medium">
                      Structure generated: 4 Issues Identified.
                    </p>
                  </div>
                )}
              </h2>
              <p className="text-xl text-purple-100 mb-12 opacity-80 leading-relaxed font-medium">
                Ditch the late-night stress. Move from orignial brief to
                submission-ready draft with a systematic, AI-powered mentor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto bg-white text-purple-900 hover:bg-white/90 px-12 py-8 text-xl font-bold rounded-2xl shadow-xl shadow-purple-950/20 transition-all flex items-center justify-center gap-3">
                    Open Your Hub <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <RelatedGuides currentSlug="assignments" />
        </section>
      </main>
    </div>
  );
}

const Layout = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);
