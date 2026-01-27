import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Brain, ArrowRight, Play, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import RelatedGuides from "@/components/seo/RelatedGuides";
import GuideCallout from "@/components/seo/GuideCallout";
import { Mic, Users } from "lucide-react";

export default function QuizMeDemo() {
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
              Feature Demo
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
              Quiz <span className="text-orange-400">Me</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Information alone isn't knowledge. Turn your readings into
              retrieval practice and never forget a key ratio again.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-5xl mx-auto px-6">
          <GuideCallout
            title="Master the theory before the drill"
            body="Active recall is powerful, but only if you have the framework. Read our full guide on why this works, then try it with Durmah Voice."
            ctaText="Read Quiz Me Guide"
            ctaHref="/articles/quiz-me"
            secondaryText="Try Durmah Voice"
            secondaryHref="/demo/durmah-voice"
            icon={Mic}
            variant="purple"
          />

          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                What you get
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    title: "Dynamic Active Recall",
                    desc: "Durmah generates personalized quizzes from your module materials to test your memory.",
                  },
                  {
                    title: "Syllabus Aligned",
                    desc: "Every question is grounded in your actual course content, not generic law.",
                  },
                  {
                    title: "Instant Feedback",
                    desc: "Get corrected immediately with links to the relevant cases and statues.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-1">
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
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
              <div className="w-20 h-20 rounded-full bg-orange-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-orange-200 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                Quiz Demo Coming Soon
              </p>
              <p className="text-sm text-gray-500 max-w-[200px]">
                Unlock the power of your memory.
              </p>
            </div>
          </div>

          <RelatedGuides currentSlug="quiz-me-demo" />
        </section>
      </main>
    </div>
  );
}
