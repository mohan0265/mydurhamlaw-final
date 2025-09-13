
import React from 'react';
import GreetingWidget from './GreetingWidget';
import TodaysTasksWidget from './TodaysTasksWidget';
import UpcomingDeadlinesWidget from './UpcomingDeadlinesWidget';
import WellbeingTipWidget from './WellbeingTipWidget';
import MemoryJournalWidget from './MemoryJournalWidget';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="p-4 sm:p-6 lg:p-8">
        <GreetingWidget />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TodaysTasksWidget />
          <UpcomingDeadlinesWidget />
          <WellbeingTipWidget />
          <MemoryJournalWidget />
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
