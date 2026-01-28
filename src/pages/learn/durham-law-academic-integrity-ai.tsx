import React from "react";
import LearnLayout from "@/components/layout/LearnLayout";
import {
  generateArticleSEO,
  generateFAQSchema,
  generateArticleSchema,
} from "@/lib/seo";
import Link from "next/link";
import NextImage from "next/image";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Zap,
  Users,
  XCircle,
} from "lucide-react";

const seo = generateArticleSEO({
  title: "Durham Law Academic Integrity & AI Use - Complete Guide",
  description:
    "Understand Durham University's AI policy for law students. Learn what's permitted, prohibited, and how to use Durmah ethically and compliantly.",
  slug: "durham-law-academic-integrity-ai",
  keywords:
    "Durham Law academic integrity, AI ethics, legal education AI, academic misconduct, plagiarism, Durham University policy",
});

const faqs = [
  {
    question: "Is using Durmah considered cheating?",
    answer:
      "No, if used ethically. Durmah is a study tool like textbooks or tutors. Cheating occurs when you submit AI-generated work as your own without acknowledgment.",
  },
  {
    question: "Do I need to cite Durmah in every essay?",
    answer:
      "Only if Durmah's assistance influenced the structure, arguments, or analysis you submitted. Background study and revision do not require citation.",
  },
  {
    question: "Can Durham detect undisclosed AI use?",
    answer:
      "Yes. Turnitin and other tools flag AI-generated text. More importantly, inconsistencies between your written work and verbal explanations raise red flags.",
  },
];

