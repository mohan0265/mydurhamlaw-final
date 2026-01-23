import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Users, Heart, Coffee, Shield } from 'lucide-react';

export default function AlwaysWithYou() {
  return (
    <LearnLayout
      title="Always With You: Student Wellbeing & Connection"
      description="How to balance the high pressure of a Durham Law degree with emotional wellbeing and family connection."
      slug="always-with-you"
      relatedArticles={[
        { title: 'Real-time Collaboration', slug: 'real-time-collaboration' },
        { title: 'Premium Support & Revison', slug: 'premium-support' }
      ]}
    >
      <div className="prose prose-pink max-w-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-0">Always With You (AWY)</h1>
            <p className="text-gray-500 font-medium">Prioritizing wellbeing in legal education</p>
          </div>
        </div>

        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          A law degree at Durham is rewarding, but it can also be isolating. The pressure of reading lists, 
          tutorial preparation, and summative deadlines can sometimes push social connection to the 
          periphery. The **Always With You** (AWY) feature was built to ensure that while you study hard, 
          you're never truly alone.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Managing Loneliness in Michaelmas</h2>
        <p>
          The transition to university life, especially in the first term, can be challenging. 
          AWY allows students to maintain a "presence" with their loved ones. Whether it's your parents 
          back home or a partner in another city, they can see when you're in the library and studying, 
          offering a sense of shared experience without the need for constant messaging.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
            <Heart className="w-6 h-6 text-pink-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Emotional Support</h3>
            <p className="text-sm text-gray-600 m-0">
              Knowing someone is "there" with you in spirit reduces the cognitive load of stress during 
              late-night revision sessions.
            </p>
          </div>
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <Coffee className="w-6 h-6 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Healthy Boundaries</h3>
            <p className="text-sm text-gray-600 m-0">
              Use AWY to show loved ones when you're "In the Zone," signaling that you're focused 
              and will respond to messages later.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Connecting with Loved Ones</h2>
        <p>
          AWY isn't just a status badge. It's an invitation for support. Parents can use the Parent Add-on 
          to receive weekly wellbeing scores (fully controlled by you), ensuring they can offer 
          encouragement exactly when it's needed most—like the week leading up to Epiphany exams.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw Helps</h2>
        <p>
          We believe that a happy student is a successful student. By bridging the gap between your 
          academic life and your support network, we help you maintain the stamina needed for a 
          qualifying law degree. Explore our <Link href="/pricing" className="text-pink-600 font-bold hover:underline">wellbeing features</Link> today.
        </p>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-pink-200 decoration-2 underline-offset-4">Is my privacy protected?</h4>
              <p className="text-gray-600 text-sm m-0">
                Absolutely. You have 100% control over who sees your status and what information is shared. 
                You can turn off AWY presence at any time with a single click.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-pink-200 decoration-2 underline-offset-4">What does the "Parent Add-on" include?</h4>
              <p className="text-gray-600 text-sm m-0">
                It allows a designated parent to see your study status and receive a high-level weekly 
                wellbeing summary, helping them stay connected to your journey without being intrusive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
