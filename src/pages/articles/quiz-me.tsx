import React from "react";
import LearnLayout from "@/components/layout/LearnLayout";
import {
  generateArticleSEO,
  generateFAQSchema,
  generateArticleSchema,
} from "@/lib/seo";
import Link from "next/link";
import {
  Brain,
  CheckCircle,
  Clock,
  BookOpen,
  Zap,
  MessageSquare,
} from "lucide-react";
import GuideCallout from "@/components/seo/GuideCallout";

const seo = generateArticleSEO({
  title: "Quiz Me: The Active Recall System - Durham Law Guide",
  description:
    "How to use oral prompts and spaced repetition to build long-term memory for legal doctrines and seminar confidence.",
  slug: "quiz-me",
  keywords:
    "active recall, legal study, law exams, spaced repetition, oral reasoning, Durham Law",
});

const faqs = [
  {
    question: "Why use oral quizzes instead of flashcards?",
    answer:
      "Oral recall forces you to articulate complex legal doctrines in full sentences, which is exactly what you need to do in seminars and exams. It builds muscle memory for legal language.",
  },
  {
    question: "How often should I use Quiz Me?",
    answer:
      "Frequency over duration. 15 minutes of intensive active recall every day is far more effective than an 8-hour library session without testing yourself.",
  },
];

export default function QuizMeGuide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: "Quiz Me: The Active Recall System - Durham Law Guide",
            description: seo.description,
            datePublished: "2026-01-27",
            dateModified: "2026-01-27",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateFAQSchema(faqs) }}
      />

      <LearnLayout
        title={seo.title}
        description={seo.description}
        slug="quiz-me"
        category={["Speaking", "Study Skills"]}
        pinnedSlugs={["durmah-voice-demo", "speak-law"]}
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white">
                <Brain className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Quiz Me: The Active Recall System
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Master legal doctrines through systematic oral testing and
                  retrieval.
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    9 min read
                  </span>
                </div>
              </div>
            </div>
          </div>

          <h2>Why Passive Reading is a Trap</h2>
          <p>
            Most law students spend 80% of their time reading and highlighting.
            This creates a "fluency illusion" — you feel like you know the
            material because you recognize it on the page, but your brain hasn't
            actually built the pathways to retrieve it when the page is empty.
          </p>

          <p>
            <strong>Active Recall</strong> flips the script. Instead of putting
            information <em>in</em>, you focus on pulling it <em>out</em>. This
            creates stronger, more resilient memory for exams.
          </p>

          <GuideCallout
            title="Want to practise out loud?"
            body="Turn Quiz Me into real speaking practice with Durmah Voice — structured, private, and pressure-free."
            ctaText="Try the Durmah Voice Demo"
            ctaHref="/demo/durmah-voice"
            secondaryText="Or read the Speak Law pillar"
            secondaryHref="/speak-law"
            icon={MessageSquare}
            variant="indigo"
          />

          <h2>The 3 Pillars of Effective Legal Quizzing</h2>

          <h3>1. Oral Articulation</h3>
          <p>
            Don't just think the answer; say it out loud. Legal reasoning is a
            performance. By speaking your answers, you identify exactly where
            your logic falters or where your vocabulary is thin.
          </p>

          <h3>2. Spaced Repetition</h3>
          <p>
            The "forgetting curve" is brutal. Quiz Me is designed to test you on
            a topic just as you are about to forget it, resetting the curve and
            moving knowledge into long-term storage.
          </p>

          <h3>3. Incremental Complexity</h3>
          <p>
            Start with basic definitions (Layer 1), then move to case
            application (Layer 2), and finally handle multi-issue legal problem
            questions (Layer 3).
          </p>

          <div className="not-prose my-12 p-8 bg-gray-50 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-600" />
              Pro Tip: The Viva Method
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Treat every Quiz Me session as a mini-viva. If you can't explain
              the ratio of <em>Rubenstein v HSBC</em> to your cat in 60 seconds,
              you don't know it well enough for the exam hall.
            </p>
          </div>

          <h2>How to use the Quiz Me Tool</h2>
          <ol>
            <li>Select your module and topic.</li>
            <li>Listen to the prompt provided by the AI.</li>
            <li>Respond out loud (or type if in the library).</li>
            <li>Compare your answer to the model analysis.</li>
            <li>Rate your confidence to set the next review date.</li>
          </ol>

          <h2 id="faqs">Frequently Asked Questions</h2>
          <div className="not-prose space-y-4 my-6">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <Zap className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </article>
      </LearnLayout>
    </>
  );
}
