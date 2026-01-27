import React from "react";
import LearnLayout from "@/components/layout/LearnLayout";
import {
  generateArticleSEO,
  generateFAQSchema,
  generateArticleSchema,
} from "@/lib/seo";
import Link from "next/link";
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Zap,
  Users,
} from "lucide-react";

const seo = generateArticleSEO({
  title: "How to Ask Better Legal Questions - Durham Law Guide",
  description:
    "Master the art of framing precise legal questions for tutorials, Durmah, and research. The 4-layer questioning framework for Durham Law students.",
  slug: "how-to-ask-better-legal-questions",
  keywords:
    "legal reasoning, Durham Law tutorials, Socratic method, legal questions, critical thinking, law school study skills",
});

const faqs = [
  {
    question: "How detailed should my legal questions be?",
    answer:
      "Include enough context for the answerer to understand your existing knowledge. For Durmah, mention: (1) your module, (2) the specific topic, (3) what you already understand.",
  },
  {
    question: "Can AI answer all my legal questions?",
    answer:
      "AI excels at explaining doctrines, comparing cases, and suggesting structures. It cannot replace reading primary sources (cases, statutes) or forming your own critical arguments.",
  },
  {
    question: "Should I prepare questions before using Durmah?",
    answer:
      "Yes. Write 3-5 questions based on your reading, then use Durmah to explore them. This beats aimless chat mode studying.",
  },
];

