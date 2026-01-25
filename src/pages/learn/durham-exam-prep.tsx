import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, BookOpen, ArrowRight, Clock } from 'lucide-react';

export default function DurhamExamPrepArticle() {
  const publishedDate = new Date().toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Integrity-First Exam Prep for Durham Law Students",
    "description": "How to prepare for Durham Law exams with integrity. Avoiding predictions, mastering IRAC structure, and focusing on application over memorisation.",
    "datePublished": publishedDate,
    "dateModified": publishedDate,
    "author": {
      "@type": "Organization",
      "name": "MyDurhamLaw"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MyDurhamLaw",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mydurhamlaw.com/icon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://mydurhamlaw.com/learn/durham-exam-prep"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://mydurhamlaw.com"
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": "Learn",
      "item": "https://mydurhamlaw.com/learn"
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": "Exam Prep",
      "item": "https://mydurhamlaw.com/learn/durham-exam-prep"
    }]
  };

  return (
    <>
      <Head>
        <title>Integrity-First Exam Prep for Durham Students | MyDurhamLaw</title>
        <meta name="description" content="Don't guess the question. Learn how to apply the law to any scenario. Integrity-safe revision strategies for Durham Law exams." />
        <link rel="canonical" href="https://mydurhamlaw.com/learn/durham-exam-prep" />
        <meta property="og:title" content="Integrity-First Exam Prep: Strategy over Prediction" />
        <meta property="og:description" content="Don't guess the question. Learn how to apply the law to any scenario." />
        <meta property="og:url" content="https://mydurhamlaw.com/learn/durham-exam-prep" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Integrity-First Exam Prep" />
        <meta name="twitter:description" content="Don't guess the question. Learn how to apply the law to any scenario." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="bg-white min-h-screen py-12 lg:py-20">
        <article className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link href="/learn" className="text-purple-600 font-medium hover:underline mb-4 inline-block">← Back to Learning Hub</Link>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              Integrity-First Exam Prep: Strategy over Prediction
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              The goal is not to "guess" what will come up. The goal is to be ready for anything that does.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-8">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> 5 min read</span>
              <span>•</span>
              <span>Updated: {new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London',  day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Content Body */}
          <div className="prose prose-lg prose-emerald max-w-none text-gray-700">
            <h3>The Danger of "Topic Spotting"</h3>
            <p>
              "I bet they'll ask about frustration this year because they asked about mistake last year." This is gambling, not revision.
            </p>
            <p>
              Examiners know that students do this. They often write questions that blend topics (e.g., a contract problem involving both formation and terms) specifically to test the breadth of your knowledge. If you topic-spot, you risk being unable to answer a hybrid question.
            </p>

            <h3>1. Revision vs. Re-reading</h3>
            <p>
              Reading your notes over and over is passive. It feels like work, but it creates the <em>illusion</em> of competence. You recognize the words, so you think you know them.
            </p>
            <p>
              <strong>Active Recall</strong> is the only way. Close your notes. Write down everything you know about "Duty of Care." Then check your notes. The pain of struggling to remember is where the learning happens.
            </p>

            <h3>2. Mastering the IRAC Structure</h3>
            <p>
              For problem questions, your structure is your safety net.
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
              <ul className="mb-0">
                <li><strong>ISSUE:</strong> Identify the legal issue. (e.g., "Is the exclusion clause valid?")</li>
                <li><strong>RULE:</strong> State the law. (e.g., "Under <em>UCTA 1977</em> s.2...")</li>
                <li><strong>ANALYSIS:</strong> Apply it. (e.g., "Here, the clause is onerous because...")</li>
                <li><strong>CONCLUSION:</strong> Conclude. (e.g., "Therefore, the clause is likely void.")</li>
              </ul>
            </div>
            <p>
              Practise writing out just the skeleton of answers for past papers. You don't always need to write a full 2,000 words. Plan 10 answers in the time it takes to write one.
            </p>

            <h3>3. Academic Integrity is Non-Negotiable</h3>
            <p>
              In the age of AI, the temptation to take shortcuts is high. But an exam is a test of <em>your</em> reasoning, not a chatbot's.
            </p>
            <p>
              Use tools like generic practice prompts to test your understanding, but never input exam questions into an AI to generate an answer. You rob yourself of the practice, and you risk severe academic misconduct penalties.
            </p>
            <p>
              Trust your preparation. If you have done the reading, attended the lectures, and practiced the application, you do not need shortcuts.
            </p>
          </div>

          {/* Soft CTA */}
          <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
             <h3 className="text-2xl font-bold text-gray-900 mb-4">Practice safe, revised smart</h3>
             <p className="text-gray-600 mb-8 max-w-xl mx-auto">
               MyDurhamLaw provides integrity-safe practice prompts and revision tools that help you test yourself without breaking the rules.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <button className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-700 transition">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/pricing" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
                  See pricing
                </Link>
             </div>
          </div>

          {/* Related Guides */}
          <div className="mt-16 pt-8 border-t border-gray-100">
             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Related Guides</h4>
             <div className="grid gap-6 md:grid-cols-2">
                <Link href="/learn/durham-lectures" className="group block p-6 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition">
                   <h5 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Mastering Lectures →</h5>
                   <p className="text-sm text-gray-600">Effective note-taking strategies.</p>
                </Link>
                <Link href="/learn/durham-assignments" className="group block p-6 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition">
                   <h5 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Strategic Assignments →</h5>
                   <p className="text-sm text-gray-600">Planning your essays for success.</p>
                </Link>
             </div>
          </div>

        </article>
      </div>
    </>
  );
}
