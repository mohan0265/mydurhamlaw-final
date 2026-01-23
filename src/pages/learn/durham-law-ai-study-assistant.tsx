import React from 'react';
import LearnLayout from '@/components/layout/LearnLayout';
import { generateArticleSEO, generateFAQSchema, generateArticleSchema } from '@/lib/seo';
import Link from 'next/link';
import { Brain, CheckCircle, AlertTriangle, BookOpen, Zap, Users } from 'lucide-react';

const seo = generateArticleSEO({
  title: 'How to Use AI as a Durham Law Study Assistant (Responsibly)',
  description: 'Learn how Durham Law students can ethically and effectively use AI tools like ChatGPT and MyDurhamLaw to understand concepts, practice application, and strengthen academic integrity.',
  slug: 'durham-law-ai-study-assistant',
  keywords: 'Durham Law, AI study tools, ChatGPT for law students, academic integrity, legal education AI, Durham University'
});

const faqs = [
  {
    question: 'Is it allowed to use AI tools like ChatGPT for Durham Law coursework?',
    answer: 'Yes, but with strict boundaries. Durham University and most law schools permit AI for understanding concepts, generating practice questions, and exploring ideas—but not for generating content you submit as your own. Always check your module handbook and cite AI use when required.'
  },
  {
    question: 'How can AI help me understand complex legal concepts without doing the work for me?',
    answer: 'Use AI to explain concepts in simpler terms, provide examples, or break down cases step-by-step. Ask it to quiz you, not to write your essays. The key is using AI as a study partner that helps you learn, not as a shortcut that bypasses learning.'
  },
  {
    question: 'What\'s the difference between asking AI to "explain" vs "write" answers?',
    answer: 'Asking AI to explain helps you understand - it\'s like asking a tutor "why does this work?" Asking AI to write answers for you is academic misconduct. The former builds knowledge; the latter bypasses it. Always keep control of your final written work.'
  },
  {
    question: 'Can I use AI-generated practice questions for exam prep?',
    answer: 'Absolutely. Generating practice prompts, hypothetical scenarios, or issue-spotting exercises is one of the most ethical and effective uses of AI. Just ensure the questions relate to what you\'ve actually studied in lectures and readings.'
  },
  {
    question: 'Does using MyDurhamLaw count as AI assistance I need to declare?',
    answer: 'It depends on how you use it. If you use it to understand concepts, organize notes, or practice - that\'s typically like using a textbook (no declaration needed). If a tool generates text you incorporate into submitted work, check your module\'s AI policy. When in doubt, ask your supervisor or lecturer.'
  }
];

