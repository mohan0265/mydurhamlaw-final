import React from "react";
import Head from "next/head";
import Link from "next/link";
import { DemoPlayer } from "@/components/demos/DemoPlayer";
import { DEMO_VIDEOS } from "@/content/demoVideos";
import { FileText, ArrowRight, Play, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";

export default function MyLecturesDemo() {
  const [activeWorkflow, setActiveWorkflow] = React.useState(0);
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>My Lectures & Notes - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Organize your law degree lectures and notes. Syllabus-aligned tracking for your Durham Law modules."
        />
        <link rel="canonical" href="https://casewaylaw.ai/demo/my-lectures" />
      </Head>

      <main>
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5" />
              Intelligence Demo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              The <span className="text-indigo-400">Lecture</span> Engine
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              We don&apos;t just store recordings. We transform audio into
              structured, exam-ready logic grounded in your Durham Law syllabus.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                The Student Workflow
              </h2>
              <ul className="space-y-8">
                {[
                  {
                    title: "1. Capture & Upload",
                    desc: "Upload any MP3, WAV, or M4A recording. Durmah instantly begins transcribing with legal-specialized vocabulary.",
                    icon: <FileText className="w-5 h-5" />,
                  },
                  {
                    title: "2. Narrative Summarization",
                    desc: "Notes aren't just lists. Durmah explains the *narrative* of the lecture, identifying why specific cases were mentioned.",
                    icon: <Zap className="w-5 h-5" />,
                  },
                  {
                    title: "3. Case & Statute Extraction",
                    desc: "Key references are automatically tagged and linked to your research hub for deep dives.",
                    icon: <Clock className="w-5 h-5" />,
                  },
                  {
                    title: "4. Direct-to-Quiz",
                    desc: "Once ready, click 'Quiz Me' to immediately test your memory of the legal doctrines just discussed.",
                    icon: <Play className="w-5 h-5" />,
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    data-demo={`lecture-step-${i}`}
                    onClick={() => setActiveWorkflow(i)}
                    className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all ${activeWorkflow === i ? "bg-indigo-50 border border-indigo-200 shadow-md" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-colors ${activeWorkflow === i ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h4
                        className={`font-bold transition-colors ${activeWorkflow === i ? "text-indigo-900" : "text-gray-900"}`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-200 blur-[80px] opacity-10 rounded-full"></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative z-10 overflow-hidden group">
                <DemoPlayer
                  video={DEMO_VIDEOS.lectures!}
                  trigger={
                    <div className="aspect-video bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition">
                        <Play className="w-6 h-6 ml-1 fill-current" />
                      </div>
                      <p className="text-sm font-black text-gray-900 mb-1">
                        Watch the Demo
                      </p>
                      <p className="text-xs text-gray-400">
                        45 seconds of My Lectures in action
                      </p>
                    </div>
                  }
                />

                <div className="mt-8 space-y-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-indigo-500 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Transcribing...</span>
                    <span>84%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-12 text-white mb-24 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-3xl font-bold mb-6 italic">
                “The smartest notes I never had to write.”
              </h3>
              <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                Durmah doesn&apos;t just copy what was said. It understands the
                context of the Durham Law syllabus, ensuring that your summaries
                focus on what actually gets examined.
              </p>
              <Link href="/signup">
                <Button className="bg-white text-indigo-900 hover:bg-white/90 font-black px-8 py-6 text-lg rounded-2xl">
                  Experience it now
                </Button>
              </Link>
            </div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <RelatedGuides currentSlug="my-lectures" />
        </section>
      </main>
    </div>
  );
}
