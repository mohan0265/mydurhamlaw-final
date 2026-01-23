import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Shield, Scale, FileCheck, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AcademicIntegrity() {
  return (
    <LearnLayout
      title="Academic Integrity in Law School: How to Use AI Ethically (and Still Win Marks)"
      description="A practical guide for UK law students on using AI ethically—avoiding misconduct, improving understanding, and building better arguments without ghostwriting."
      slug="academic-integrity"
      relatedArticles={[
        { title: 'AI Study Assistant', slug: 'ai-study-assistant' },
        { title: 'Smart Chat Interface', slug: 'smart-chat-interface' }
      ]}
    >
      <div className="prose prose-emerald max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 font-serif">Academic Integrity in Law School: How to Use AI Ethically (and Still Win Marks)</h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8 italic">
          In the legal profession, integrity is not just a virtue—it's a requirement. As you build your reputation 
          starting at university, understanding the boundary between AI as a tool and AI as an easy shortcut 
          is essential for your future career and your academic standing.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Why integrity is a performance advantage</h2>
        <p>
          It’s tempting to look for shortcuts, but real improvement in law comes from mastering skills, not 
          finding workarounds. Tutors at high-ranking universities reward authentic reasoning, clear 
          referencing, and a unique legal voice. By using AI to sharpen your own thoughts rather than 
          replace them, you build the muscle memory required for the Solicitors Qualifying Examination (SQE) 
          and the Bar.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">What crosses the line (common risk areas)</h2>
        <p>Before you use any AI tool, be aware of what constitutes academic misconduct:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm text-red-900">Submitting AI-written text as your own original work.</span>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm text-red-900">Paraphrasing AI-generated content without deep understanding.</span>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm text-red-900">Including fake citations or "hallucinated" cases invented by AI.</span>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-sm text-red-900">Over-relying on AI summaries instead of reading core authorities.</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">What’s usually safe and genuinely helpful</h2>
        <p>To stay on the right side of the line, use MyDurhamLaw for these tasks:</p>
        <ul className="space-y-3">
          <li className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span><strong>Explaining Concepts:</strong> Ask the AI to explain complex doctrines (like Quistclose trusts or Proprietary Estoppel) in simpler terms until you grasp the core principle.</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span><strong>Testing Knowledge:</strong> Have the AI quiz you on cases or statutes.</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span><strong>Critiquing Outlines:</strong> Upload your essay skeleton for feedback on the logical flow of your argument.</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span><strong>Planning:</strong> Use AI to help manage your study time and structure your revision blocks.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Referencing expectations (general UK law context)</h2>
        <p>
          While **OSCOLA** is the standard for legal referencing in the UK, never treat AI's citation output 
          as perfect. **Keep a meticulous source trail.** Always cross-reference every case, statute, or 
          textbook page number the AI suggests against your own primary reading. Precision is the 
          hallmark of a lawyer; mistakes in referencing suggest sloppy research.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">For Durham Law students</h2>
        <p>
          At Durham, the expectation is that you use AI to learn, then write in your own unique legal voice. 
          Adopt a **"Tutor, Not Writer"** mindset. If you can't explain the logic of a paragraph without 
          the AI's help, you shouldn't submit it.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw helps</h2>
        <p>
          We build ethical reminders directly into our user experience. Our tools are designed for planning, 
          reasoning, and critique—not mass text generation. We focus on helping you build the skills 
          that markers actually reward.
        </p>
        <div className="mt-8">
          <Link href="/pricing">
             <button className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
               View Plans
             </button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-16 mb-6 pt-10 border-t">FAQ</h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900">Can I use AI to improve my essay structure?</h4>
            <p className="text-gray-600 text-sm m-0">Yes. Using AI to brainstorm a logical flow or ensure your points follow a clear IRAC structure is typically acceptable and encouraged as part of the learning process.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">How do I avoid “fake citation” mistakes?</h4>
            <p className="text-gray-600 text-sm m-0">Never copy a citation directly from a chat session without verifying it on Westlaw, Lexis, or in your textbook first. AI can sometimes combine facts from different cases.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Should I disclose AI use?</h4>
            <p className="text-gray-600 text-sm m-0">Always follow your department’s specific rules. If in doubt, transparency is the safest policy. Keep a log of how AI assisted your research and planning.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">What’s the safest way to use AI for problem questions?</h4>
            <p className="text-gray-600 text-sm m-0">Use the AI to critique your issue-spotting or to suggest possible rules, then write the application of those rules yourself using the specific facts of the case.</p>
          </div>
        </div>

        <p className="mt-20 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>
      </div>
    </LearnLayout>
  );
}
