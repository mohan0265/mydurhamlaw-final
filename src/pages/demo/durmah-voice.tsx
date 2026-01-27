import React from "react";
import Head from "next/head";
import Link from "next/link";
import { DemoPlayer } from "@/components/demos/DemoPlayer";
import { DEMO_VIDEOS } from "@/content/demoVideos";
import { Mic, ArrowRight, Play, Shield, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import GuideCallout from "@/components/seo/GuideCallout";
import { Users } from "lucide-react";

export default function DurmahVoiceDemo() {
  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Durmah Voice Assistant - Public Demo | MyDurhamLaw</title>
        <meta
          name="description"
          content="Experience Durmah, the AI legal eagle buddy. Instant, judgement-free answers to your law school questions."
        />
        <link
          rel="canonical"
          href="https://mydurhamlaw.com/demo/durmah-voice"
        />
      </Head>

      <main>
        {/* HERO */}
        <section className="py-20 bg-gray-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/30">
              <Mic className="w-3.5 h-3.5" />
              Feature Demo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Durmah <span className="text-indigo-400">Voice</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Your 24/7 legal eagle buddy. Ask anything, get instant
              clarification, and build your legal reasoning without the fear of
              judgement.
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-24 max-w-5xl mx-auto px-6">
          <GuideCallout
            title="Voice practice works best with structure"
            body="Speak Law is the pillar behind this: how to build oral legal reasoning step-by-step. Then use Quiz Me to drill it."
            ctaText="Read: Speak Law"
            ctaHref="/speak-law"
            secondaryText="Go to Quiz Me guide"
            secondaryHref="/articles/quiz-me"
            icon={Users}
            variant="orange"
          />

          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                What you get
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    title: "Judgement-Free Support",
                    desc: 'Ask "basic" questions as many times as you need. Durmah never gets tired.',
                  },
                  {
                    title: "Legal Reasoning Buddy",
                    desc: "Talk through complex doctrines and get instant feedback on your application.",
                  },
                  {
                    title: "Always Ready",
                    desc: "Available instantly via voice or text, whenever confusion strikes.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
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

            <DemoPlayer
              video={DEMO_VIDEOS.durmah_voice}
              trigger={
                <div className="aspect-video bg-gray-100 rounded-[2.5rem] border-4 border-gray-50 shadow-2xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden group cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                  <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    Watch Durmah in Action
                  </p>
                  <p className="text-sm text-gray-500 max-w-[200px]">
                    Experience the voice of law.
                  </p>
                </div>
              }
            />
          </div>

          <div className="bg-indigo-50 rounded-[3rem] p-12 md:p-16 border border-indigo-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center text-balance">
              The Engine of "Speak Law"
            </h2>
            <div className="grid sm:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Oral Articulation",
                  desc: "Law is a spoken profession. Durmah forces you to verbalise your arguments, checking for clarity and precision.",
                },
                {
                  step: "02",
                  title: "Socratic Method",
                  desc: "Durmah doesn't just give answers. It asks follow-up questions to probe your understanding of the ratio decidendi.",
                },
                {
                  step: "03",
                  title: "Syllabus Grounding",
                  desc: "Every response is cross-referenced with your specific lecture transcripts, not generic internet law.",
                },
              ].map((step, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-4xl font-black text-indigo-200">
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
            <div className="relative z-10 px-6">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter text-balance">
                Ready to talk to Durmah?
              </h2>
              <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto opacity-80">
                Join our premium community and get your own personal AI legal
                mentor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/eligibility?next=/signup&plan=free"
                  prefetch={false}
                >
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-10 py-5 text-xl font-bold rounded-2xl shadow-xl shadow-indigo-900/40">
                    Start Free Trial <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing" prefetch={false}>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-10 py-5 text-xl font-bold rounded-2xl backdrop-blur-sm"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <RelatedGuides
            currentSlug="durmah-voice-demo"
            pinnedSlugs={["speak-law", "quiz-me"]}
          />
        </section>
      </main>
    </div>
  );
}
