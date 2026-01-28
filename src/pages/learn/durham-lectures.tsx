import React from "react";
import Head from "next/head";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowRight, Clock } from "lucide-react";

export default function DurhamLecturesArticle() {
  const publishedDate = new Date().toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Mastering Durham Law Lectures: A Strategic Workflow",
    description:
      "How to effectively manage Panopto recordings, capture lecturer emphasis, and structure your notes for revision at Durham Law School.",
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      "@type": "Organization",
      name: "Caseway",
    },
    publisher: {
      "@type": "Organization",
      name: "Caseway",
      logo: {
        "@type": "ImageObject",
        url: "https://casewaylaw.ai/icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://casewaylaw.ai/learn/durham-lectures",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://casewaylaw.ai",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Learn",
        item: "https://casewaylaw.ai/learn",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Mastering Lectures",
        item: "https://casewaylaw.ai/learn/durham-lectures",
      },
    ],
  };

  return (
    <>
      <Head>
        <title>
          Mastering Durham Law Lectures: Panopto, Notes & Emphasis | Caseway
        </title>
        <meta
          name="description"
          content="Stop transcribing blindly. Learn the strategic workflow for Durham Law lectures: using Panopto effectively, spotting lecturer signals, and creating revision-ready notes."
        />
        <link
          rel="canonical"
          href="https://casewaylaw.ai/learn/durham-lectures"
        />
        <meta
          property="og:title"
          content="Mastering Durham Law Lectures: Strategy & Workflow"
        />
        <meta
          property="og:description"
          content="Stop transcribing blindly. Learn the strategic workflow for Durham Law lectures."
        />
        <meta
          property="og:url"
          content="https://casewaylaw.ai/learn/durham-lectures"
        />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mastering Durham Law Lectures" />
        <meta
          name="twitter:description"
          content="Stop transcribing blindly. Learn the strategic workflow for Durham Law lectures."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </Head>

      <div className="bg-white min-h-screen py-12 lg:py-20">
        <article className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/learn"
              className="text-purple-600 font-medium hover:underline mb-4 inline-block"
            >
              ← Back to Learning Hub
            </Link>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              Mastering Durham Law Lectures: A Strategic Workflow
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              The goal isn't to transcribe everything. It's to capture the
              logic, the authorities, and the "signals" that define
              distinction-level answers.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-8">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 5 min read
              </span>
              <span>•</span>
              <span>
                Updated:{" "}
                {new Date().toLocaleDateString("en-GB", {
                  timeZone: "Europe/London",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div className="prose prose-lg prose-purple max-w-none text-gray-700">
            <h3>The "Transcription Trap"</h3>
            <p>
              With Panopto recordings available 24/7, it's tempting to pause
              every 30 seconds to write down verbatim quotes. This is a trap. It
              doubles your study time and turns you into a passive scribe rather
              than an active learner.
            </p>
            <p>
              Your lecturer isn't reading a textbook to you; they are creating a
              narrative. They are showing you how the law <em>fits together</em>
              .
            </p>

            <h3>1. Optimizing the Pre-Lecture Phase</h3>
            <p>
              Don't go in cold. A 10-minute skim of the handout or reading list
              provides the "skeleton" onto which you will hang the "meat" of the
              lecture content.
            </p>
            <ul>
              <li>
                <strong>Map the structure:</strong> Note the 3-4 main headings
                from the handout.
              </li>
              <li>
                <strong>Identify key cases:</strong> Spot the names that keep
                appearing.
              </li>
              <li>
                <strong>Formulate questions:</strong> What specific ambiguity
                does this lecture aim to resolve?
              </li>
            </ul>

            <h3>2. Capturing "Lecturer Emphasis"</h3>
            <p>
              This is the secret weapon of high-performing students. Lecturers
              often signal what matters most for the exam, sometimes subtly.
            </p>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
              <h4 className="font-bold text-gray-900 mb-2 mt-0">
                Listen for these signals:
              </h4>
              <ul className="mb-0">
                <li>
                  <em>"The critical distinction here is..."</em> (This is likely
                  an exam issue)
                </li>
                <li>
                  <em>"Students often confuse X with Y..."</em> (This is a
                  common pitfall to avoid)
                </li>
                <li>
                  <em>"I personally find this judgment unconvincing..."</em>{" "}
                  (Gold dust for critical analysis marks)
                </li>
              </ul>
            </div>

            <h3>3. The Panopto Strategy</h3>
            <p>
              Panopto is a tool for review, not initial learning. Watch the
              lecture at 1.0x or 1.2x speed without pausing constantly. Allow
              the argument to flow. Use timestamps in your notes (e.g.,
              "[24:15]") for complex sections you need to revisit later, rather
              than stopping the flow to write it out perfectly.
            </p>

            <h3>4. Making Notes Exam-Ready</h3>
            <p>
              Post-lecture, your notes should not be a script. They should be a
              toolkit.
            </p>
            <ul>
              <li>
                <strong>Condense:</strong> Summarise the legal principle in one
                sentence.
              </li>
              <li>
                <strong>Connect:</strong> Explicitly link this case to the one
                from last week.
              </li>
              <li>
                <strong>Critique:</strong> Add a "Criticism" column next to the
                ratio decidendi.
              </li>
            </ul>

            <p>
              By treating lectures as a strategic exercise in data capture
              rather than a dictation test, you free up hours of revision time
              for what actually counts: applying the law to problem questions.
            </p>
          </div>

          {/* Soft CTA */}
          <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Put this into practice
            </h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Caseway automatically parses your lecture transcripts to highlight
              key points and lecturer emphasis signals for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <button className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-purple-700 transition">
                  Start Free Trial
                </button>
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                See pricing
              </Link>
            </div>
          </div>

          {/* Related Guides */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
              Related Guides
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <Link
                href="/learn/durham-assignments"
                className="group block p-6 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition"
              >
                <h5 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Strategic Assignments →
                </h5>
                <p className="text-sm text-gray-600">
                  Formative vs Summative workflows.
                </p>
              </Link>
              <Link
                href="/learn/durham-exam-prep"
                className="group block p-6 border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition"
              >
                <h5 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Integrity-First Exams →
                </h5>
                <p className="text-sm text-gray-600">
                  IRAC drills and honest revision.
                </p>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
