import React from "react";
import Head from "next/head";
import Link from "next/link";
import { DemoPlayer } from "@/components/demos/DemoPlayer";
import { DEMO_VIDEOS } from "@/content/demoVideos";
import {
  Brain,
  ArrowRight,
  Play,
  Zap,
  HelpCircle,
  Mic,
  Users,
  MessageSquare,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import GuideCallout from "@/components/seo/GuideCallout";

export default function QuizMeDemo() {
  const [activeDrill, setActiveDrill] = React.useState(0);
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Active Recall (Quiz Me) - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Test your legal knowledge with interactive active recall. Durmah quizzes you on your specific Durham Law modules."
        />
        <link rel="canonical" href="https://mydurhamlaw.com/demo/quiz-me" />
      </Head>

      <main>
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-widest mb-6 border border-orange-500/30">
              <Brain className="w-3.5 h-3.5" />
              Cognitive Science
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Active <span className="text-orange-400">Recall</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Don&apos;t just re-read. Re-construct. Our grounded reasoning
              engine quizzes you on the *logic* of the law, not just the names
              of cases.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-6xl mx-auto px-6">
          <div className="mb-24">
            <GuideCallout
              title="Master the theory before the drill"
              body="Active recall is powerful, but only if you have the framework. Read our full guide on why this works, then try it with Durmah Voice."
              ctaText="Read Quiz Me Guide"
              ctaHref="/articles/quiz-me"
              secondaryText="Try Durmah Voice"
              secondaryHref="/demo/durmah-voice"
              icon={Mic}
              variant="orange"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">
                Hallucination-Free <br />
                <span className="text-orange-600 italic">
                  Grounded Testing.
                </span>
              </h2>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                Most AI tools guess. Durmah knows your syllabus. Every question
                is generated from your actual Durham module recordings and
                readings, ensuring zero hallucinations.
              </p>

              <ul className="grid gap-6">
                {[
                  {
                    title: "The Feynman Session",
                    desc: "Durmah asks you to explain a legal doctrine (like Vicarious Liability) as if to a child, then critiques your accuracy.",
                    icon: <Users className="w-5 h-5" />,
                  },
                  {
                    title: "Speak Law (Voice Mode)",
                    desc: "Practice for your moots or oral presentations. Speak your answers and let Durmah analyze your legal terminology.",
                    icon: <Mic className="w-5 h-5" />,
                  },
                  {
                    title: "Ratio identification",
                    desc: "Drills focused specifically on identifying the core principles from cases mentioned in your lectures.",
                    icon: <Target className="w-5 h-5" />,
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    data-demo={`drill-option-${i}`}
                    onClick={() => setActiveDrill(i)}
                    className={`flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${activeDrill === i ? "bg-orange-100 border-orange-300 shadow-lg scale-[1.02]" : "bg-orange-50/50 border-orange-100 hover:bg-orange-100/50"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${activeDrill === i ? "bg-orange-600 text-white border-orange-600" : "bg-white text-orange-600 border-orange-100"}`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4
                        className={`font-bold ${activeDrill === i ? "text-orange-900" : "text-gray-900"}`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-[100px] opacity-10 rounded-full"></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative z-10 overflow-hidden group">
                <DemoPlayer
                  video={DEMO_VIDEOS.quiz_me}
                  trigger={
                    <div className="aspect-square bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="w-20 h-20 rounded-full bg-orange-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-orange-100 group-hover:scale-110 transition">
                        <Play className="w-8 h-8 ml-1 fill-current" />
                      </div>
                      <p className="text-xl font-black text-gray-900 mb-2">
                        Watch a Retrieval Session
                      </p>
                      <p className="text-sm text-gray-400">
                        See how Durmah pushes a student to refine their
                        explanation of Equity & Trusts.
                      </p>
                    </div>
                  }
                />

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-[10px] font-black"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Join 400+ Durham students drilling today
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="py-24 bg-gradient-to-br from-orange-600 to-red-600 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 px-6 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">
                Stop guessing. <br /> Start{" "}
                <span className="italic underline decoration-white/30">
                  knowing.
                </span>
              </h2>
              <p className="text-xl text-orange-50 mb-12 opacity-90 leading-relaxed">
                Durmah turns your syllabus into a high-intensity training
                ground. Master your modules before exams even appear on the
                horizon.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 px-12 py-8 text-xl font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3">
                    Start Drilling <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <RelatedGuides currentSlug="quiz-me-demo" />
        </section>
      </main>
    </div>
  );
}
