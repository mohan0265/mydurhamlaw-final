// src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

// Icons
import { BookOpen, FileText, Calendar, Target, Shield, CheckCircle } from 'lucide-react';

// Components
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';
import OnboardingProgressWidget from '@/components/onboarding/OnboardingProgressWidget';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth() || { user: null, loading: true };
  const [isLovedOne, setIsLovedOne] = useState(false);
  const [checking, setChecking] = useState(true);

  // Focus Item Data (Computed Real-ish)
  // In a full implementation, this would fetch from API based on logic (Next deadline or Lecture)
  // For now we use the "Next Up" logic from Assignments if available, or a default fallback.
  const [focusItem, setFocusItem] = useState<{title: string, type: string, link: string} | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setChecking(false);
        return;
      }
      checkRole();
      // Fetch a simple focus item signal
      // We can just rely on UpcomingDeadlines to be the main focus, 
      // but let's see if we can quickly get the nearest deadline to show in "Today's Focus"
      fetch('/api/dashboard/overview').then(res => {
        if(res.ok) return res.json();
      }).then(data => {
        if(data?.upcomingAssignments?.length > 0) {
           const next = data.upcomingAssignments[0];
           setFocusItem({
             title: next.title,
             type: 'Assignment Due',
             link: `/assignments?assignmentId=${next.id}`
           });
        }
      }).catch(err => console.error('Focus fetch error', err));
    }
  }, [user, loading]);

  const checkRole = async () => {
    const supabase = getSupabaseClient();
    if (!user || !supabase) return;
    
    // Check if loved one
    const { data: profile } = await supabase.from('profiles').select('user_role').eq('id', user.id).maybeSingle();
    if (profile?.user_role === 'loved_one') {
       setIsLovedOne(true);
       router.replace('/loved-one-dashboard');
       return;
    }
    setChecking(false);
  };

  if (loading || checking || isLovedOne) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium">Loading Dashboard...</div>;
  }

  if (!user) {
    // Unlikely to reach here due to protected route logic usually, but handled:
    router.replace('/login'); 
    return null; 
  }

  return (
    <>
      <Head>
        <title>Dashboard - MyDurhamLaw</title>
      </Head>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Welcome & Sub Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Your study command centre</p>
          </div>
          <div className="w-full md:w-auto">
             <SubscriptionStatus userId={user.id} onUpgrade={() => router.push('/pricing')} />
          </div>
        </div>

        {/* Onboarding (if pending) */}
        <div className="mb-8">
           <OnboardingProgressWidget />
        </div>

        {/* 1. CORE ACTIONS ROW (The "Grid of Power") */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <ValueCard 
            title="My Lectures"
            subtitle="Turn lectures into understanding — fast."
            body="Summaries, key points, glossary, and lecturer emphasis insights from your transcripts."
            ctaPrimary={{ label: "Open Lectures", href: "/study/lectures" }}
            ctaSecondary={{ label: "Upload Transcript", href: "/study/lectures?action=upload" }}
            stat="Next lecture: Today 2:00 PM"
            icon={<BookOpen className="w-6 h-6 text-purple-600" />}
            tooltip="Upload transcripts to unlock “Lecturer Emphasis” and targeted practice prompts."
            color="bg-purple-50/50 border-purple-100 hover:border-purple-300"
          />
          <ValueCard 
            title="Assignments"
            subtitle="Always know what’s due — and what to do next."
            body="Track deadlines, start early with structured planning, and keep progress visible."
            ctaPrimary={{ label: "View Assignments", href: "/assignments" }}
            ctaSecondary={{ label: "Start Next Task", href: "/assignments?view=active" }}
            stat="Next due: Contract Law · 3 days left"
            icon={<FileText className="w-6 h-6 text-orange-600" />}
            tooltip="Built to guide planning and improvement — not generate submissions."
            color="bg-orange-50/50 border-orange-100 hover:border-orange-300"
          />
          <ValueCard 
            title="Year-at-a-Glance"
            subtitle="Your whole year in one view."
            body="See term workload, key deadlines, and jump into month → week → day planning."
            ctaPrimary={{ label: "Open YAAG", href: "/year-at-a-glance" }}
            ctaSecondary={{ label: "Jump to This Week", href: "/year-at-a-glance?view=week" }}
            stat="Current term: Epiphany"
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            tooltip="YAAG is the backbone: everything links back to lectures, assignments, and exam prep."
            color="bg-blue-50/50 border-blue-100 hover:border-blue-300"
          />
          <ValueCard 
            title="Exam Prep"
            subtitle="Practise like a top student."
            body="Lecture-linked prompts, marking-style guidance, and revision checklists — integrity-safe."
            ctaPrimary={{ label: "Start Practice", href: "/exam-prep" }}
            ctaSecondary={{ label: "Open Exam Hub", href: "/exam-prep" }}
            stat="Revision focus: Tort Law"
            icon={<Target className="w-6 h-6 text-green-600" />}
            tooltip="Practice prompts build mastery. We don’t predict exam papers."
            color="bg-green-50/50 border-green-100 hover:border-green-300"
          />
        </div>

        {/* 2. REAL DATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Left Col: Tasks */}
          <div className="lg:col-span-1 h-[450px]">
            <TodaysTasksWidget />
          </div>

          {/* Middle Col: Deadlines (Visual Anchor) */}
          <div className="lg:col-span-1 h-[450px]">
             <UpcomingDeadlines />
          </div>

          {/* Right Col: Focus + Journal stacked */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-[450px]">
             {/* Today's Focus Card */}
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg flex-1 flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push(focusItem ? focusItem.link : '/year-at-a-glance')}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Target className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10">
                   <h3 className="text-indigo-200 font-bold text-xs uppercase tracking-wider mb-2">Today&apos;s Focus</h3>
                   {focusItem ? (
                     <>
                       <div className="text-xl font-bold leading-tight mb-1">{focusItem.title}</div>
                       <div className="text-sm opacity-80 mb-4">{focusItem.type}</div>
                       <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2">
                          Open Now <CheckCircle className="w-3 h-3" />
                       </button>
                     </>
                   ) : (
                     <>
                        <div className="text-lg font-bold leading-tight mb-2">Clear Schedule?</div>
                        <p className="text-sm opacity-80 mb-4">Check your year plan to stay ahead.</p>
                        <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                          Open YAAG
                        </button>
                     </>
                   )}
                </div>
             </div>

             {/* Journal Card (Compact version) */}
             <div className="flex-1">
                <MemoryJournalWidget />
             </div>
          </div>
        </div>

        {/* 3. TERTIARY ROW (Wellbeing only if space, or move into core flow) */}
        {/* We'll keep Wellbeing simple below the main grid */}
        <div className="mb-12">
           <WellbeingTipWidget />
        </div>

        {/* 4. INTEGRITY PANEL (Footer - Premium Strip) */}
        <div className="mt-8 border-t border-gray-100 pt-8 pb-4">
            <div className="max-w-3xl mx-auto text-center">
                 <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" /> Built for academic integrity
                 </h4>
                 <p className="text-sm text-gray-500 mb-2">
                    We help you understand, plan, and practise — we don’t generate work to submit as your own.
                 </p>
                 <Link href="/ethics" className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline">
                    Read Guidelines
                 </Link>
            </div>
        </div>

      </main>
    </>
  );
}

function ValueCard({ title, subtitle, body, ctaPrimary, ctaSecondary, stat, icon, href, color, tooltip }: any) {
  return (
    <div className={`block rounded-xl border transition-all hover:shadow-lg ${color} group flex flex-col h-full bg-white relative overflow-hidden`}>
      {/* Header */}
      <div className="p-5 pb-3">
         <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-gray-700">
               {icon}
            </div>
            {tooltip && (
               <div className="text-gray-300 hover:text-gray-500 cursor-help" title={tooltip}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
            )}
         </div>
         <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{title}</h3>
         <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{subtitle}</p>
         <p className="text-sm text-gray-600 leading-relaxed min-h-[3rem]">{body}</p>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats Script */}
      <div className="px-5 py-2 border-t border-gray-50 bg-gray-50/50">
         <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {stat}
         </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-3 flex items-center gap-3">
          <Link href={ctaPrimary.href} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-lg text-center transition-colors shadow-sm">
             {ctaPrimary.label}
          </Link>
          {ctaSecondary && (
            <Link href={ctaSecondary.href} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold py-2.5 rounded-lg text-center transition-colors">
               {ctaSecondary.label}
            </Link>
          )}
      </div>
    </div>
  );
}
