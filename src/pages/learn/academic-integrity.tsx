import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Shield, Scale, FileCheck, Info } from 'lucide-react';

export default function AcademicIntegrity() {
  return (
    <LearnLayout
      title="Academic Integrity: Using AI Ethically"
      description="A guide for Durham Law students on the ethical use of AI assistants and maintaining academic standards."
      slug="academic-integrity"
      relatedArticles={[
        { title: 'AI Study Assistant', slug: 'ai-study-assistant' },
        { title: 'Premium Support & Revison', slug: 'premium-support' }
      ]}
    >
      <div className="prose prose-emerald max-w-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-0">Academic Integrity</h1>
            <p className="text-gray-500 font-medium">Integrity as a professional foundation</p>
          </div>
        </div>

        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          In the legal profession, integrity is everything. As a law student at Durham, your reputation 
          starts with your undergraduate degree. While AI offers powerful tools, it must be used 
          with transparency and a commitment to original thought. At MyDurhamLaw, we adhere to a 
          <strong> "Tutor, Not Ghostwriter"</strong> philosophy.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">AI as your Personal Tutor</h2>
        <p>
          The most effective and ethical way to use MyDurhamLaw is to treat the AI as a 
          high-level teaching assistant. Use it to:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <FileCheck className="w-6 h-6 text-emerald-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Check Understanding</h3>
            <p className="text-sm text-gray-600 m-0">
              "I think X case established Y principle. Is that a correct reading of the judgment?"
            </p>
          </div>
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Scale className="w-6 h-6 text-emerald-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Build Structure</h3>
            <p className="text-sm text-gray-600 m-0">
              "Here are the points I want to make in my essay on Contract Law. Does this order flow logically?"
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">What to Avoid</h2>
        <p>
          To maintain compliance with the University's academic misconduct policies, 
          you should <strong>not</strong> use AI to:
        </p>
        <ul className="list-disc pl-6 space-y-3">
          <li>Generate full drafts of summative assignments.</li>
          <li>Write detailed case summaries that you then copy-paste into your work.</li>
          <li>Submit any content that you do not fully understand and cannot explain independently.</li>
        </ul>

        <div className="bg-gray-50 border-l-4 border-gray-900 p-6 my-10 rounded-r-xl">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-gray-900" />
            <h3 className="text-gray-900 font-bold m-0">Transparency Promise</h3>
          </div>
          <p className="text-gray-800 m-0">
            MyDurhamLaw will never include features that promote mass essay generation. Our goal is 
            to help you develop *your* legal voice, not replace it.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw Helps</h2>
        <p>
          Our platform is built with safeguards to encourage ethical use. By focusing on 
          the <em>process</em> of legal reasoning rather than the final <em>output</em>, we help 
          you prepare for the rigorous standards of the Solicitors Regulation Authority (SRA) 
          and the Bar. Learn more about our <Link href="/pricing" className="text-emerald-600 font-bold hover:underline">ethical study tools</Link>.
        </p>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-emerald-200 decoration-2 underline-offset-4">Can Turnitin detect MyDurhamLaw?</h4>
              <p className="text-gray-600 text-sm m-0">
                Modern plagiarism software is increasingly capable of detecting AI-generated patterns. 
                If you use AI to learn and then write your own work, you have nothing to fear. If you 
                copy-paste, you are at high risk.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-emerald-200 decoration-2 underline-offset-4">Should I declare my use of AI?</h4>
              <p className="text-gray-600 text-sm m-0">
                Yes, if your department requires it. Transparency is always the best policy. 
                We recommend keeping a log of how you used AI tools during your research process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
