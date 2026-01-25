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
  const [focusItem, setFocusItem] = useState<{title: string, type: string, link: string, due_date?: string, source?: string, id?: string} | null>(null);
  const [nextAssignment, setNextAssignment] = useState<any>(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
       fetch('/api/dashboard/overview').then(res => {
        if(res.ok) return res.json();
      }).then(data => {
        if (data?.preferences) {
          setShowCountdown(data.preferences.show_deadline_countdown);
        }
        if(data?.upcomingAssignments?.length > 0) {
           const next = data.upcomingAssignments[0];
           setNextAssignment(next);
           setUpcomingAssignments(data.upcomingAssignments);
           
           // Build YAAG link with event hash for auto-scroll
           // For Assignments: Link to Assignment Widget
           // For Others: Link to YAAG Day View
           const actionLink = next.source === 'assignment' 
              ? `/assignments?assignmentId=${next.id}`
              : (next.yaagLink ? next.yaagLink + `#event-${next.id}` : '/year-at-a-glance');
           
           setFocusItem({
             id: next.id,
             title: next.title,
             type: next.typeLabel || (next.source === 'assignment' ? 'Assignment' : 'Deadline'),
             link: actionLink,
             yaagLink: actionLink,
             typeLabel: next.typeLabel,
             due_date: next.due_date, // Pass due date for timer
             source: next.source
           });
        }
      }).catch(err => console.error('Focus fetch error', err));
    }
  }, [user, loading]);

  const toggleCountdownPreference = async () => {
    const newValue = !showCountdown;
    setShowCountdown(newValue);
    setPreferencesLoading(true);
    try {
      await fetch('/api/user/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_deadline_countdown: newValue })
      });
    } catch (err) {
      console.error('Failed to update preferences', err);
    } finally {
      setPreferencesLoading(false);
    }
  };

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
                 <span className="text-xs font-semibold text-gray-900">Full Access Trial</span>
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
           
            {/* Premium Mesh Gradient Backdrop */}
            <div className="absolute inset-0 bg-indigo-900 overflow-hidden">
               <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-violet-600/30 rounded-full blur-[120px] animate-pulse"></div>
               <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px]"></div>
               <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-fuchsia-500/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-400 p-1.5 rounded-lg shadow-inner">
                       <Zap className="w-3.5 h-3.5 text-indigo-900 fill-indigo-900" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-yellow-200">Next Best Action</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                     {focusItem ? `Next deadline: ${focusItem.title}` : "You're on track"}
                  </h2>
                   <div className="text-indigo-100 text-base md:text-lg max-w-xl">
                     {focusItem ? (
                        <div className="flex flex-col gap-1">
                           <span className="flex items-center gap-2">
                             <span className="bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {focusItem.typeLabel || 'Deadline'}
                             </span>
                             You have a deadline approaching.
                           </span>
                           {isMounted && focusItem.due_date && (
                              <div className="flex items-center gap-4 mt-2">
                                 <CountdownTimer 
                                    dueDate={focusItem.due_date} 
                                    style="banner" 
                                    suppressTimer={!showCountdown}
                                    className="text-white bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20"
                                 />
                              </div>
                           )}

                           <div className="flex flex-wrap items-center gap-3 mt-6">
                              {/* 
                                GUARDRAIL: DASHBOARD BANNER LINK
                                - Assignments: Link to Assignment Widget (Resume/Plan)
                                - Others: Link to YAAG Day View (#event-{id})
                              */}
                              {focusItem.id ? (
                                <Link 
                                   href={focusItem.link}
                                   className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center gap-2 shadow-lg"
                                >
                                   {focusItem.source === 'assignment' ? 'Continue Assignment' : 'View in YAAG'}
                                   <ArrowRight className="w-4 h-4" />
                                </Link>
                              ) : (
                                <Link 
                                   href={`/year-at-a-glance?y=${currentYearKey}`}
                                   className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center gap-2 shadow-lg"
                                >
                                   View in YAAG
                                   <ArrowRight className="w-4 h-4" />
                                </Link>
                              )}
                              
                              <button className="px-5 py-2.5 bg-indigo-800/50 text-white rounded-xl font-medium hover:bg-indigo-800/70 transition flex items-center gap-2 border border-indigo-500/30">
                                 <HelpCircle className="w-4 h-4" />
                                 Why this?
                              </button>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                           <p className="font-medium text-indigo-100 mb-4 leading-relaxed">
                              No upcoming academic deadlines in the next 14 days. Great work staying ahead!
                           </p>
                           <div className="flex items-center gap-3">
                              <Link 
                                 href={`/year-at-a-glance?y=${currentYearKey}`}
                                 className="px-5 py-2 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-indigo-50 transition flex items-center gap-2"
                              >
                                 View in YAAG
                                 <ArrowRight className="w-4 h-4" />
                              </Link>
                              
                              <button className="px-4 py-2 bg-indigo-800/50 text-white rounded-lg font-medium hover:bg-indigo-800/70 transition border border-indigo-500/30">
                                 Why this?
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                  
                   {/* 14-Day View Trigger */}
                   {upcomingAssignments.length > 1 && (
                      <button 
                         onClick={() => setShowAllDeadlines(!showAllDeadlines)}
                         className="mt-4 text-sm font-semibold text-indigo-300 hover:text-white transition flex items-center gap-1 w-fit border-b border-indigo-500/30 pb-0.5"
                      >
                         {showAllDeadlines ? "Hide other deadlines" : `See ${upcomingAssignments.length - 1} more deadlines in next 14 days`}
                         <ArrowRight className={`w-3 h-3 transition-transform ${showAllDeadlines ? 'rotate-90' : ''}`} />
                      </button>
                   )}
                </div>
               
               <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button onClick={() => router.push(focusItem?.link || '/year-at-a-glance')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-900 font-bold px-6 py-3.5 hover:bg-indigo-50 transition shadow-lg whitespace-nowrap">
                     {focusItem?.source === 'assignment' ? 'Open Assignment' : 'View in YAAG'} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 text-white font-semibold px-4 py-3.5 hover:bg-white/20 transition border border-white/10 backdrop-blur-sm whitespace-nowrap group">
                     <HelpCircle className="w-4 h-4 text-indigo-200" />
                     <span className="text-sm">Why this?</span>
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
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        Key concepts emphasized in your recent lectures.
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

                  {/* Live Legal News reinforcement card */}
                  <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 p-5 shadow-sm hover:shadow-md transition cursor-pointer md:col-span-2 lg:col-span-1" onClick={() => router.push('/legal/tools/legal-news-feed')}>
                     <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                           <TrendingUp className="w-5 h-5" />
                        </div>
                     </div>
                     <h4 className="font-bold text-gray-900 mb-1">Live Legal News</h4>
                     <p className="text-xs text-gray-600 mb-3">
                        Key legal developments to help you connect doctrine with real-world cases.
                     </p>
                     <div className="text-xs font-semibold text-red-700 flex items-center gap-1 group">
                        View Legal News <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
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

