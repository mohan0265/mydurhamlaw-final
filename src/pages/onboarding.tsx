import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { ChevronLeft, Info, HelpCircle, ExternalLink } from 'lucide-react';
import OnboardingProgressWidget from '@/components/onboarding/OnboardingProgressWidget';

const HELP_DOCS = [
  {
    category: 'timetable',
    title: 'How to sync your timetable',
    url: '/help/timetable-sync',
    description: 'Learn how to import your Durham Calendar (ICS) or manually add events.',
  },
  {
    category: 'assignments',
    title: 'Managing assignments',
    url: '/help/assignments-guide',
    description: 'Track deadlines, break down tasks, and get AI assistance.',
  },
  {
    category: 'lectures',
    title: 'Importing lectures from Panopto',
    url: '/help/panopto-import',
    description: 'Automatically import recordings to get transcripts and summaries.',
  },
  {
    category: 'awy',
    title: 'Always With You (AWY)',
    url: '/help/awy-setup',
    description: 'Stay connected with loved ones while you study.',
  },
];

export default function OnboardingHub() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Getting Started - MyDurhamLaw</title>
      </Head>

      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Getting Started with MyDurhamLaw</h1>
            <p className="mt-2 text-lg text-gray-600">
              Complete these steps to unlock the full potential of your AI study companion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column: Checklist */}
            <div className="lg:col-span-2 space-y-6">
              <OnboardingProgressWidget />

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-500" />
                  Why complete setup?
                </h2>
                <div className="prose prose-sm text-gray-600">
                  <p>
                    MyDurhamLaw works best when it knows your schedule and workload.
                    By connecting these sources, you enable features like:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Smart Reminders:</strong> Durmah will remind you of upcoming deadlines based on your assignments.
                    </li>
                    <li>
                      <strong>Contextual Help:</strong> Ask "What's my next lecture?" or "Help me plan for my Contract Law essay".
                    </li>
                    <li>
                      <strong>Wellness Checks:</strong> AWY ensures you stay connected with your support network during stressful exam periods.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar: Help Resources */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  Help & Guides
                </h2>
                <div className="space-y-4">
                  {HELP_DOCS.map((doc) => (
                    <a
                      key={doc.title}
                      href={doc.url}
                      className="block p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                      onClick={(e) => {
                        e.preventDefault();
                        // Placeholder for real docs link - for now just toast or log
                        console.log('Open help doc:', doc.url);
                        alert(`Help guide for "${doc.title}" coming soon!`);
                      }}
                    >
                      <h3 className="text-sm font-medium text-purple-700 group-hover:text-purple-900 flex items-center justify-between">
                        {doc.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-2">Need personal help?</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Durmah is always here to assist. Just click the floating chat button.
                </p>
                <button
                  onClick={() => {
                   // Dispatch event to open Durmah
                   const event = new CustomEvent('durmah:open', {
                     detail: { text: "I need help with setting up my account." }
                   });
                   window.dispatchEvent(event);
                  }}
                  className="w-full py-2 bg-white text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Ask Durmah
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
