import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Calendar,
  ArrowRight,
  Play,
  Shield,
  Zap,
  Heart,
  BookOpen,
  Layout,
  Focus,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import { DemoPlayer } from "@/components/demos/DemoPlayer";
import { DEMO_VIDEOS } from "@/content/demoVideos";

export default function YAAGDemo() {
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Year at a Glance (YAAG) - Public Demo | Caseway</title>
        <meta
          name="description"
          content="Preview the Caseway academic calendar. Michaelmas, Epiphany, and Easter terms mapped out with your specific modules."
        />
        <link
          rel="canonical"
          href="https://casewaylaw.ai/demo/year-at-a-glance"
        />
      </Head>

      <main>
        {/* HERO */}
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/30">
              <Layout className="w-3.5 h-3.5" />
              Strategic Overview
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              The <span className="text-blue-400">Vertical</span> Spine
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Law isn&apos;t just about what you&apos;re doing today. It&apos;s
              about where you&apos;re going over three terms. YAAG gives you the
              bird&apos;s-eye view of your entire Durham year.
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-24 max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">
                Three Terms, <br />
                <span className="text-blue-600 italic">One Vision.</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Most students get overwhelmed because they only see the next
                deadline. YAAG flips the script, showing you the clusters and
                term breaks before they happen.
              </p>
              <ul className="grid gap-6">
                {[
                  {
                    title: "Michaelmas Momentum",
                    desc: "Track your first module introductions and early formative assessments.",
                    icon: <Activity className="w-5 h-5" />,
                  },
                  {
                    title: "Epiphany Expansion",
                    desc: "Visualise the transition into deep research and secondary reading peaks.",
                    icon: <BookOpen className="w-5 h-5" />,
                  },
                  {
                    title: "Easter Finality",
                    desc: "The critical revision countdown. See exactly how many days remain until finals.",
                    icon: <Focus className="w-5 h-5" />,
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10 rounded-full"></div>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-4 md:p-8 relative z-10 overflow-hidden group">
                <DemoPlayer
                  video={DEMO_VIDEOS.yaag}
                  trigger={
                    <div className="aspect-[4/5] bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-blue-100 group-hover:scale-110 transition">
                        <Play className="w-8 h-8 ml-1 fill-current" />
                      </div>
                      <p className="text-lg font-black text-gray-900 mb-2">
                        Interactive Preview
                      </p>
                      <p className="text-sm text-gray-400">
                        Watch how YAAG adapts to your module choices in
                        real-time.
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white rounded-[3rem] p-12 md:p-16 border border-blue-100 mb-32">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">
                How YAAG Scales with You
              </h2>
              <p className="text-gray-600 font-medium">
                Your needs change as you progress. YAAG understands the
                different rhythms of each level.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  year: "Foundation / Y1",
                  title: "Discovery Mode",
                  desc: "Focused on module identification and weekly routine building.",
                },
                {
                  year: "Year 2",
                  title: "Research Depth",
                  desc: "Highlighting coursework clusters and long-term project milestones.",
                },
                {
                  year: "Year 3",
                  title: "Selection & Finale",
                  desc: "Prioritising dissertation stages and final assessment countdowns.",
                },
              ].map((lvl, i) => (
                <div
                  key={i}
                  data-demo={`select-year-${i}`}
                  onClick={() => setSelectedYear(i)}
                  className={`p-8 rounded-3xl border shadow-sm transition-all cursor-pointer ${
                    selectedYear === i
                      ? "bg-blue-600 border-blue-600 text-white shadow-xl scale-105"
                      : "bg-white border-blue-100 hover:shadow-md text-gray-900"
                  }`}
                >
                  <div
                    className={`text-xs font-black uppercase tracking-widest mb-4 ${selectedYear === i ? "text-blue-100" : "text-blue-600"}`}
                  >
                    {lvl.year}
                  </div>
                  <h4
                    className={`font-bold text-xl mb-3 ${selectedYear === i ? "text-white" : "text-gray-900"}`}
                  >
                    {lvl.title}
                  </h4>
                  <p
                    className={`text-sm leading-relaxed ${selectedYear === i ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {lvl.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="py-20 bg-gray-950 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-900/10"></div>
            <div className="relative z-10 px-6 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter italic">
                Get the clarity <br /> you deserve.
              </h2>
              <p className="text-xl text-blue-200/80 mb-10 leading-relaxed">
                Connect your Blackboard calendar today and see your entire year
                rendered in high-definition strategy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 px-10 py-8 text-xl font-bold rounded-2xl shadow-xl shadow-blue-950 transition-all flex items-center justify-center gap-3">
                    Start Your Path <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <RelatedGuides currentSlug="year-at-a-glance" />
        </section>
      </main>
    </div>
  );
}
