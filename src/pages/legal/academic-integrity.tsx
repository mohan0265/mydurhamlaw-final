// src/pages/legal/academic-integrity.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, BookOpen, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function AcademicIntegrityPage() {
  return (
    <>
      <Head>
        <title>Academic Integrity | MyDurhamLaw</title>
        <meta name="description" content="MyDurhamLaw's commitment to academic integrity and ethical AI use in legal education." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Academic Integrity Policy
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our commitment to ethical AI use and supporting genuine learning at Durham Law.
            </p>
          </div>

          {/* Core Principles */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Our Core Principles</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Learning, Not Cheating</h3>
                  <p className="text-gray-600 text-sm">
                    MyDurhamLaw is designed to enhance your understanding of legal concepts, not to complete assignments for you. We encourage critical thinking and original work.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Transparency in AI Use</h3>
                  <p className="text-gray-600 text-sm">
                    We encourage you to disclose AI assistance where required by your institution. Our tools are meant to supplement, not replace, your legal education.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Supporting Original Work</h3>
                  <p className="text-gray-600 text-sm">
                    Durmah, our AI assistant, is trained to guide you through legal reasoning rather than provide ready-made answers for submission.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Warning Section */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-semibold text-amber-900">Important Notice</h2>
            </div>
            <p className="text-amber-800 mb-4">
              Submitting AI-generated content as your own work may constitute academic misconduct under Durham University's regulations. Always:
            </p>
            <ul className="list-disc list-inside text-amber-800 space-y-2 text-sm">
              <li>Check your module's specific AI use policy</li>
              <li>Cite AI assistance where required</li>
              <li>Use MyDurhamLaw for understanding and revision, not direct submission</li>
              <li>Consult your tutor if unsure about acceptable AI use</li>
            </ul>
          </section>

          {/* Durham University Link */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Durham University Resources</h2>
            <p className="text-gray-600 mb-4 text-sm">
              For the official Durham University academic integrity policies, please refer to:
            </p>
            <a 
              href="https://www.dur.ac.uk/academic-quality/academic-standards/academic-misconduct/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              Durham University Academic Misconduct Policy
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Last updated: January 2026</p>
            <Link href="/legal/ethics" className="text-purple-600 hover:underline mt-2 inline-block">
              View our full Ethics Policy →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
