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
import UpcomingAssignmentsWidget from '@/components/dashboard/UpcomingAssignmentsWidget';
// ... (keep other imports)

// ...

              {/* Row 2 */}
              <div className="h-full">
                <DurhamPortalCard />
              </div>
              <div>
                <UpcomingAssignmentsWidget userId={user.id} />
              </div>
              <div className="opacity-70 grayscale hover:grayscale-0 transition-all">
                {/* Legacy deadlines widget, keeping for reference or calendar events */}
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
                <ProgressWidget />
              </div>
              <div>
                <QuickActionsWidget />
              </div>

               {/* Row 4 */}
               <div className="lg:col-span-1">
                 <MemoryJournalWidget />
               </div>
               <div className="lg:col-span-2">
                 <WellbeingTipWidget />
               </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
