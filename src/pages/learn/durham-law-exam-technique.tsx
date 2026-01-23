import React from 'react';
import LearnLayout from '@/components/layout/LearnLayout';
import { generateArticleSEO, generateFAQSchema, generateArticleSchema } from '@/lib/seo';
import Link from 'next/link';
import { Zap, CheckCircle, AlertTriangle, BookOpen, Users, Target } from 'lucide-react';

const seo = generateArticleSEO({
  title: 'Durham Law Exam Technique - First-Class Strategy Guide',
  description: 'Master Durham Law exams with IRAC method for problem questions, essay structuring, time management, and ethical AI revision strategies.',
  slug: 'durham-law-exam-technique',
  keywords: 'Durham Law exams, IRAC method, legal problem questions, essay technique, exam strategy, law school study, exam stress'
});

const faqs = [
  {
    question: 'How many past papers should I do before exams?',
    answer: 'Aim for 3-5 full practice papers per module under timed conditions. Supplement with individual question practice for weaker topics.'
  },
  {
    question: 'Should I memorize case facts or just principles?',
    answer: 'Memorize leading case facts (e.g., Donoghue\'s ginger beer bottle) because they make application clearer. For secondary cases, principles suffice.'
  },
  {
    question: 'Can I use abbreviations in exams to save time?',
    answer: 'Yes, if defined. Write "hereinafter C" after first mention of "Claimant." Avoid text-speak.'
  }
];

