// src/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

// Icons
import { BookOpen, FileText, Calendar, Target, Shield, CheckCircle, HelpCircle, ArrowRight, Zap, Heart, Video, MoreHorizontal, Clock, TrendingUp } from 'lucide-react';

// Components
import { QuizMeCard } from '@/components/quiz/QuizMeCard';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import TodaysTasksWidget from '@/components/dashboard/TodaysTasksWidget';
import MemoryJournalWidget from '@/components/dashboard/MemoryJournalWidget';
import WellbeingTipWidget from '@/components/dashboard/WellbeingTipWidget';

import CountdownTimer from '@/components/ui/CountdownTimer';

import { useUserDisplayName } from '@/hooks/useUserDisplayName';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth() || { user: null, loading: true };
  const { displayName } = useUserDisplayName();
  const [focusItem, setFocusItem] = useState<{title: string, type: string, link: string, due_date?: string} | null>(null);
  const [nextAssignment, setNextAssignment] = useState<any>(null);
  const [supportExpanded, setSupportExpanded] = useState(false);

  useEffect(() => {
    if (!loading && user) {
       fetch('/api/dashboard/overview').then(res => {
        if(res.ok) return res.json();
      }).then(data => {
        if(data?.upcomingAssignments?.length > 0) {
           const next = data.upcomingAssignments[0];
           setNextAssignment(next);
           setFocusItem({
             title: next.title,
             type: 'Assignment Due',
             link: `/assignments?assignmentId=${next.id}`,
             due_date: next.due_date // Pass due date for timer
           });
        }
      }).catch(err => console.error('Focus fetch error', err));
    }
  }, [user, loading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-medium">Loading...</div>;
  if (!user) { router.replace('/login'); return null; }

  const firstName = displayName || user.user_metadata?.first_name || 'Student';

  return (
    <>
      <Head>
        <title>Dashboard - MyDurhamLaw</title>
      </Head>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1) PREMIUM STATUS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-2xl font-bold text-gray-900">Good afternoon, {firstName}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                 <span>Foundation Year</span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <span>Durham Law</span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <span className="text-green-600 font-medium">Last activity: Today</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                 <span className="text-xs font-semibold text-gray-900">Pro Trial Active</span>
                 <span className="text-xs text-gray-500">14 days remaining</span>
              </div>
              <button onClick={() => router.push('/study/lectures')} className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition">
                 <BookOpen className="w-4 h-4 text-purple-600" />
                 Current Module
              </button>
              <button onClick={() => router.push('/onboarding')} className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition">
                 <Target className="w-4 h-4" />
                 Complete Setup
              </button>
           </div>
        </div>

        {/* 2) NEXT BEST ACTION (Smart Steering) */}
        <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl text-white">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                 <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">Next Best Action</span>
                 </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                     {focusItem ? `Continue working on ${focusItem.title}` : "Start your Contract Law revision"}
                  </h2>
                  <div className="text-indigo-100 text-base md:text-lg max-w-xl">
                     {focusItem ? (
                        <div className="flex flex-col gap-1">
                           <span>You have a deadline approaching.</span>
                           {focusItem.due_date && (
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-sm opacity-80">Time Remaining:</span>
                                 <CountdownTimer dueDate={focusItem.due_date} style="banner" showSeconds={true} />
                              </div>
                           )}
                        </div>
                     ) : (
                        "Based on your recent lectures, this is the highest-impact focus area."
                     )}
                  </div>
               </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 <button onClick={() => router.push(focusItem?.link || '/study/lectures')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-900 font-bold px-6 py-3.5 hover:bg-indigo-50 transition shadow-lg whitespace-nowrap">
                    {focusItem ? "Continue Assignment" : "Start Revision"} <ArrowRight className="w-4 h-4" />
                 </button>
                 <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 text-white font-semibold px-4 py-3.5 hover:bg-white/20 transition border border-white/10 backdrop-blur-sm whitespace-nowrap group">
                    <HelpCircle className="w-4 h-4 text-indigo-200" />
                    <span className="text-sm">Why this?</span>
                    {/* Tooltip hint */}
                    <span className="absolute bottom-full mb-2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Highest impact / nearest due date</span>
                 </button>
              </div>
           </div>
        </div>

        {/* 3) CORE PROOF CARDS (Premium Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
           
           {/* MY LECTURES - Live Proof */}
           <CoreActionCard 
              title="My Lectures"
              icon={<BookOpen className="w-5 h-5 text-purple-600" />}
              link="/study/lectures"
              preview={
                 <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-purple-50 p-2 rounded border border-purple-100">
                       <Shield className="w-3 h-3 text-purple-500" />
                       <span className="truncate">Last: Intro to Tort Law</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 px-1">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                       Processing complete
                    </div>
                 </div>
              }
           />

           {/* ASSIGNMENTS - Workflow Proof */}
           <CoreActionCard 
              title="Assignments"
              icon={<FileText className="w-5 h-5 text-orange-600" />}
              link={nextAssignment 
                  ? `/assignments?assignmentId=${nextAssignment.id}${nextAssignment.current_stage > 0 ? `&view=workflow&stage=${nextAssignment.current_stage}` : ''}`
                  : "/assignments"}
              preview={
                 nextAssignment ? (
                     <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                           <span className="font-medium text-gray-700 truncate" title={nextAssignment.title}>
                              {nextAssignment.title}
                           </span>
                           <span className={`font-bold whitespace-nowrap ${nextAssignment.daysLeft <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                              {nextAssignment.daysLeft <= 0 ? 'Due Today' : `Due ${nextAssignment.daysLeft}d`}
                           </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                           <div 
                              className={`h-1.5 rounded-full transition-all ${nextAssignment.daysLeft <= 3 ? 'bg-red-500' : 'bg-orange-500'}`}
                              style={{ width: `${Math.max(5, (nextAssignment.current_stage / 6) * 100)}%` }}
                           ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                           <span>Stage {nextAssignment.current_stage || 0}/6</span>
                           <span className="font-medium text-gray-900 capitalize truncate max-w-[80px]">
                              {nextAssignment.status === 'not_started' ? 'Not Started' : nextAssignment.status?.replace('_', ' ') || 'Active'}
                           </span>
                        </div>
                     </div>
                  ) : (
                     <div className="mt-3 flex flex-col justify-center h-full min-h-[60px] text-center">
                        <span className="text-xs text-gray-400">No active assignments</span>
                        <span className="text-[10px] text-gray-300">Great job!</span>
                     </div>
                  )
              }
           />

           {/* YAAG - Visual Strip */}
           <CoreActionCard 
              title="Year at a Glance"
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
              link="/year-at-a-glance"
              preview={
                 <div className="mt-3 flex gap-1">
                    {[1,2,3].map(term => (
                       <div key={term} className={`flex-1 h-8 rounded border flex items-center justify-center text-[10px] font-bold ${
                          term === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-100'
                       }`}>
                          T{term}
                       </div>
                    ))}
                 </div>
              }
           />

           {/* EXAM PREP - Daily Set */}
           <CoreActionCard 
              title="Exam Prep"
              icon={<Target className="w-5 h-5 text-green-600" />}
              link="/exam-prep"
              preview={
                 <div className="mt-3 bg-green-50 rounded border border-green-100 p-2 text-center">
                    <div className="text-xs font-bold text-green-800">Today's Set</div>
                    <div className="text-[10px] text-green-700 mt-0.5">5 Practice Prompts Ready</div>
                 </div>
              }
           />
        </div>

        {/* 4) USP SPOTLIGHT & DEADLINES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Col: Deadlines + USP */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Upcoming Deadlines (Existing) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1">
                 <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-gray-500" /> Upcoming Deadlines
                    </h3>
                    <Link href="/assignments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View Calendar</Link>
                 </div>
                 <div className="p-2">
                    <UpcomingDeadlines embedded={true} />
                 </div>
              </div>

              {/* USP Spotlight Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {/* Lecturer Emphasis Feature */}
                 <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => router.push('/study/lectures')}>
                    <div className="flex items-start justify-between mb-3">
                       <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          <TrendingUp className="w-5 h-5" />
                       </div>
                       <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">New</span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Lecturer Emphasis</h4>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                       We spotted 3 key concepts emphasized in your last lecture.
                    </p>
                    <div className="text-xs font-semibold text-purple-700 flex items-center gap-1 group">
                       Review Signals <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </div>
                 </div>

                 {/* Wellbeing Feature */}
                 <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl border border-pink-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => router.push('/wellbeing')}>
                     <div className="flex items-start justify-between mb-3">
                       <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                          <Heart className="w-5 h-5" />
                       </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">Wellbeing Hub</h4>
                    <p className="text-xs text-gray-600 mb-3">
                       Daily check-in incomplete. Track your trends.
                    </p>
                    <div className="text-xs font-semibold text-pink-700 flex items-center gap-1 group">
                       Check In <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Col: Widgets */}
           <div className="space-y-6">
              {/* Tasks */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Today's Tasks</h3>
                    <Link href="/my/tasks" className="text-xs font-medium text-gray-500 hover:text-gray-900">View All</Link>
                 </div>
                 <TodaysTasksWidget />
              </div>
           </div>
        </div>

        {/* INTEGRITY FOOTER */}
        <div className="text-center py-8 border-t border-gray-100">
           <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Built for academic integrity & Durham standards</span>
           </div>
        </div>

      </main>


    </>
  );
}

function CoreActionCard({ title, icon, link, preview }: any) {
  return (
    <Link href={link} className="group block h-full">
      <div className="h-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm group-hover:shadow-md group-hover:border-purple-200 transition-all flex flex-col">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors border border-gray-100 group-hover:border-purple-100">
               {icon}
            </div>
         </div>
         <div className="mt-auto">
            {preview}
         </div>
      </div>
    </Link>
  )
}

