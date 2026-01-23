import React from 'react';
import LearnLayout from '@/components/layout/LearnLayout';
import { generateArticleSEO, generateFAQSchema, generateArticleSchema } from '@/lib/seo';
import Link from 'next/link';
import { Users, CheckCircle, AlertTriangle, BookOpen, Zap } from 'lucide-react';

const seo = generateArticleSEO({
  title: 'Durham Law Study Groups - Collaboration Guide',
  description: 'Build effective, compliant study groups for Durham Law. Learn optimal size, meeting structure, and ethical AI use for collaborative learning.',
  slug: 'durham-law-study-groups',
  keywords: 'law school study groups, Durham Law collaboration, peer learning, legal education, exam prep groups, academic integrity'
});

const faqs = [
  {
    question: 'How do I find study group members?',
    answer: 'Start with your college. Post on your year group\'s WhatsApp or Facebook page: "Looking for 2-3 students for a weekly Contract Law study group." Alternatively, ask in tutorials - someone nearby is likely interested.'
  },
  {
    question: 'How long should study group meetings last?',
    answer: '90-120 minutes. Shorter than 90 mins limits depth; longer than 2 hours causes fatigue and diminishing returns.'
  },
  {
    question: 'Can we use AI during study group meetings?',
    answer: 'Yes, for research, clarification, and exploration. But do not use AI to generate answers you then all submit individually - that is still plagiarism.'
  }
];