export default function DurhamLawExamTechnique() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: 'Durham Law Exam Technique - First-Class Strategy Guide',
            description: seo.description,
            datePublished: '2026-01-24',
            dateModified: '2026-01-24'
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateFAQSchema(faqs) }}
      />

      <LearnLayout
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonical}
      >
        <article className="prose prose-lg max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-600 rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Durham Law Exam Technique
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  IRAC method, essay structuring, time management, and ethical AI exam prep
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    11 min read
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Exam Prep
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="not-prose mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Contents
            </h2>
            <nav className="space-y-1 text-sm">
              <a href="#irac-method" className="block text-purple-600 hover:text-purple-700 hover:underline">
                1. The IRAC method for problem questions
              </a>
              <a href="#essay-strategy" className="block text-purple-600 hover:text-purple-700 hover:underline">
                2. Essay exam strategy
              </a>
              <a href="#time-management" className="block text-purple-600 hover:text-purple-700 hover:underline">
                3. Time management under exam conditions
              </a>
              <a href="#revision-strategies" className="block text-purple-600 hover:text-purple-700 hover:underline">
                4. Revision strategies that work
              </a>
              <a href="#faqs" className="block text-purple-600 hover:text-purple-700 hover:underline">
                5. FAQs
              </a>
            </nav>
          </div>

          {/* IRAC Method */}
          <h2 id="irac-method">The IRAC Method for Problem Questions</h2>
          
          <p>
            <strong>IRAC = Issue, Rule, Application, Conclusion</strong>
          </p>

          <h3>Step 1: Issue Identification</h3>
          <p><strong>Example</strong>: "Does Anna have a valid claim in negligence against Beta Ltd?"</p>
          <p><strong>Sub-issues to spot</strong>:</p>
          <ul>
            <li>Duty of care (Caparo test)</li>
            <li>Breach (Bolam/Bolitho)</li>
            <li>Causation (but-for + remoteness)</li>
          </ul>

          <h3>Step 2: Rule Statement</h3>
          <p><strong>Example</strong>: "Duty of care is established where: (1) harm is reasonably foreseeable, (2) there is proximity, and (3) it is fair, just, and reasonable to impose a duty (Caparo v Dickman [1990])."</p>
          <p><strong>Marking tip</strong>: Name the case. "The Caparo test" scores lower than citing it properly.</p>

          <h3>Step 3: Application to Facts</h3>
          <p><strong>Example</strong>: "Harm was foreseeable because Beta Ltd knew the pavement was icy (similar to Haley v London Electricity Board [1965], where a hole in the pavement created foreseeable risk)."</p>
          <p><strong>Technique</strong>: Use "because" and "similar to" to connect law and facts explicitly.</p>

          <h3>Step 4: Conclusion</h3>
          <p><strong>Example</strong>: "Therefore, a duty of care likely exists, subject to the court\'s view on whether it is fair, just, and reasonable."</p>
          <p><strong>Why qualifiers matter</strong>: Law is rarely black-and-white. "Likely" or "arguably" shows mature legal reasoning.</p>

          {/* Essay Strategy */}
          <h2 id="essay-strategy">Essay Exam Strategy: The 4-Paragraph Power Structure</h2>

          <h3>Para 1: Introduction (10% of time)</h3>
          <ul>
            <li>Restate the question</li>
            <li>State your thesis (your answer to "discuss" or "to what extent")</li>
            <li>Signpost your structure</li>
          </ul>

          <h3>Para 2-4: Body (75% of time)</h3>
          <p>Each paragraph = one point supporting your thesis. Structure per paragraph:</p>
          <ol>
            <li><strong>Topic sentence</strong>: State your point</li>
            <li><strong>Authority</strong>: Case/statute/academic view</li>
            <li><strong>Analysis</strong>: Why this matters</li>
            <li><strong>Counter-argument</strong> (optional but shows critical thinking)</li>
            <li><strong>Link</strong>: Connect back to thesis</li>
          </ol>

          <h3>Para 5: Conclusion (15% of time)</h3>
          <ul>
            <li>Summarize your argument (do not introduce new points)</li>
            <li>Directly answer the question</li>
          </ul>

          {/* Time Management */}
          <h2 id="time-management">Time Management Under Exam Conditions</h2>

          <h3>For a 2-hour exam with 2 questions (1 problem, 1 essay):</h3>

          <div className="not-prose my-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <ul className="space-y-1 text-sm text-gray-700">
              <li><strong>Minute 0-5</strong>: Read all questions, choose your two</li>
              <li><strong>Minute 5-10</strong>: Plan problem question (IRAC outline)</li>
              <li><strong>Minute 10-55</strong>: Write problem question (45 min)</li>
              <li><strong>Minute 55-60</strong>: Plan essay (5 min outline)</li>
              <li><strong>Minute 60-110</strong>: Write essay (50 min)</li>
              <li><strong>Minute 110-120</strong>: Proofread both answers</li>
            </ul>
          </div>

          <p><strong>Why planning matters</strong>: 5 minutes planning saves 15 minutes rewriting a muddled answer.</p>

          {/* Revision Strategies */}
          <h2 id="revision-strategies">Revision Strategies That Actually Work for Exams</h2>

          <h3>Active Recall &gt; Passive Re-Reading</h3>
          <p><strong>Ineffective</strong>: Reading cases for the 5th time</p>
          <p><strong>Effective</strong>: Closing your book and writing out the ratio from memory</p>
          <p><strong>Tool</strong>: Durmah can quiz you: "Test me on the elements of negligence"</p>

          <h3>Practice Past Papers Under Exam Conditions</h3>
          <ul>
            <li>Set a timer (same as real exam)</li>
            <li>No notes (unless open-book)</li>
            <li>Write full answers (not just plans)</li>
          </ul>
          <p><strong>Durham-specific tip</strong>: Past papers are on DUO. Aim for 3-5 per module.</p>

          <h3>Dealing with Exam Stress: The 5-4-3-2-1 Grounding Method</h3>
          <p>When panic sets in:</p>
          <ul>
            <li><strong>5 things you see</strong> (e.g., "exam paper, desk, clock...")</li>
            <li><strong>4 things you hear</strong> (e.g., "pens writing, chair creaking...")</li>
            <li><strong>3 things you can touch</strong> (e.g., "desk surface, pen, paper...")</li>
            <li><strong>2 things you smell</strong></li>
            <li><strong>1 deep breath</strong></li>
          </ul>
          <p>This resets your nervous system in ~60 seconds.</p>

          {/* Key Takeaways */}
          <div className="not-prose my-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Problem questions</strong>: Use IRAC (Issue, Rule, Application, Conclusion)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Essays</strong>: Thesis-driven structure with clear signposting</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Time management</strong>: Plan first, write fast, proofread last</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Active revision</strong>: Practice past papers, test recall, create visual aids</span>
              </li>
            </ul>
          </div>

          {/* Related Guides */}
          <div className="not-prose my-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Related Guides
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/learn/durham-law-ai-study-assistant" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">Durham Law AI Study Assistant</h4>
                <p className="text-sm text-gray-600">Use Durmah for active recall quizzes</p>
              </Link>
              <Link href="/learn/how-to-ask-better-legal-questions" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">How to Ask Better Legal Questions</h4>
                <p className="text-sm text-gray-600">Frame better analytical questions in essay exams</p>
              </Link>
            </div>
          </div>

          {/* FAQs */}
          <h2 id="faqs">Frequently Asked Questions</h2>

          <div className="not-prose space-y-4 my-6">
            {faqs.map((faq, index) => (
              <details key={index} className="group p-4 bg-gray-50 rounded-lg border border-gray-200">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <Zap className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>

          {/* CTA */}
          <div className="not-prose my-12 p-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-3">Ace Your Next Durham Law Exam</h3>
            <p className="text-purple-100 mb-6">
              MyDurhamLaw\'s Durmah helps you master case law and build exam confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition">
                See Plans & Pricing
              </Link>
              <Link href="/signup" className="inline-block px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 transition border border-purple-400">
                Start Free Trial
              </Link>
            </div>
          </div>
        </article>
      </LearnLayout>
    </>
  );
}
