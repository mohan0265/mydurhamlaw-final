import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { Zap, Users, MessageSquare, Clock } from 'lucide-react';

export default function RealTimeCollaboration() {
  return (
    <LearnLayout
      title="Real-time Collaboration & Accountability"
      description="Setting up study groups and using MyDurhamLaw to stay accountable with your peers throughout the academic year."
      slug="real-time-collaboration"
      relatedArticles={[
        { title: 'Always With You: Wellbeing', slug: 'always-with-you' },
        { title: 'Smart Chat Interface', slug: 'smart-chat-interface' }
      ]}
    >
      <div className="prose prose-blue max-w-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-0">Real-time Collaboration</h1>
            <p className="text-gray-500 font-medium">Accountability in the legal community</p>
          </div>
        </div>

        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          Law is rarely a solo sport. In professional practice, collaboration is key. 
          MyDurhamLaw mirrors this by providing tools that help you sync up with your classmates, 
          share insights from seminars, and keep each other on track during the long haul 
          from Michaelmas to Easter term.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Digital Study Groups</h2>
        <p>
          Instead of fragmented WhatsApp groups, MyDurhamLaw allows you to create focused study spaces. 
          Use the **Presence** system to see when your group members are active. If your three best 
          friends are in the "Law Library" zone, you're much more likely to join them and get your 
          reading done.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 italic font-medium">
            <h3 className="text-lg font-bold text-gray-900 mb-2 not-italic underline decoration-blue-200">Shared Accountability</h3>
            "Nothing beats the feeling of seeing your whole study group 'Online' at 9:00 AM. It keeps the procrastination at bay."
          </div>
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 italic font-medium">
            <h3 className="text-lg font-bold text-gray-900 mb-2 not-italic underline decoration-blue-200">Contextual Chat</h3>
            "We used the Smart Chat to debate a mock exam question together. The AI acted as the mediator for our arguments."
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Seminar & Tutorial Prep</h2>
        <p>
          Preparing for a 50-minute tutorial can take hours. By collaborating in real-time on our 
          platform, you can divvy up the core reading list, summarize different perspectives on a 
          landmark case, and then come together to synthesize a comprehensive "group view" before 
          you walk into the room.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw Helps</h2>
        <p>
          Our platform reduces the friction of group work. Whether you're sharing a revision schedule or 
          quickly checking in on a peer's status, we make the community aspect of law school 
          effortless. Explore our <Link href="/pricing" className="text-blue-600 font-bold hover:underline">community-focused plans</Link> today.
        </p>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-blue-200 decoration-2 underline-offset-4">Can I share my AI chat sessions?</h4>
              <p className="text-gray-600 text-sm m-0">
                Yes! You can generate a shareable link for any AI conversation, making it easy to 
                show your group how you arrived at a particular legal conclusion.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-blue-200 decoration-2 underline-offset-4">Is group study effective for Law?</h4>
              <p className="text-gray-600 text-sm m-0">
                Highly so. Explaining a complex concept like *Equity* or *Land Law* to a peer is 
                one of the best ways to solidify your own understanding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