export default function DurhamLawAcademicIntegrityAI() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: "Durham Law Academic Integrity & AI Use - Complete Guide",
            description: seo.description,
            datePublished: "2026-01-24",
            dateModified: "2026-01-24",
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
        category={["Ethics"]}
        slug="durham-law-academic-integrity-ai"
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-100">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-green-200 shrink-0">
                <NextImage
                  src="/images/demo-thumbnails/assignments.png"
                  alt="Academic Integrity and Writing"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Durham Law Academic Integrity & AI Use
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Understand Durham\'s AI policy - what\'s permitted,
                  prohibited, and how to stay compliant
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    10 min read
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Ethics
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="not-prose mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Contents
            </h2>
            <nav className="space-y-1 text-sm">
              <a
                href="#durham-policy"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                1. Durham\'s academic integrity policy
              </a>
              <a
                href="#green-zone"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                2. Green zone: Always permitted
              </a>
              <a
                href="#red-zone"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                3. Red zone: Never permitted
              </a>
              <a
                href="#best-practices"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                4. Best practices
              </a>
              <a
                href="#faqs"
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                5. FAQs
              </a>
            </nav>
          </div>

          {/* Durham Policy */}
          <h2 id="durham-policy">
            Durham\'s Academic Integrity Policy: The Essentials
          </h2>

          <p>
            Durham University\'s policy on academic misconduct applies to all AI
            tool use. Key principles:
          </p>

          <ol>
            <li>
              <strong>Attribution</strong>: Any AI assistance must be
              acknowledged
            </li>
            <li>
              <strong>Originality</strong>: Submitted work must be your own
              analysis and argument
            </li>
            <li>
              <strong>Honesty</strong>: Misrepresenting AI-generated content as
              your own is plagiarism
            </li>
          </ol>

          {/* Green Zone */}
          <h2 id="green-zone">The Green Zone: Always Permitted</h2>

          <div className="not-prose my-6 p-6 border-l-4 border-green-500 bg-green-50 rounded-r-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Explanation & Clarification
                </h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>"Explain the postal rule in offer and acceptance"</li>
                  <li>
                    "What is the difference between murder and manslaughter?"
                  </li>
                </ul>
                <p className="text-gray-600 text-sm mt-2">
                  <strong>Why it is safe</strong>: You are using AI like a
                  textbook or tutorial - to deepen understanding.
                </p>
              </div>
            </div>
          </div>

          <h3>Case Summaries & Legal Research</h3>
          <p>
            <strong>Examples</strong>: "Summarize the key facts and holding in R
            v Jogee" or "Find cases on remoteness of damage in contract".
          </p>
          <p>
            <strong>Why it is safe</strong>: AI accelerates research, but you
            still analyze and cite primary sources yourself.
          </p>

          <h3>Structure & Planning</h3>
          <p>
            <strong>Examples</strong>: "How should I structure an essay on
            parliamentary sovereignty?" or "What are the main arguments for
            strict liability in torts?"
          </p>
          <p>
            <strong>Why it is safe</strong>: The final argument, analysis, and
            writing are yours. AI provides scaffolding, not substance.
          </p>

          {/* Red Zone */}
          <h2 id="red-zone">The Red Zone: Never Permitted</h2>

          <div className="not-prose my-6 p-6 border-l-4 border-red-500 bg-red-50 rounded-r-xl">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  Academic misconduct examples
                </h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>
                    ❌ Asking AI to write your essay introduction, then
                    submitting it
                  </li>
                  <li>
                    ❌ Using AI to draft full paragraphs of analysis you paste
                    into coursework
                  </li>
                  <li>
                    ❌ Generating an entire problem answer and submitting it as
                    your work
                  </li>
                  <li>
                    ❌ Using AI to paraphrase a textbook without proper citation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p>
            <strong>Why these cross the line</strong>: In each case, AI is doing
            the intellectual heavy lifting - synthesis, analysis, application -
            that you need to develop to become a competent lawyer.
          </p>

          <p>
            <strong>Detection</strong>: Durham\'s plagiarism detection is
            sophisticated. Turnitin and similar tools can flag AI-generated
            text. Even if undetected, submitting AI work is dishonest and stunts
            your professional development.
          </p>

          {/* Best Practices */}
          <h2 id="best-practices">Best Practices for Ethical AI Use</h2>

          <h3>1. The "Could I Explain This?" Test</h3>
          <p>
            After using AI, ask yourself:{" "}
            <em>
              "If my tutor asked me to explain this point verbally, could I do
              it confidently without referencing the AI output?"
            </em>
          </p>
          <p>
            If <strong>no</strong> - you have not learned it; you have
            outsourced it.
          </p>

          <h3>2. Document Your AI Use</h3>
          <p>Keep a study log for transparency:</p>
          <div className="not-prose my-4 p-4 bg-gray-100 rounded-lg border border-gray-200 font-mono text-sm">
            <p>Date: 15/01/2026</p>
            <p>Module: Contract Law</p>
            <p>AI Tool: Durmah</p>
            <p>
              Purpose: Clarified difference between void and voidable contracts
            </p>
            <p>Acknowledgment: Not required (no submission)</p>
          </div>

          <h3>3. When in Doubt, Over-Disclose</h3>
          <p>Example acknowledgments:</p>
          <ul>
            <li>
              <strong>Minor AI use</strong>: "Background research supported by
              Durmah AI assistant."
            </li>
            <li>
              <strong>Moderate AI use</strong>: "Essay structure brainstormed
              with AI support. All analysis and argument are my own."
            </li>
          </ul>

          <h3>4. How Caseway's Durmah Stays Compliant</h3>
          <p>
            Durmah is designed as a learning companion, not an essay generator:
          </p>
          <ul>
            <li>
              <strong>Socratic dialogue mode</strong>: Asks follow-up questions
              to deepen your thinking
            </li>
            <li>
              <strong>Integrity guardrails</strong>: Refuses direct "write my
              essay" requests
            </li>
            <li>
              <strong>Transparent audit trail</strong>: Saves conversation
              transcripts (with your permission)
            </li>
          </ul>

          {/* Key Takeaways */}
          <div className="not-prose my-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Durham\'s rule</strong>: AI can assist learning; it
                  cannot replace your thinking
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Green Zone</strong>: Explanation, research, planning -
                  always permitted
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Red Zone</strong>: Submitting AI-written content -
                  always misconduct
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>When unsure</strong>: Over-disclose or ask your tutor
                </span>
              </li>
            </ul>
          </div>

          {/* FAQs */}
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

          {/* CTA */}
          <div className="not-prose my-12 p-8 bg-gradient-to-br from-purple-600 to-green-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-3">
              Use AI with Confidence - and Integrity
            </h3>
            <p className="text-purple-100 mb-6">
              Caseway's mission is to support ethical, excellent legal
              education.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition"
              >
                See Plans & Pricing
              </Link>
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 transition border border-purple-400"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </article>
      </LearnLayout>
    </>
  );
}
