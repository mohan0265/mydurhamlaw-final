import React from 'react';
import LearnLayout from '@/components/layout/LearnLayout';
import { generateArticleSEO, generateFAQSchema, generateArticleSchema } from '@/lib/seo';
import Link from 'next/link';
import { Brain, CheckCircle, BookOpen, MessageSquare, Mic, PenTool, Lightbulb, GraduationCap } from 'lucide-react';

const seo = generateArticleSEO({
  title: 'Learn law. Write law. Speak law.',
  description: 'Understand the three pillars of legal mastery. Why law school focus on reading and writing is only half the battle, and how "speaking law" builds professional confidence.',
  slug: 'learn-write-speak-law',
  keywords: 'Durham Law, speaking law, legal advocacy, seminar confidence, Quiz Me, legal study techniques, Durham University'
});

const faqs = [
  {
    question: 'Is "speaking law" only for aspiring barristers?',
    answer: 'Not at all. Whether you are aiming for the Bar, a solicitor firm, or an academic career, the ability to articulate legal principles clearly and respond logicaly under pressure is a universal professional requirement.'
  },
  {
    question: 'How does Quiz Me help me "speak law"?',
    answer: 'Quiz Me provides a safe, private environment to practice verbalising your reasoning. By answering Durmah\'s prompts out loud, you expose logic gaps and build the "muscle memory" needed for seminars and interviews.'
  },
  {
    question: 'Will this help with my written essays?',
    answer: 'Yes. There is a strong synergy between speech and writing. If you can explain an issue clearly to someone else, your written structure and logic will naturally become cleaner and less redundant.'
  }
];

export default function LearnWriteSpeakLaw() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleSchema({
            headline: 'Learn law. Write law. Speak law.',
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
          <div className="not-prose mb-12 p-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-[2.5rem] border border-white/10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <GraduationCap className="w-12 h-12 text-purple-300" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
                  Learn Law | Write Law | Speak Law
                </h1>
                <p className="text-xl text-purple-100/90 mb-0 font-light">
                  Why legal understanding is incomplete until it is articulated.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold">The Hidden Gap in Legal Education</h2>
          <p>
            Standard law school curricula are built on two traditional pillars: <strong>Reading</strong> (cases, statutes, textbooks) and <strong>Writing</strong> (essays, problem questions, exams). You spend thousands of hours refining these skills.
          </p>
          <p>
            But there is a missing third pillar: <strong>Speaking</strong>. 
          </p>
          <p>
            Law is, at its heart, a conversational and argumentative discipline. From the tutorial room to the High Court, your ability to "speak law" is the true test of your mastery. If you can't explain a legal principle clearly, you don't fully own it.
          </p>

          <div className="my-10 grid md:grid-cols-3 gap-6 not-prose">
             <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <BookOpen className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Learn Law</h3>
                <p className="text-gray-600 text-sm">The foundation. Turning raw lecture notes and case readings into structured knowledge.</p>
             </div>
             <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <PenTool className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Write Law</h3>
                <p className="text-gray-600 text-sm">The precision. Using IRAC and OSCOLA to build defensible, written arguments.</p>
             </div>
             <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Mic className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="font-bold text-lg mb-2">Speak Law</h3>
                <p className="text-gray-600 text-sm">The mastery. Articulating, defending, and applying law under pressure, out loud.</p>
             </div>
          </div>

          <h2>Why "I Understand It In My Head" is a Trap</h2>
          <p>
            Most Durham students have experienced the "tutorial freeze." You've done the reading, you think you understand the point, but when the tutor asks you to apply it, the words don't come.
          </p>
          <p>
            This isn't just nerves. It's because <strong>passive understanding</strong> is different from <strong>active mastery</strong>. Verbalisation exposes gaps that silent reading hides. It forces you to find the structure, choose the right authorities, and commit to an interpretation.
          </p>

          <div className="not-prose my-12 p-8 bg-blue-50 rounded-3xl border border-blue-100 flex gap-6">
             <Lightbulb className="w-12 h-12 text-blue-600 shrink-0" />
             <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">The 3-Minute Rule</h3>
                <p className="text-blue-800/80 leading-relaxed">
                   After reading a complex case or topic, try to explain it to an imaginary client (or Durmah) in under 3 minutes. If you waffle, rambled, or forget a key component of the test, you need to revisit the "Learn" phase. Clarity is the proof of mastery.
                </p>
             </div>
          </div>

          <h2>Practising Like a Professional</h2>
          <p>
            In professional practice, judges interrupt. Colleagues challenge your reasoning. Clients ask "So what does this mean for me?" none of these are written essay questions.
          </p>
          <p>
            To excel at Durham and beyond, you must move beyond the "silent study" habit. You need a safe environment to fail, refine, and try again.
          </p>

          <div className="not-prose my-12 p-8 bg-white border border-purple-200 rounded-[2rem] shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 translate-x-4 -translate-y-4">
                <img 
                   src="/assets/mascots/quiz-me-bunny.png" 
                   alt="Quiz Me Mascot" 
                   className="w-32 h-32 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.1)]"
                />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-4">Try "Quiz Me"</h3>
             <p className="text-gray-600 mb-6 max-w-xl">
                Our new <strong>Quiz Me</strong> feature is designed to bridge this gap. Pick a module or a specific lecture and Durmah will act as your tutor, prompting you with hypothetical scenarios and logical challenges. 
             </p>
             <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                   <MessageSquare className="w-4 h-4 text-purple-600" /> Use Text Mode to refine thoughts
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                   <Mic className="w-4 h-4 text-purple-600" /> Use Voice Mode to build seminar confidence
                </div>
             </div>
             <div className="mt-8">
                <Link href="/dashboard">
                  <button className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition shadow-lg shadow-purple-200">
                    Try Quiz Me now →
                  </button>
                </Link>
             </div>
          </div>

          <h2 className="text-2xl font-bold">Conclusion: The Mindset Shift</h2>
          <p>
            Law is not something you merely memorise. It is something you must articulate, defend, and apply — aloud. By embracing the third pillar, you don't just become a better student; you begin to think, act, and speak like a lawyer.
          </p>
          <p className="text-xl font-bold italic text-purple-900">
            Learn law. Write law. Speak law.
          </p>

          <div className="mt-16 border-t border-gray-100 pt-8 not-prose">
             <h3 className="font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
             <div className="space-y-4">
                {faqs.map((faq, i) => (
                   <details key={i} className="group p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                         {faq.question}
                         <span className="text-purple-600 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <p className="mt-3 text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
                   </details>
                ))}
             </div>
          </div>
        </article>
      </LearnLayout>
    </>
  );
}
