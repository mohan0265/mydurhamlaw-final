import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Zap, Users, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export default function RealTimeCollaboration() {
  return (
    <LearnLayout
      title="Real-Time Collaboration for Law Students: Better Seminars, Better Revision"
      description="Learn how law students can collaborate effectively—seminar prep, study groups, accountability, and debate—without wasting time or drifting off track."
      slug="real-time-collaboration"
      relatedArticles={[
        { title: 'Smart Chat Interface', slug: 'smart-chat-interface' },
        { title: 'Premium Support & Exam Excellence', slug: 'premium-support' }
      ]}
    >
      <div className="prose prose-blue max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">Real-Time Collaboration for Law Students: Better Seminars, Better Revision</h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">
          Collaboration in law school isn't just about sharing notes; it's about sharpening arguments. 
          When done right, studying with peers can transform your understanding of complex subjects and 
          keep you accountable during the most demanding weeks of the year.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">What this means for UK law undergrads</h2>
        <p>
          In a UK law degree, seminars and tutorials are the primary engine of learning. These small-group 
          sessions reward the quality of your discussion and your ability to defend a position under pressure. 
          Study groups can be powerful force multipliers, or they can be complete wastes of time—the difference 
          lies entirely in your structure.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">The study group format that actually works</h2>
        <p>To avoid a social hour that yields no marks, assign rotating roles within your group:</p>
        <div className="bg-gray-50 p-6 rounded-2xl my-8 border border-gray-100 italic">
          <ul className="list-none pl-0 space-y-2 mb-0 not-italic">
            <li className="flex gap-2"><strong>Chair:</strong> Keeps the session on track and manages time.</li>
            <li className="flex gap-2"><strong>Challenger:</strong> Plays devil's advocate for every legal conclusion.</li>
            <li className="flex gap-2"><strong>Summariser:</strong> Writes the "one-page takeaway" for the group.</li>
          </ul>
        </div>
        <p>Your agenda should focus on: **3 Issues + 2 Cases + 1 Critique** per session.</p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Collaboration for problem questions</h2>
        <p>
          Don't just share an answer. Instead, split the process: have one person identify the facts, 
          another spot the issues, and others find the relevant rules. Debate the application 
          from different sides to build a comprehensive IRAC plan. 
          <strong> Crucially: everyone should then write their own final answer independently.</strong>
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Collaboration for essays</h2>
        <p>
          Essays are about your unique thesis. Use your group to debate that thesis and its 
          counterarguments. Share reading lists and resources, and use peer review to critique 
          outlines for logical flow—but always protect your own writing process for the final text.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">For Durham Law students</h2>
        <p>
          The seminar-heavy rhythm at Durham requires efficient preparation. Use our seminar prep 
          templates to stay consistent. During the Easter term, forming revision groups for 
          consolidation can help you cover the massive syllabus more effectively.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw helps</h2>
        <p>
          Our platform provides structured prompts for group discussion and accountability tools 
          that help you plan your shared sessions. By keeping your collaboration focused and 
          productive, you can spend less time organizing and more time learning.
        </p>
        <div className="mt-8">
          <Link href="/pricing">
             <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
               View Plans
             </button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-16 mb-6 pt-10 border-t">FAQ</h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900">How big should a law study group be?</h4>
            <p className="text-gray-600 text-sm m-0">Typically, 3–4 people is the "sweet spot." More than that and it becomes difficult to manage time and ensure everyone is contributing equally.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">How do we stop it becoming a social chat?</h4>
            <p className="text-gray-600 text-sm m-0">Have a written agenda and assign a "Chair" for each session. Set a hard finish time to maintain focus.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Is group work allowed for assessed essays?</h4>
            <p className="text-gray-600 text-sm m-0">It depends on your module rules. Usually, general discussion of topics and authorities is encouraged, but the actual writing must be 100% your own. Always check your handbook.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">What’s the best way to prepare for seminars quickly?</h4>
            <p className="text-gray-600 text-sm m-0">Focus on the "Seminar Questions" provided by your department and identify at least one authority for every point you plan to make.</p>
          </div>
        </div>

        <p className="mt-20 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>
      </div>
    </LearnLayout>
  );
}
