import React from "react";
import LearnLayout from "@/components/layout/LearnLayout";
import {
  generateArticleSEO,
  generateFAQSchema,
  generateArticleSchema,
} from "@/lib/seo";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  MessageSquare,
  Brain,
} from "lucide-react";
import GuideCallout from "@/components/seo/GuideCallout";

const seo = generateArticleSEO({
  title: "Speak Law: Mastering Oral Legal Reasoning - MyDurhamLaw",
  description:
    "Legal mastery is more than writing. Learn how to build oral reasoning, seminar confidence, and viva skills step-by-step.",
  slug: "speak-law",
  keywords:
    "legal speaking, oral reasoning, Durham Law tutorials, legal confidence, mooting, viva",
});

export default function SpeakLawPillar() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: "Speak Law: Mastering Oral Legal Reasoning",
            description: seo.description,
            datePublished: "2026-01-27",
            dateModified: "2026-01-27",
          }),
        }}
      />

      <LearnLayout
        title={seo.title}
        description={seo.description}
        slug="speak-law"
        category={["Speaking"]}
        pinnedSlugs={["quiz-me", "durmah-voice-demo"]}
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-indigo-950 to-indigo-900 rounded-3xl text-white shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Users className="w-8 h-8 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                  Speak Law
                </h1>
                <p className="text-xl text-indigo-100 mb-0 opacity-80">
                  The third pillar of legal mastery: Oral Reasoning.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xl font-medium text-gray-700 leading-relaxed italic border-l-4 border-indigo-200 pl-6 my-10">
            "Legal expertise is visible in what you write, but it is proven in
            what you say. If you cannot explain the law orally under pressure,
            you do not yet truly own the knowledge."
          </p>

          <h2>Why Speaking Matters at Durham</h2>
          <p>
            The Durham Law experience is built around the Tutorial. Unlike
            lectures, tutorials are interactive, demanding, and require you to
            formulate legal arguments in real-time. Many students excel in
            written work but feel "imposter syndrome" when asked to contribute
            to discussions.
          </p>

          <p>
            <strong>Speak Law</strong> is our framework for bridging that gap.
            It isn't about being 'loud' — it's about being <em>precise</em>.
          </p>

          <GuideCallout
            title="Put Speak Law into action"
            body="Use Quiz Me for rapid oral prompts, then switch to Durmah Voice when you want full answers and coaching."
            ctaText="Start with Quiz Me"
            ctaHref="/articles/quiz-me"
            secondaryText="Try the Voice demo"
            secondaryHref="/demo/durmah-voice"
            icon={Brain}
            variant="purple"
          />

          <h2>The 3 Layers of Oral Mastery</h2>

          <h3>1. The Vocabulary of Law</h3>
          <p>
            Before you can argue a case, you must be comfortable with the
            terminology. Using <em>'obiter'</em>, <em>'ratio'</em>, or{" "}
            <em>'estoppel'</em> should feel as natural as everyday conversation.
            This comes from repetition.
          </p>

          <h3>2. Structuring on the Fly</h3>
          <p>
            Effective legal speaking follows a structured path. Even in a quick
            seminar response, you should be able to state the rule, apply the
            case, and reach a mini-conclusion (IRAC) within 30 seconds.
          </p>

          <h3>3. Handling Challenge</h3>
          <p>
            A tutorial leader's job is to test your logic. Speak Law teaches you
            to view a challenge not as a failure, but as a prompt to refine your
            reasoning. Confidence is knowing you have a method to handle the
            unknown.
          </p>

          <div className="not-prose my-12 p-8 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
              The Speaking Checklist
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  Can I state the material facts of this case without notes?
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  Can I define the three elements of this test out loud?
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                <span>
                  Can I articulate the policy reason behind this decision?
                </span>
              </li>
            </ul>
          </div>

          <h2>From Silently Reading to Speaking Law</h2>
          <p>
            The transition is easiest when done in private. Tools like{" "}
            <strong>Durmah Voice</strong> and <strong>Quiz Me</strong> provide a
            safe laboratory to fail, refine, and eventually master the oral
            reasoning required for a First Class degree.
          </p>
        </article>
      </LearnLayout>
    </>
  );
}
