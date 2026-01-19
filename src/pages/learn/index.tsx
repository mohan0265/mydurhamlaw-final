import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { BookOpen, Shield, PenTool, GraduationCap, ArrowRight } from 'lucide-react';

export default function LearnHub() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "headline": "Learning Hub - Mastering Durham Law",
    "description": "Educational guides and resources specifically tailored for Durham University law students.",
    "publisher": {
      "@type": "Organization",
      "name": "MyDurhamLaw",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mydurhamlaw.com/icon.png" 
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://mydurhamlaw.com/learn/durham-lectures",
          "name": "Mastering Durham Law Lectures"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://mydurhamlaw.com/learn/durham-assignments",
          "name": "Strategic Approach to Assignments"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "https://mydurhamlaw.com/learn/durham-exam-prep",
          "name": "Integrity-First Exam Prep"
        }
      ]
    }
  };

  return (
    <>
      <Head>
        <title>Learning Hub - Mastering Durham Law | MyDurhamLaw</title>
        <meta name="description" content="Expert guides on mastering Durham Law lectures, assignments, and exams. Integrity-first advice for Foundation to Year 3 students." />
        <link rel="canonical" href="https://mydurhamlaw.com/learn" />
        <meta property="og:title" content="Learning Hub - Mastering Durham Law | MyDurhamLaw" />
        <meta property="og:description" content="Expert guides on mastering Durham Law lectures, assignments, and exams." />
        <meta property="og:url" content="https://mydurhamlaw.com/learn" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learning Hub - Mastering Durham Law" />
        <meta name="twitter:description" content="Expert guides on mastering Durham Law lectures, assignments, and exams." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="bg-white min-h-screen py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-purple-50 text-purple-700 text-sm font-bold tracking-wide uppercase mb-4">
              Learning Hub
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Mastering your Durham Law Degree
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Strategic advice, workflow tips, and integrity-first methods to help you thrive from Michaelmas to Easter.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Lectures */}
            <Link href="/learn/durham-lectures" className="group">
              <div className="h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  Mastering Lectures
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  How to use Panopto effectively, capture lecturer emphasis, and build notes that are immediately revision-ready.
                </p>
                <div className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 2: Assignments */}
            <Link href="/learn/durham-assignments" className="group">
              <div className="h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
                  <PenTool className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                  Strategic Assignments
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  From understanding the brief to drafting hygiene. How to tackle formative vs summative work with confidence.
                </p>
                <div className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 3: Exam Prep */}
            <Link href="/learn/durham-exam-prep" className="group">
              <div className="h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  Integrity-First Exams
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  Avoid predictions. Focus on application (IRAC), syllabus mapping, and honest, effective revision logic.
                </p>
                <div className="text-emerald-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-20 pt-10 border-t border-gray-100 text-center">
             <h3 className="text-lg font-bold text-gray-900 mb-6">Ready to apply these methods?</h3>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <button className="bg-gray-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-800 transition-transform transform hover:scale-105">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/pricing" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
                  See pricing
                </Link>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
