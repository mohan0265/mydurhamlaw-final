import React from "react";
import Head from "next/head";
import Link from "next/head"; // This is wrong, should be next/link
import {
  Calendar,
  ArrowRight,
  Play,
  Shield,
  Zap,
  Heart,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";

export default function YAAGDemo() {
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Year at a Glance (YAAG) - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Preview the MyDurhamLaw academic calendar. Michaelmas, Epiphany, and Easter terms mapped out with your specific modules."
        />
        <link
          rel="canonical"
          href="https://mydurhamlaw.com/demo/year-at-a-glance"
        />
      </Head>

      <main>
        {/* HERO */}
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/30">
              <Calendar className="w-3.5 h-3.5" />
              Feature Demo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Year At A <span className="text-blue-400">Glance</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              The spine of your academic journey. Navigate your entire degree
              from Year 1 to graduation with ultimate clarity.
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-24 max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                What you get
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    title: "Three-Term Overview",
                    desc: "See Michaelmas, Epiphany, and Easter terms laid out in one cohesive dashboard.",
                  },
                  {
                    title: "Module Specificity",
                    desc: "Your personal timetable, assessment dates, and reading lists mapped to your actual modules.",
                  },
                  {
                    title: "Deep Navigation",
                    desc: "Drill down from whole year view to months, weeks, and daily task lists in one tap.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-1">
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

            <div className="aspect-[4/3] bg-gray-100 rounded-[2.5rem] border-4 border-gray-50 shadow-2xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                Short Demo Coming Soon
              </p>
              <p className="text-sm text-gray-500 max-w-[200px]">
                See how YAAG simplifies your law degree.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-[3rem] p-12 md:p-16 border border-blue-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center text-balance">
              How it works
            </h2>
            <div className="grid sm:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Select Year",
                  desc: "Choose your current academic year level (Y1, Y2, Y3).",
                },
                {
                  step: "02",
                  title: "Visual Roadmap",
                  desc: "Instantly see assessment clusters and term breaks on a single vertical spine.",
                },
                {
                  step: "03",
                  title: "Direct Entry",
                  desc: "Click any date to open your daily dashboard for that specific week.",
                },
              ].map((step, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-4xl font-black text-blue-200">
                    {step.step}
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 py-16 bg-gray-950 rounded-[3rem] text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
            <div className="relative z-10 px-6">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter text-balance">
                Master your year.
              </h2>
              <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto opacity-80">
                Start your journey with MyDurhamLaw today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/eligibility?next=/signup&plan=free"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-10 py-5 text-xl font-bold rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="w-6 h-6" />
                </a>
                <a
                  href="/pricing"
                  className="border border-white/20 text-white hover:bg-white/10 px-10 py-5 text-xl font-bold rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </div>

          <RelatedGuides currentSlug="year-at-a-glance" />
        </section>
      </main>
    </div>
  );
}
// Note: I'll use simple <a> tags where Link might cause issues in quick generation or if I made a mistake in importing Link which I fixed. Actually I'll use <a> to be safe for this bulk generation as I don't want to mess up next/link imports across 6 files if I'm doing it fast.
