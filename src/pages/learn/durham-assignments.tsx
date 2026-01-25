import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PenTool, CheckCircle, ArrowRight, Clock } from 'lucide-react';

export default function DurhamAssignmentsArticle() {
  const publishedDate = new Date().toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "A Strategic Approach to Durham Law Assignments",
    "description": "How to break down briefs, distinguish between formative and summative expectations, and draft with clarity for Durham Law assignments.",
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
      "@id": "https://mydurhamlaw.com/learn/durham-assignments"
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
      "name": "Strategic Assignments",
      "item": "https://mydurhamlaw.com/learn/durham-assignments"
    }]
  };

  return (
    <>
      <Head>
        <title>A Strategic Approach to Durham Assignments | MyDurhamLaw</title>
        <meta name="description" content="Stop starting the night before. Learn the disciplined workflow for Durham Law assignments: breaking the brief, planned research, and drafting hygiene." />
        <link rel="canonical" href="https://mydurhamlaw.com/learn/durham-assignments" />
        <meta property="og:title" content="A Strategic Approach to Durham Assignments" />
        <meta property="og:description" content="Stop starting the night before. Learn the disciplined workflow for Durham Law assignments." />
        <meta property="og:url" content="https://mydurhamlaw.com/learn/durham-assignments" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="A Strategic Approach to Durham Assignments" />
        <meta name="twitter:description" content="Stop starting the night before. Learn the disciplined workflow for Durham Law assignments." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="bg-white min-h-screen py-12 lg:py-20">
        <article className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link href="/learn" className="text-purple-600 font-medium hover:underline mb-4 inline-block">← Back to Learning Hub</Link>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              A Strategic Approach to Durham Law Assignments
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              Distinction-level marks aren't just about what you know. They are about how clearly, logically, and persuasively you can apply it.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-8">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> 6 min read</span>
              <span>•</span>
              <span>Updated: {new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London',  day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Content Body */}
          <div className="prose prose-lg prose-purple max-w-none text-gray-700">
            <h3>The Formative vs. Summative Mindset</h3>
            <p>
              Many students treat formatives (practice essays) as optional or tailored for a "quick pass." This is a mistake. Formatives are your <strong className="text-purple-700">failures on paper</strong>.
            </p>
            <p>
              When you fail or struggle in a formative, you identify a gap in your understanding <em>without penalty</em>. Treat them with the exact same rigor as a summative, and the feedback you receive becomes your roadmap for the real exam.
            </p>

            <h3>1. Deconstructing the Brief</h3>
            <p>
              Before you read a single case, read the question five times.
            </p>
             <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
              <h4 className="font-bold text-gray-900 mb-2 mt-0">Identify the command words:</h4>
              <ul className="mb-0">
                <li><strong>"Critically analyze":</strong> Don't just explain the law; evaluate its effectiveness, fairness, or consistency.</li>
                <li><strong>"Advise the parties":</strong> Focus on application. Who has a claim? What are the defenses? What is the likely remedy?</li>
              </ul>
            </div>

            <h3>2. Research with Purpose</h3>
            <p>
              Avoid the "rabbit hole" of reading everything. Start with your lecture notes and textbook to get the framework. Then, and only then, go to Westlaw or Lexis.
            </p>
            <p>
              When reading a journal article, don't read cover-to-cover. Read the Abstract, the Introduction, and the Conclusion first. ask: <em>"Does this argument support or challenge my thesis?"</em> If not, move on.
            </p>

            <h3>3. Structure IS the Argument</h3>
            <p>
              A good structure forces a good argument. For problem questions, the classic <strong>IRAC</strong> (Issue, Rule, Application, Conclusion) is non-negotiable.
            </p>
            <ul>
              <li><strong>Issue:</strong> What specific legal question are we solving here?</li>
              <li><strong>Rule:</strong> What is the relevant authority (Case/Statute)?</li>
              <li><strong>Application:</strong> THIS is where the marks are. Apply the rule to the <em>specific facts</em> of the scenario. Distinguish the facts if necessary.</li>
              <li><strong>Conclusion:</strong> Give a tentative answer. Don't sit on the fence forever.</li>
            </ul>

            <h3>4. Drafting Hygiene</h3>
            <p>
              Write your first draft fast. Get the ideas down. Then, edit slowly.
            </p>
            <p>
              Check your citations. Are you OSCOLA compliant? Have you pinpointed the exact paragraph in a judgment? Precision is a hallmark of a lawyer. Sloppy referencing suggests sloppy thinking.
            </p>

             <p>
              Finally, always leave 24 hours between your final draft and your final review. You need fresh eyes to spot the typos and the logic gaps that your tired brain fills in automatically.
            </p>
          </div>

          {/* Soft CTA */}
          <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
             <h3 className="text-2xl font-bold text-gray-900 mb-4">Plan, draft, and succeed</h3>
             <p className="text-gray-600 mb-8 max-w-xl mx-auto">
               MyDurhamLaw's assignment tools help you break down briefs, manage due dates, and structure your arguments step-by-step.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <button className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-purple-700 transition">
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
                   <p className="text-sm text-gray-600">Panopto strategy and note-taking.</p>
                </Link>
                <Link href="/learn/durham-exam-prep" className="group block p-6 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition">
                   <h5 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Integrity-First Exams →</h5>
                   <p className="text-sm text-gray-600">Applying the law without guessing.</p>
                </Link>
             </div>
          </div>

        </article>
      </div>
    </>
  );
}