export default function DurhamLawAIStudyAssistant() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: 'How to Use AI as a Durham Law Study Assistant (Responsibly)',
            description: seo.description,
            datePublished: '2026-01-23',
            dateModified: '2026-01-23'
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
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  How to Use AI as a Durham Law Study Assistant (Responsibly)
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Practical guidance for Durham Law students on using AI tools ethically and effectively—without compromising academic integrity.
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    13 min read
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Academic Integrity
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Study Techniques
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="not-prose mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Contents
            </h2>
            <nav className="space-y-1 text-sm">
              <a href="#why-ai-matters" className="block text-blue-600 hover:text-blue-700 hover:underline">
                1. Why AI matters for Durham Law students
              </a>
              <a href="#ethical-boundaries" className="block text-blue-600 hover:text-blue-700 hover:underline">
                2. Understanding the ethical boundaries
              </a>
              <a href="#good-uses" className="block text-blue-600 hover:text-blue-700 hover:underline">
                3. Good uses of AI for legal study
              </a>
              <a href="#bad-uses" className="block text-blue-600 hover:text-blue-700 hover:underline">
                4. Uses that cross the line
              </a>
              <a href="#practical-workflow" className="block text-blue-600 hover:text-blue-700 hover:underline">
                5. A practical AI study workflow
              </a>
              <a href="#durham-policies" className="block text-blue-600 hover:text-blue-700 hover:underline">
                6. Durham's AI policies (what you need to know)
              </a>
              <a href="#faqs" className="block text-blue-600 hover:text-blue-700 hover:underline">
                7. FAQs
              </a>
            </nav>
          </div>

          {/* Why AI Matters */}
          <h2 id="why-ai-matters">Why AI matters for Durham Law students</h2>
          
          <p>
            You're studying law at Durham at a moment when AI tools—ChatGPT, Claude, Gemini, specialized legal AI—are everywhere. Some of your peers are using them. Some lecturers are cautious. Some assignments explicitly forbid AI; others are silent on the issue.
          </p>

          <p>
            The reality: <strong>AI can be a transformative study tool if used ethically</strong>. It can help you understand <em>Donoghue v Stevenson</em> faster, generate practice exam questions, or clarify the difference between <em>ratio decidendi</em> and <em>obiter dicta</em>. But if misused—if you treat it as a ghostwriter rather than a tutor—it undermines your learning and violates Durham's academic integrity standards.
          </p>

          <p>
            This guide is about finding the line: how to harness AI's power to study smarter, think deeper, and retain more—<em>without</em> outsourcing the intellectual work that makes you a better lawyer.
          </p>

          {/* Ethical Boundaries */}
          <h2 id="ethical-boundaries">Understanding the ethical boundaries</h2>

          <p>
            Durham University's approach to AI is evolving, but the core principle remains: <strong>you must understand and control the work you submit</strong>. If you can't explain how you reached a conclusion, or if AI wrote substantial sections of your essay, that's a problem.
          </p>

          <div className="not-prose my-6 p-6 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">The fundamental rule</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>AI can help you learn.</strong> AI cannot learn <em>for</em> you. You may use AI to understand concepts, practice application, and explore ideas—but the work you submit must be yours. If you submit AI-generated text as your own analysis, that's academic misconduct.
                </p>
              </div>
            </div>
          </div>

          <p>
            Think of AI as a study partner who can explain things, quiz you, and suggest approaches—but who never writes your final draft. The moment you copy-paste AI output into your coursework without substantial transformation and understanding, you've crossed the line.
          </p>

          {/* Good Uses */}
          <h2 id="good-uses">Good uses of AI for legal study</h2>

          <p>
            Here are effective, ethical ways Durham Law students use AI:
          </p>

          <h3>1. Concept Clarification</h3>
          <p>
            <strong>Example prompt:</strong> "Explain the difference between direct and indirect discrimination under the Equality Act 2010, using a simple example."
          </p>
          <p>
            This is like asking a tutor for clarification. You're not asking AI to write your essay—you're asking it to help you understand a concept you'll then apply independently.
          </p>

          <h3>2. Case Summaries and Breakdowns</h3>
          <p>
            <strong>Example prompt:</strong> "Summarize the facts, ratio, and significance of <em>R v Brown [1994]</em> in 200 words."
          </p>
          <p>
            AI can provide a quick overview before you read the full case yourself. <em>Critical:</em> always verify AI's summary against the actual judgment. AI can hallucinate case details.
          </p>

          <h3>3. Practice Question Generation</h3>
          <p>
            <strong>Example prompt:</strong> "Generate 3 problem questions on the duty of care in negligence, suitable for a Durham Year 1 Tort Law student."
          </p>
          <p>
            This is one of the <strong>best</strong> uses. You're using AI to create hypotheticals you'll solve yourself, reinforcing active recall and application.
          </p>

          <h3>4. Essay Structure Suggestions</h3>
          <p>
            <strong>Example prompt:</strong> "What are the main arguments for and against strict liability in tort law? Give me an outline, not full paragraphs."
          </p>
          <p>
            AI can suggest a logical structure or competing perspectives. You then research, evaluate, and write independently. The structure is a scaffold; the analysis is yours.
          </p>

          <h3>5. Checking Understanding</h3>
          <p>
            <strong>Example prompt:</strong> "I think consideration in contract law means both parties must provide something of value. Is that correct? If not, where am I going wrong?"
          </p>
          <p>
            Using AI as a sounding board for self-checks is powerful. You explain your understanding; AI corrects misconceptions. This is active learning.
          </p>

          {/* Bad Uses */}
          <h2 id="bad-uses">Uses that cross the line</h2>

          <div className="not-prose my-6 p-6 border-l-4 border-red-500 bg-red-50 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Academic misconduct examples</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>❌ Asking AI to write your essay introduction, then submitting it</li>
                  <li>❌ Using AI to draft full paragraphs of analysis you paste into coursework</li>
                  <li>❌ Generating an entire problem answer and submitting it as your work</li>
                  <li>❌ Using AI to paraphrase a textbook without proper citation</li>
                  <li>❌ Relying on AI-generated case law without verifying it exists (AI hallucinates!)</li>
                </ul>
              </div>
            </div>
          </div>

          <p>
            <strong>Why these cross the line:</strong> In each case, AI is doing the intellectual heavy lifting—synthesis, analysis, application—that you need to develop to become a competent lawyer. If you don't do that work yourself, you won't retain the skill.
          </p>

          <p>
            Moreover, Durham's plagiarism detection is sophisticated. Turnitin and similar tools can flag AI-generated text. Even if undetected, submitting AI work is dishonest and stunts your professional development.
          </p>

          {/* Practical Workflow */}
          <h2 id="practical-workflow">A practical AI study workflow</h2>

          <p>
            Here's a step-by-step approach to using AI ethically for a Durham Law assignment:
          </p>

          <div className="not-prose my-6">
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Read the assignment brief carefully</h4>
                  <p className="text-gray-600 text-sm">Identify what you're asked to do. Note any AI-use restrictions in the module handbook.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Use AI to clarify any concepts you don't understand</h4>
                  <p className="text-gray-600 text-sm">Before diving into research, ensure you grasp the basics. Ask AI for explanations, not answers.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Research independently</h4>
                  <p className="text-gray-600 text-sm">Read cases, statutes, textbooks, articles. Take notes in your own words. AI can suggest sources, but you do the reading.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Ask AI for structure suggestions (optional)</h4>
                  <p className="text-gray-600 text-sm">Get a high-level outline of arguments. Don't ask for full paragraphs.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Write your draft yourself</h4>
                  <p className="text-gray-600 text-sm">This is non-negotiable. Every sentence in your submitted work must be your own synthesis and analysis.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  6
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Use AI for feedback (with caution)</h4>
                  <p className="text-gray-600 text-sm">You can ask AI, "Does my argument about <em>Carlill</em> make logical sense?" But don't ask it to rewrite your work.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  7
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Cite AI use if required</h4>
                  <p className="text-gray-600 text-sm">If your module requires AI transparency, add a note: "I used ChatGPT to clarify X concept" or similar.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Durham Policies */}
          <h2 id="durham-policies">Durham's AI policies (what you need to know)</h2>

          <p>
            As of 2024–25, Durham University is developing clearer AI guidance, but the default position is:
          </p>

          <ul>
            <li><strong>Module-specific rules vary</strong>. Some modules explicitly permit AI for brainstorming; others forbid it entirely. Always check your module handbook.</li>
            <li><strong>When in doubt, ask</strong>. If a module is silent on AI, email your module convenor. Better to clarify now than face misconduct proceedings later.</li>
            <li><strong>Transparency is key</strong>. If you use AI and submit work, consider adding a brief note explaining how you used it (if allowed). Honesty protects you.</li>
            <li><strong>AI detection is real</strong>. Turnitin and other tools flag AI-generated text patterns. Durham uses these tools actively.</li>
          </ul>

          <p>
            <strong>Bottom line:</strong> Durham values intellectual honesty. Using AI to shortcut learning is both detected and penalized. Using AI to <em>enhance</em> learning—by understanding concepts better or practising more—is often acceptable and even encouraged.
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
                <span><strong>AI as tutor, not ghostwriter:</strong> Use AI to understand, not to generate work you submit.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Best uses:</strong> Concept clarification, practice questions, checking understanding, structure brainstorming.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Forbidden uses:</strong> Generating text you submit, paraphrasing without citation, relying on unverified case law.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Always check module rules:</strong> Policies vary. When in doubt, ask your lecturer.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Academic integrity matters:</strong> Learning the hard way builds competence. Shortcuts undermine your future career.</span>
              </li>
            </ul>
          </div>

          {/* Related Guides */}
          <div className="not-prose my-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Related Guides
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/learn/durham-law-academic-integrity-ai" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">Academic Integrity & AI Guidelines</h4>
                <p className="text-sm text-gray-600">Detailed Durham policies and citation practices</p>
              </Link>
              <Link href="/learn/how-to-ask-better-legal-questions" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">How to Ask Better Legal Questions</h4>
                <p className="text-sm text-gray-600">Improve your prompts for better AI responses</p>
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
          <div className="not-prose my-12 p-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-3">Ready to study smarter with AI?</h3>
            <p className="text-purple-100 mb-6">
              MyDurhamLaw helps you use AI ethically and effectively—with built-in safeguards for academic integrity.
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