export default function DurhamLawStudyGroups() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: 'Durham Law Study Groups - Collaboration Guide',
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
          <div className="not-prose mb-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Durham Law Study Groups
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Build effective, integrity-compliant study groups with optimal structure and ethical AI use
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    9 min read
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-gray-200 text-gray-700">
                    Collaboration
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
              <a href="#why-study-groups" className="block text-blue-600 hover:text-blue-700 hover:underline">
                1. Why study groups work for law students
              </a>
              <a href="#framework" className="block text-blue-600 hover:text-blue-700 hover:underline">
                2. The study group framework
              </a>
              <a href="#pitfalls" className="block text-blue-600 hover:text-blue-700 hover:underline">
                3. Common pitfalls and fixes
              </a>
              <a href="#faqs" className="block text-blue-600 hover:text-blue-700 hover:underline">
                4. FAQs
              </a>
            </nav>
          </div>

          {/* Why Study Groups Work */}
          <h2 id="why-study-groups">Why Study Groups Work for Law Students</h2>
          
          <p>
            Legal education rewards collaborative reasoning:
          </p>

          <ul>
            <li><strong>Diverse perspectives</strong>: Your peer sees a case from a different angle</li>
            <li><strong>Accountability</strong>: Weekly meetings keep you on track</li>
            <li><strong>Active recall</strong>: Explaining a concept to others cements your understanding</li>
            <li><strong>Exam simulation</strong>: Group problem-solving mirrors tutorial and exam conditions</li>
          </ul>

          <p>
            <strong>Research finding</strong>: Students in structured study groups score 10-15% higher on average than solo learners.
          </p>

          {/* Framework */}
          <h2 id="framework">The Durham Law Study Group Framework</h2>

          <h3>Step 1: Form a Group (3-5 Students Ideal)</h3>
          <p><strong>Why 3-5?</strong></p>
          <ul>
            <li><strong>Too small</strong> (2): One person dominates or it is just social</li>
            <li><strong>Too large</strong> (6+): Coordination becomes difficult; quieter members disengage</li>
          </ul>

          <p><strong>How to recruit</strong>:</p>
          <ol>
            <li><strong>Same college</strong>: Easy meeting logistics</li>
            <li><strong>Same modules</strong>: Shared syllabus focus</li>
            <li><strong>Mixed ability</strong>: Stronger students reinforce by teaching; weaker students ask clarifying questions</li>
          </ol>

          <h3>Step 2: Set Clear Expectations</h3>
          <p>Create a simple group charter:</p>
          <div className="not-prose my-4 p-4 bg-gray-100 rounded-lg border border-gray-200 font-mono text-sm">
            <p><strong>Durham Law Study Group Charter</strong></p>
            <p>Modules: Contract Law, Tort Law</p>
            <p>Meeting Time: Thursdays, 4-6pm, [College Library]</p>
            <p>Rotation: Each week, one member leads discussion</p>
            <p>Preparation: All members complete assigned reading</p>
            <p>AI Use: Permitted for research; not for answers</p>
            <p>Integrity: No sharing of assessed work</p>
          </div>

          <h3>Step 3: Structure Your Meetings (2 hours)</h3>
          <p><strong>Pre-Meeting (Individual Work)</strong>:</p>
          <ul>
            <li>Read assigned cases/textbook chapters</li>
            <li>Note 2-3 questions or confusing points</li>
          </ul>

          <p><strong>Meeting Agenda</strong>:</p>
          <ul>
            <li><strong>00:00 - 00:15</strong>: Quick wins - Clarify facts of upcoming cases</li>
            <li><strong>00:15 - 01:00</strong>: Deep dive - Rotating leader presents a complex topic</li>
            <li><strong>01:00 - 01:30</strong>: Problem question practice - Work through past exam question</li>
            <li><strong>01:30 - 01:50</strong>: AI-assisted research - Use Durmah to explore unanswered questions</li>
            <li><strong>01:50 - 02:00</strong>: Next steps - Assign next week\'s leader</li>
          </ul>

          <h3>Step 4: Rotate Leadership</h3>
          <p>Each week, a different member:</p>
          <ul>
            <li>Chooses the focus topic</li>
            <li>Prepares a 5-10 minute explanation</li>
            <li>Leads Q&A and discussion</li>
          </ul>
          <p><strong>Why rotation works</strong>: Prevents one person from dominating and forces everyone to engage deeply.</p>

          {/* Pitfalls */}
          <h2 id="pitfalls">Common Study Group Pitfalls (and Fixes)</h2>

          <h3>❌ Problem: It is Just Socializing</h3>
          <p><strong>Symptoms</strong>: Meetings start late, drift off-topic, no one prepares</p>
          <p><strong>Fix</strong>:</p>
          <ul>
            <li>Enforce the 2-hour limit</li>
            <li>Rotate a "timekeeper" role</li>
            <li>Move location to a quiet study space (not a café)</li>
          </ul>

          <h3>❌ Problem: One Person Dominates</h3>
          <p><strong>Symptoms</strong>: Same student answers every question; others feel redundant</p>
          <p><strong>Fix</strong>:</p>
          <ul>
            <li>Use "round-robin" questioning: each person must contribute before anyone speaks twice</li>
            <li>Assign specific roles (e.g., "You explain the facts, you explain the ratio")</li>
          </ul>

          <h3>❌ Problem: Academic Integrity Confusion</h3>
          <div className="not-prose my-6 p-6 border-l-4 border-red-500 bg-red-50 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">STOP: Contract Cheating</h4>
                <p className="text-gray-700 text-sm">"Let\'s divvy up this essay and each write one section" is contract cheating and will result in academic misconduct penalties.</p>
                <p className="text-gray-700 text-sm mt-2"><strong>Allowed</strong>: Discussing essay structures, comparing arguments, sharing research tips</p>
                <p className="text-gray-700 text-sm"><strong>Prohibited</strong>: Writing each other\'s essays, sharing draft paragraphs, submitting joint work as individual</p>
              </div>
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="not-prose my-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Optimal size</strong>: 3-5 students for balance and engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Structure meetings</strong>: Pre-work, timed agenda, rotating roles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Stay integrity-compliant</strong>: Share learning strategies, not assessed work</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Use AI wisely</strong>: Enhance group research; do not replace individual thinking</span>
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
              <Link href="/learn/durham-law-ai-study-assistant" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">Durham Law AI Study Assistant</h4>
                <p className="text-sm text-gray-600">Use Durmah in group meetings for research</p>
              </Link>
              <Link href="/learn/durham-law-wellbeing-routine" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition">
                <h4 className="font-semibold text-gray-900 mb-1">Durham Law Wellbeing Routine</h4>
                <p className="text-sm text-gray-600">Balance collaborative study with personal wellbeing</p>
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
            <h3 className="text-2xl font-bold mb-3">Try MyDurhamLaw\'s Group-Optimized Features</h3>
            <p className="text-purple-100 mb-6">
              Durmah can assist your study group with real-time legal research and Socratic Q&A.
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
