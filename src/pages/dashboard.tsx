// src/pages/dashboard.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';

// Billing / trial
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import { BookOpen, FileText, Calendar, Target, User } from 'lucide-react';

// Existing widgets
import GreetingWidget from '@/components/dashboard/GreetingWidget';
import { WelcomeWidget } from '@/components/dashboard/WelcomeWidget';
import { ProgressWidget } from '@/components/dashboard/ProgressWidget';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import { StudyFocusWidget } from '@/components/dashboard/StudyFocusWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import dynamic from 'next/dynamic';
const MyLecturesWidget = dynamic(() => import('@/components/dashboard/MyLecturesWidget'), { ssr: false });
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';
import { DurhamPortalCard } from '@/components/dashboard/DurhamPortalCard';

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
            {/* Subscription status - single consolidated view */}
            <div className="mb-8">
              <SubscriptionStatus
                userId={user.id}
                onUpgrade={() => router.push('/pricing')}
              />
            </div>

            {/* Quick links row - Student workflow priority: Lectures > Assignments > YAAG > Exam Prep > Profile */}
            <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link
                href="/study/lectures"
                className="rounded-xl border bg-purple-50 p-4 text-sm font-bold text-purple-800 hover:bg-purple-100 border-purple-100 transition-colors flex items-center gap-2"
                title="My lecture recordings and notes"
              >
                <BookOpen className="w-4 h-4" /> My Lectures
              </Link>
              <Link
                href="/assignments"
                className="rounded-xl border bg-orange-50 p-4 text-sm font-bold text-orange-800 hover:bg-orange-100 border-orange-100 transition-colors flex items-center gap-2"
                title="View and manage your assignments"
              >
                <FileText className="w-4 h-4" /> Assignments
              </Link>
              <Link
                href="/year-at-a-glance"
                className="rounded-xl border bg-blue-50 p-4 text-sm font-medium text-blue-800 hover:bg-blue-100 border-blue-100 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Year-at-a-Glance
              </Link>
              <Link
                href="/study-schedule"
                className="rounded-xl border bg-green-50 p-4 text-sm font-medium text-green-800 hover:bg-green-100 border-green-100 transition-colors flex items-center gap-2"
                title="Exam preparation and study schedule"
              >
                <Target className="w-4 h-4" /> Exam Prep
              </Link>
              <Link
                href="/profile-timetable"
                className="rounded-xl border bg-gray-50 p-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                title="Setup your profile and timetable"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
            </div>

            {/* Responsive widgets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Row 1 - Welcome */}
              <div>
                <GreetingWidget />
              </div>
              <div>
                <WelcomeWidget />
              </div>

              {/* Row 2 - HERO ROW: My Lectures + My Assignments (above fold) */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-1">
                <MyLecturesWidget />
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-1">
                <UpcomingDeadlines />
              </div>
            </div>

            {/* Secondary widgets grid - 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Row 3 - Focus / Progress / Tasks */}
              <div>
                <TodaysTasksWidget />
              </div>
              <div>
                <StudyFocusWidget />
              </div>
              <div>
                <ProgressWidget />
              </div>

              {/* Row 4 - Durham Portal / Memory / Wellbeing */}
              <div>
                <DurhamPortalCard />
              </div>
              <div>
                <MemoryJournalWidget />
              </div>
              <div>
                <WellbeingTipWidget />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
