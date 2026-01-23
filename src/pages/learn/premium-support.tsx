import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Star, Zap, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export default function PremiumSupport() {
  return (
    <LearnLayout
      title="Premium Support for High-Achieving Law Students: Structure, Speed, and Calm Under Pressure"
      description="Premium support isn’t about shortcuts—it’s about better planning, faster feedback cycles, exam readiness, and avoiding burnout for UK law students."
      slug="premium-support"
      relatedArticles={[
        { title: 'AI Study Assistant', slug: 'ai-study-assistant' },
        { title: 'Always With You: Wellbeing', slug: 'always-with-you' }
      ]}
    >
      <div className="prose prose-indigo max-w-none">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 font-serif">Premium Support for High-Achieving Law Students: Structure, Speed, and Calm Under Pressure</h1>
        <p className="text-xl text-gray-600 leading-relaxed mb-8">
          The path to a First or a top 2:1 requires more than just knowing the law; it requires mastering the 
          strategy of law school. Our **Premium Support** features are dedicated to students who are 
          committed to high performance, providing the tools needed for faster iteration and deep 
          analytical clarity.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">What high achievers do differently</h2>
        <p>
          High-achieving law students recognize that their time is their most valuable asset. They don't just 
          work harder; they work smarter by focusing on four key pillars:
        </p>
        <ul className="space-y-4 mb-10">
          <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> <strong>Earlier Planning:</strong> Starting the revision runway 6 weeks before the first exam.</li>
          <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> <strong>Practice Under Pressure:</strong> Shifting from reading to timed practice as early as possible.</li>
          <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> <strong>Tight Feedback Loops:</strong> Using critique to refine their writing style and logical structure.</li>
          <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" /> <strong>Sustainability:</strong> Protecting sleep and maintaining consistency to avoid final-week burnout.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">The “exam runway” plan (6 weeks)</h2>
        <p>Organize your transition from learning to responding with this structured timeline:</p>
        <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 my-10 rounded-r-xl">
          <ul className="list-none pl-0 space-y-4 mb-0">
            <li><strong>Weeks 1–2:</strong> Consolidate seminar and lecture notes into high-level issue maps.</li>
            <li><strong>Weeks 3–4:</strong> Move into timed practice and review sessions.</li>
            <li><strong>Weeks 5–6:</strong> Focus on identified weak spots, increasing your speed and maintaining calm.</li>
          </ul>
        </div>
        <p>
          The goal is to build a "mini pack" for every topic: 1 page of ISSUE MAP + 3 pillar cases + 2 common pitfalls 
          marks are often lost on.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Faster feedback loops for essays</h2>
        <p>
          Don't wait until the final draft to find a flaw in your reasoning. Use our Premium tools to 
          move from **Outline → Critique → Rewrite Outline → Draft**. By testing your thesis and 
          counterarguments early in the process, you reduce "fluff" and increase the impact of your 
          legal application.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">For Durham Law students</h2>
        <p>
          We understand the specific pressure points of the Durham academic year, particularly the workload 
          spikes that occur mid-term and just before Easter. Our support aims to help you manage 
          these without losing your momentum.
        </p>
        <p className="text-sm italic text-gray-500">
          Note: MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw helps</h2>
        <p>
          Premium users gain access to priority workflows, structured assignment stages, and faster 
          feedback tools. We encourage an ethical, tutor-led approach that empowers high achievers 
          to reach their full potential through disciplined study and deep understanding.
        </p>
        <div className="mt-8">
          <Link href="/pricing">
             <button className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
               View Plans
             </button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-16 mb-6 pt-10 border-t">FAQ</h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-900">Does premium support mean someone writes for me?</h4>
            <p className="text-gray-600 text-sm m-0">No. Our philosophy is built on ethical study assistance. We provide the tools to help *you* write better, faster, and more clearly, but you remains the sole author of your work.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">What should I focus on 10 days before exams?</h4>
            <p className="text-gray-600 text-sm m-0">Consolidate your issue maps and practice 15-minute planning sessions for every past paper question you can find.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">How can I improve legal analysis quickly?</h4>
            <p className="text-gray-600 text-sm m-0">Focus on the "Application" part of IRAC. High achievers spend the most time explaining *why* the rule leads to a specific conclusion in this specific scenario.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">How do I avoid burnout in revision season?</h4>
            <p className="text-gray-600 text-sm m-0">Set a firm "stop time" every night. Consistency is more powerful than 18-hour study binges that leave you exhausted the next day.</p>
          </div>
        </div>

        <p className="mt-20 text-[10px] text-gray-400 text-center uppercase tracking-widest">
          MyDurhamLaw is an independent study companion and is not affiliated with Durham University.
        </p>
      </div>
    </LearnLayout>
  );
}
