import React from 'react';
import Link from 'next/link';
import { LearnLayout } from '@/components/layout/LearnLayout';
import { MessageSquare, Zap, Terminal, Search } from 'lucide-react';

export default function SmartChatInterface() {
  return (
    <LearnLayout
      title="Smart Chat: Effective Legal Prompting for Students"
      description="How Durham Law students can ask better questions and get context-aware answers from legal AI."
      slug="smart-chat-interface"
      relatedArticles={[
        { title: 'AI Study Assistant', slug: 'ai-study-assistant' },
        { title: 'Real-time Collaboration', slug: 'real-time-collaboration' }
      ]}
    >
      <div className="prose prose-blue max-w-none">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-0">Smart Chat Interface</h1>
            <p className="text-gray-500 font-medium">Communicating with legal intelligence</p>
          </div>
        </div>

        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          Not all AI chats are created equal. The MyDurhamLaw **Smart Chat Interface** is specifically 
          tuned for the legal domain. However, to get the most out of it, you need to know how to 
          frame your inquiries—moving from simple questions to sophisticated legal prompts.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Turning Lecture Notes into Insights</h2>
        <p>
          Once you've uploaded your lecture transcripts or notes, the Smart Chat has full context of 
          what was discussed in your theater. Instead of a generic prompt like "Explain duty of care," 
          try:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 my-8 overflow-x-auto">
          <pre className="text-blue-400 font-mono text-sm leading-relaxed m-0">
            {`"In today's lecture on Tort, Professor [Name] mentioned the 'Caparo test'. \nCan you explain how this relates to the 'incremental' approach \ndiscussed in the pre-reading cases?"`}
          </pre>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Prompting Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Terminal className="w-6 h-6 text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Be Specific</h3>
            <p className="text-sm text-gray-600 m-0">
              Mention specific statutes, sections, or paragraph numbers in case law to pin down the AI's reasoning.
            </p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <Search className="w-6 h-6 text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Iterative Refinement</h3>
            <p className="text-sm text-gray-600 m-0">
              Don't stop at the first answer. Ask: "Can you provide a counter-argument to that point?"
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Context-Aware Responses</h2>
        <p>
          Unlike generic chatbots, our Smart Chat understands the Durham curriculum. It knows whether 
          you're in Foundation, Year 1, or Year 3, and tailors the complexity and relevance of its 
          responses to match your academic level.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">How MyDurhamLaw Helps</h2>
        <p>
          By providing a chat interface that understands your specific academic context, we reduce 
          the time you spend "fighting" with the software and maximize the time you spend thinking 
          about the law. Experience the difference with our 
          <Link href="/pricing" className="text-blue-600 font-bold hover:underline"> Core and Pro plans</Link>.
        </p>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-blue-200 decoration-2 underline-offset-4">Does the chat save my history?</h4>
              <p className="text-gray-600 text-sm m-0">
                Yes, all conversations are saved so you can refer back to them during revision. 
                You can also delete or archive sessions whenever you like.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-2xl">
              <h4 className="font-bold text-gray-900 mb-2 underline decoration-blue-200 decoration-2 underline-offset-4">Can I ask for help with exam topics?</h4>
              <p className="text-gray-600 text-sm m-0">
                Yes! The AI is excellent for testing your knowledge. Ask it to "Quiz me on the principles of Equity" 
                for a dynamic revision session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
