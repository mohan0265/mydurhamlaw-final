import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Star, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function PremiumSupport() {
  return (
    <LearnLayout
      title="Premium Support & Exam Excellence"
      description="Revision strategies for high-performers to manage burnout and structure revision during final Durham Law terms."
      slug="premium-support"
      relatedArticles={[
        { title: 'AI Study Assistant', slug: 'ai-study-assistant' },
        { title: 'Academic Integrity', slug: 'academic-integrity' }
      ]}
    >
      <div className="prose prose-indigo max-w-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-0">Premium Support</h1>
            <p className="text-gray-500 font-medium">Excellence and revision strategy</p>
          </div>
        </div>

        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          When the Easter term arrive and exams are on the horizon, the difference between a 
          2:1 and a First often comes down to efficiency and support. **Premium Support** at 
          MyDurhamLaw is designed for students who need prioritized help and high-level 
          revision tools to stay ahead of the curve.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Prioritized AI Assistance</h2>
        <p>
          During peak exam periods, server load for AI services can increase. Our Pro and Core 
          users receive priority access to our most powerful models, ensuring that your 
          revision sessions are never interrupted by lag or downtime.
        </p>

        <div className="bg-indigo-900 text-white rounded-2xl p-8 my-10 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
            The High-Performer's Toolkit
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0 text-indigo-100">
            <li className="flex gap-2">
              <Zap className="w-4 h-4 text-indigo-300 shrink-0 mt-1" />
              <span>Unlimited Voice Minutes for spoken revision.</span>
            </li>
            <li className="flex gap-2">
              <Zap className="w-4 h-4 text-indigo-300 shrink-0 mt-1" />
              <span>Advanced reasoning models for Case Analysis.</span>
            </li>
            <li className="flex gap-2">
              <Zap className="w-4 h-4 text-indigo-300 shrink-0 mt-1" />
              <span>24/7 Priority Support for technical inquiries.</span>
            </li>
            <li className="flex gap-2">
              <Zap className="w-4 h-4 text-indigo-300 shrink-0 mt-1" />
              <span>Exclusive revision guides and templates.</span>
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Structuring Revision</h2>
        <p>
          Revision is about coverage and depth. Use our **Study Sprint Mode** to timebox your 
          learning. The AI can help you create a personalized revision timetable based on your 
          weakest modules, ensuring you don't spend all your time on your favorite subjects 
          while neglecting the harder ones.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Avoiding Burnout</h2>
        <p>
          High achievement shouldn't come at the cost of your mental health. Our Premium support 
          includes reminders to take breaks and integrated wellbeing checks. We want you to walk 
          into the exam hall at Durham feeling prepared, not exhausted.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw Helps</h2>
        <p>
          We provide the infrastructure for your success. By combining our best AI tech with 
          proactive support, we ensure nothing stands between you and your potential. 
          Upgrade to a <Link href="/pricing" className="text-indigo-600 font-bold hover:underline">Pro plan</Link> today to 
          unlock the full suite of high-performance tools.
        </p>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-indigo-200 decoration-2 underline-offset-4">What makes "Pro" better for exams?</h4>
              <p className="text-gray-600 text-sm m-0">
                Pro users get higher upload limits for lecture recordings and more advanced 
                reasoning capabilities, which are essential for the multi-step problem 
                questions found in Law exams.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-indigo-200 decoration-2 underline-offset-4">Is there priority technical support?</h4>
              <p className="text-gray-600 text-sm m-0">
                Yes. Pro members have a direct line to our success team to resolve any 
                platform issues within hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