export default function HowToAskBetterLegalQuestions() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: "How to Ask Better Legal Questions - Durham Law Guide",
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
        category={["Speaking"]}
        slug="how-to-ask-better-legal-questions"
        pinnedSlugs={["no-question-is-a-stupid-question"]}
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl border border-orange-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-600 rounded-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  How to Ask Better Legal Questions
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  The 4-layer questioning framework for Durham Law tutorials,
                  Durmah, and research
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    8 min read
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Study Skills
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="not-prose mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              Contents
            </h2>
            <nav className="space-y-1 text-sm">
              <a
                href="#why-questions-matter"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                1. Why question quality matters
              </a>
              <a
                href="#four-layer-framework"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                2. The 4-layer question framework
              </a>
              <a
                href="#durham-strategies"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                3. Durham-specific strategies
              </a>
              <a
                href="#faqs"
                className="block text-orange-600 hover:text-orange-700 hover:underline"
              >
                4. FAQs
              </a>
            </nav>
          </div>

          {/* Why Questions Matter */}
          <h2 id="why-questions-matter">
            Why Question Quality Matters in Legal Study
          </h2>

          <p>
            Asking the right legal question is often more important than finding
            the right answer. Whether you are in a tutorial, consulting Durmah,
            or researching case law, the quality of your question determines the
            quality of insights you gain.
          </p>

          <p>
            Legal education at Durham is not about memorizing rules - it is
            about learning to think like a lawyer. That means:
          </p>

          <ul>
            <li>
              <strong>Precision over vagueness</strong>: "What is contract law?"
              vs "How does Carlill v Carbolic Smoke Ball Co establish the postal
              acceptance rule?"
            </li>
            <li>
              <strong>Context over abstraction</strong>: "Is this case
              important?" vs "How does this case distinguish intention from
              motive in criminal law?"
            </li>
            <li>
              <strong>Analysis over facts</strong>: "What happened in Donoghue v
              Stevenson?" vs "Why did the House of Lords expand duty of care
              beyond contractual relationships?"
            </li>
          </ul>

          {/* 4-Layer Framework */}
          <h2 id="four-layer-framework">The 4-Layer Question Framework</h2>

          <h3>Layer 1: Factual Clarification</h3>
          <p>
            <strong>Purpose</strong>: Ensure you understand what happened.
          </p>
          <p>
            <strong>Examples</strong>:
          </p>
          <ul>
            <li>"What were the material facts in R v Jogee?"</li>
            <li>"What remedy did the claimant seek?"</li>
          </ul>
          <p>
            <strong>When to use</strong>: First read of a case, statute, or
            problem question.
          </p>

          <h3>Layer 2: Legal Principle Identification</h3>
          <p>
            <strong>Purpose</strong>: Identify the rule or doctrine at play.
          </p>
          <p>
            <strong>Examples</strong>:
          </p>
          <ul>
            <li>"What legal test did the court apply?"</li>
            <li>"Which precedent governed this decision?"</li>
          </ul>
          <p>
            <strong>When to use</strong>: After understanding facts, before
            analyzing application.
          </p>

          <h3>Layer 3: Analytical Reasoning</h3>
          <p>
            <strong>Purpose</strong>: Understand why the law works this way.
          </p>
          <p>
            <strong>Examples</strong>:
          </p>
          <ul>
            <li>
              "Why did the court distinguish this case from the precedent?"
            </li>
            <li>"What policy rationale underpins this rule?"</li>
          </ul>
          <p>
            <strong>When to use</strong>: Tutorial prep, essay planning, exam
            revision.
          </p>
          <p>
            <strong>Best for Durmah</strong>: This is where AI assistance shines
            - exploring rationales and connections.
          </p>

          <h3>Layer 4: Critical Evaluation</h3>
          <p>
            <strong>Purpose</strong>: Form your own argument.
          </p>
          <p>
            <strong>Examples</strong>:
          </p>
          <ul>
            <li>
              "Is the current test for remoteness of damage in tort
              satisfactory?"
            </li>
            <li>"Should Parliament intervene to clarify this area?"</li>
          </ul>
          <p>
            <strong>When to use</strong>: Essay writing, seminar discussions.
          </p>
          <p>
            <strong>Integrity note</strong>: Frame questions that prompt
            analysis, not answers. Ask "How could I structure an argument
            that..." not "Write my essay on..."
          </p>

          {/* Contextual Callout */}
          <div className="not-prose my-12 p-8 bg-orange-50 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  If you hesitate to ask…
                </h3>
                <p className="text-gray-600 mb-6">
                  Many students don’t ask because they fear sounding ‘stupid’.
                  That fear silently blocks learning — and it’s more common than
                  you think.
                </p>
                <Link
                  href="/articles/no-question-is-a-stupid-question"
                  prefetch={false}
                >
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-100">
                    Read: No Question Is a Stupid Question{" "}
                    <Zap className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <div className="hidden md:block p-4 bg-white rounded-2xl shadow-sm border border-orange-50">
                <Users className="w-12 h-12 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Durham Strategies */}
          <h2 id="durham-strategies">Durham-Specific Question Strategies</h2>

          <h3>In Tutorials</h3>
          <p>Durham\'s tutorial system thrives on dialogue. Use:</p>
          <p>
            <strong>Pre-Tutorial</strong>: "Here is my interpretation of
            [case/statute]. Am I missing something?"
          </p>
          <p>
            <strong>During Tutorial</strong>: "Could you help me understand why
            the court rejected the claimant\'s argument?"
          </p>

          <h3>When Using Durmah</h3>
          <p>Durmah works best with:</p>
          <ol>
            <li>
              <strong>Contextual preamble</strong>: "I am writing on breach of
              duty in negligence. In Bolton v Stone, why did the court find no
              breach despite foreseeable harm?"
            </li>
            <li>
              <strong>Specific scope</strong>: Instead of "Explain negligence,"
              ask "What is the difference between breach and causation in
              negligence claims?"
            </li>
            <li>
              <strong>Iterative follow-ups</strong>: "Can you give an example
              where that reasoning failed?"
            </li>
          </ol>

          <h3>The "So What?" Test</h3>
          <p>Before asking any question, apply the "So What?" test:</p>
          <p>
            <strong>Question</strong>: "What was held in Raffles v Wichelhaus?"
          </p>
          <p>
            <strong>So What?</strong>: Why does mistake of identity matter for
            contract formation?
          </p>
          <p>
            If you cannot answer "So What?", refine your question to dig deeper.
          </p>

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
                  <strong>Layer your questions</strong>: Move from factual to
                  doctrinal to analytical to critical
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Be specific</strong>: "How does X apply in Y context?"
                  beats "Explain X"
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Use "why" liberally</strong>: Surface legal reasoning,
                  not just rules
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Test with "So What?"</strong>: Ensure every question
                  serves your learning goals
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
          <div className="not-prose my-12 p-8 bg-gradient-to-br from-purple-600 to-orange-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-3">
              Ready to ask smarter legal questions?
            </h3>
            <p className="text-purple-100 mb-6">
              Durmah is trained on Durham Law modules and Socratic dialogue
              techniques.
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
