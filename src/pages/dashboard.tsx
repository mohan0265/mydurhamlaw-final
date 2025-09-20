// src/pages/dashboard.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';

// Billing / trial
import { TrialBanner } from '@/components/billing/TrialBanner';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';

// Existing widgets
import GreetingWidget from '@/components/dashboard/GreetingWidget';
import { WelcomeWidget } from '@/components/dashboard/WelcomeWidget';
import { ProgressWidget } from '@/components/dashboard/ProgressWidget';
import UpcomingDeadlinesWidget from '@/components/dashboard/UpcomingDeadlinesWidget';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import { StudyFocusWidget } from '@/components/dashboard/StudyFocusWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';
import DurmahWidget from '@/components/DurmahWidget';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth() || { user: null };

  return (
    <>
      <Head>
        <title>Dashboard - MyDurhamLaw</title>
      </Head>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Your personalized study companion</p>
        </div>

        <div className="mb-6">
          <DurmahWidget />
        </div>

        {/* Signed-out state */}
        {!user && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome back to MyDurhamLaw
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to see your study overview, deadlines, and wellbeing tools.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Start Free Trial
              </Link>
              <Link
                href="/year-at-a-glance"
                className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
              >
                Explore Year-at-a-Glance
              </Link>
            </div>
          </div>
        )}

        {/* Signed-in: show trial + subscription status then widgets */}
        {user && (
          <>
            {/* Trial + Subscription row */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <TrialBanner
                  userId={user.id}
                  onUpgrade={() => router.push('/pricing')}
                />
              </div>
              <div className="lg:col-span-1">
                <SubscriptionStatus
                  userId={user.id}
                  onUpgrade={() => router.push('/pricing')}
                />
              </div>
            </div>

            {/* Quick links row (optional, small helper nav) */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/year-at-a-glance"
                className="rounded-xl border bg-white p-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Year-at-a-Glance
              </Link>
              <Link
                href="/study-schedule"
                className="rounded-xl border bg-white p-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Study Schedule
              </Link>
              <Link
                href="/assignments"
                className="rounded-xl border bg-white p-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Assignments
              </Link>
              <Link
                href="/wellbeing"
                className="rounded-xl border bg-white p-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Durmah (Wellbeing)
              </Link>
            </div>

            {/* Responsive widgets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Row 1 */}
              <div className="lg:col-span-2">
                <GreetingWidget />
              </div>
              <div>
                <WelcomeWidget />
              </div>

              {/* Row 2 */}
              <div>
                <ProgressWidget />
              </div>
              <div>
                <UpcomingDeadlinesWidget />
              </div>
              <div>
                <TodaysTasksWidget />
              </div>

              {/* Row 3 */}
              <div>
                <StudyFocusWidget />
              </div>
              <div>
                <QuickActionsWidget />
              </div>
              <div>
                <MemoryJournalWidget />
              </div>

              {/* Row 4 - Full width wellbeing tip */}
              <div className="lg:col-span-3">
                <WellbeingTipWidget />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
