
// src/pages/dashboard.tsx
import React from 'react';
import GreetingWidget from '@/components/dashboard/GreetingWidget';
import { WelcomeWidget } from '@/components/dashboard/WelcomeWidget';
import { ProgressWidget } from '@/components/dashboard/ProgressWidget';
import UpcomingDeadlinesWidget from '@/components/dashboard/UpcomingDeadlinesWidget';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import { StudyFocusWidget } from '@/components/dashboard/StudyFocusWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Your personalized study companion</p>
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
    </main>
  );
}
