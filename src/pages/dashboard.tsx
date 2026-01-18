// src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

// Icons
// Use Lucide icons instead of emojis
import { BookOpen, FileText, Calendar, Target, Shield, CheckCircle, HelpCircle, MessageSquare, Heart, Video } from 'lucide-react';

// Components
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth() || { user: null, loading: true };
  const [focusItem, setFocusItem] = useState<{title: string, type: string, link: string} | null>(null);
  const [supportExpanded, setSupportExpanded] = useState(false);

  useEffect(() => {
    if (!loading && user) {
       // Fetch focus signals if needed (minimized for now as per spec)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium">Loading...</div>;
  if (!user) { router.replace('/login'); return null; }

  return (
    <>
      <Head>
        <title>Dashboard - MyDurhamLaw</title>
      </Head>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 1) STATUS BAR STRIP (Compact, Premium) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
           <div className="flex flex-col">
              <span className="text-sm sm:text-base font-semibold text-gray-900">Good afternoon, {user.user_metadata?.first_name || 'Student'}</span>
              <span className="text-xs sm:text-sm text-gray-500">Foundation Year | Durham Law</span>
           </div>
           
           <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                 Trial | 14 days left
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                 Next due: 2d
              </span>
              <button onClick={() => router.push('/onboarding')} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition">
                 Complete Setup
              </button>
           </div>
        </div>

        {/* 2) CORE ACTIONS GRID (Hero Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* My Lectures */}
           <CoreActionCard 
              title="My Lectures"
              subtitle="Turn transcripts into structured notes, key points, and lecturer emphasis."
              icon={<BookOpen className="h-5 w-5 text-purple-600" />}
              stat="Last processed: Today"
              cta="Open"
              link="/study/lectures"
              secondaryLink={{ label: "Upload transcript", href: "/study/lectures?action=upload" }}
           />
           {/* Assignments */}
           <CoreActionCard 
              title="Assignments"
              subtitle="Break briefs into steps, track deadlines, and keep momentum."
              icon={<FileText className="h-5 w-5 text-orange-600" />}
              stat="Next due: 3d"
              cta="View"
              link="/assignments"
              secondaryLink={{ label: "Active now", href: "/assignments?view=active" }}
           />
           {/* YAAG */}
           <CoreActionCard 
              title="Year at a Glance"
              subtitle="See the full year in 3 terms — workload, deadlines, and peaks."
              icon={<Calendar className="h-5 w-5 text-blue-600" />}
              stat="This week: 14"
              cta="Open"
              link="/year-at-a-glance"
              secondaryLink={{ label: "Week view", href: "/year-at-a-glance?view=week" }}
           />
           {/* Exam Prep */}
           <CoreActionCard 
              title="Exam Prep"
              subtitle="Integrity-safe practice prompts built from what you learned."
              icon={<Target className="h-5 w-5 text-green-600" />}
              stat="Signals: 12"
              cta="Start"
              link="/exam-prep"
              secondaryLink={{ label: "Revision list", href: "/exam-prep" }}
           />
        </div>

        {/* 3) UPCOMING DEADLINES (Feature Section) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
               <h3 className="text-base font-semibold text-gray-900">Upcoming Deadlines</h3>
               <Link href="/assignments" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition">View all</Link>
            </div>
            {/* Using the component but wrapped in our style - ideally component should be unstyled or flexible */}
            {/* For now, we inject it here. To perfectly match spec, we might need to refactor UpcomingDeadlines later. */}
            <UpcomingDeadlines embedded={true} /> 
        </div>

        {/* 4) SECONDARY GRID (Below Fold) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           {/* Focus - Wide */}
           <div className="lg:col-span-2 space-y-4">
              {/* Today's Focus Widget equivalent */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md flex items-center justify-between relative overflow-hidden h-[130px]">
                  <div className="relative z-10">
                      <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Today's Focus</div>
                      <div className="text-xl font-bold leading-tight mb-2">{focusItem?.title || "Clear Schedule"}</div>
                      <div className="text-sm opacity-80 mb-0">{focusItem?.title ? "Keep momentum going." : "Check your YAAG to plan ahead."}</div>
                  </div>
                  <button onClick={() => router.push(focusItem?.link || '/year-at-a-glance')} className="relative z-10 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white/20 text-white hover:bg-white/30 transition border border-white/10">
                      {focusItem ? "Continue" : "Plan"}
                  </button>
                  <Target className="absolute right-[-10px] bottom-[-20px] w-32 h-32 text-indigo-500/30" />
              </div>

              {/* Tasks */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-[300px] flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900">Today's Tasks</h3>
                    <Link href="/my/tasks" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition">View all</Link>
                 </div>
                 <TodaysTasksWidget />
              </div>
           </div>

           {/* Right Col */}
           <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-0 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                     <h3 className="text-base font-semibold text-gray-900">Memory Journal</h3>
                     <Link href="/my/journal" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition">View journal</Link>
                  </div>
                  <MemoryJournalWidget />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm overflow-hidden flex flex-col justify-between h-[200px]">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Wellbeing</h3>
                    <p className="text-sm text-gray-600 leading-snug">Small resets that protect focus, sleep, and confidence.</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {/* Placeholder illustration or tip */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg max-w-[200px]">
                       <p className="text-xs text-blue-800 font-medium italic">"Rest is not a reward. It's necessary fuel."</p>
                    </div>
                  </div>
                  <Link href="/wellbeing" className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition">
                     Open Wellbeing
                  </Link>
              </div>
           </div>
        </div>

        {/* INTEGRITY / FOOTER */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center pb-24">
             <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
               <Shield className="w-4 h-4 text-gray-400" />
               <span className="text-xs text-gray-500">Built for academic integrity</span>
             </div>
        </div>

      </main>

      {/* 5) COLLAPSED SUPPORT WIDGET (Floating) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 items-end">
         {supportExpanded && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-3 w-48 animate-in slide-in-from-bottom-2 fade-in duration-200 mb-2">
               <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" /> Durmah
               </button>
               <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" /> Always With You
               </button>
               <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-500" /> Help Centre
               </button>
            </div>
         )}
         <button 
           onClick={() => setSupportExpanded(!supportExpanded)}
           className="rounded-2xl px-5 py-3 bg-white text-purple-900 font-bold shadow-lg border border-gray-100 hover:shadow-xl transition-all flex items-center gap-2"
         >
            {supportExpanded ? 'Close' : 'Support'}
         </button>
      </div>
    </>
  );
}

function CoreActionCard({ title, subtitle, icon, stat, cta, link, secondaryLink }: any) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 h-[150px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
       {/* Top: Icon + Stat */}
       <div className="flex items-start justify-between gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-105 transition-transform">
             {icon}
          </div>
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
             {stat}
          </span>
       </div>

       {/* Middle: Title/Sub */}
       <div>
          <h3 className="text-base font-semibold text-gray-900 leading-tight">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500 leading-snug line-clamp-1">{subtitle}</p>
       </div>

       {/* Bottom: Actions */}
       <div className="flex items-center justify-between gap-3 mt-1">
          {secondaryLink ? (
             <Link href={secondaryLink.href} className="text-sm font-medium text-gray-400 hover:text-purple-600 transition truncate">
                {secondaryLink.label}
             </Link>
          ) : <div />}
          
          <Link href={link} className="inline-flex items-center justify-center rounded-xl px-3.5 py-1.5 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition min-w-[70px]">
             {cta}
          </Link>
       </div>
    </div>
  )
}
