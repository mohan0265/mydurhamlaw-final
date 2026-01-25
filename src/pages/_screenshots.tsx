import React from 'react';
import Head from 'next/head';
import NextImage from 'next/image';
import { BookOpen, FileText, Calendar, Target, Shield, CheckCircle, HelpCircle, ArrowRight, Zap, Heart, Clock, TrendingUp, Video } from 'lucide-react';

// --- MOCK COMPONENTS (Inlined for stability in screenshotting) ---

// 1. Dashboard Mock
function MockDashboard() {
  const firstName = "Student";
  // Hardcoded "ideal" state
  const focusItem = { title: "Contract Law: Offer & Acceptance", link: "#" };

  return (
    <div className="bg-gray-50 min-h-screen font-sans p-8" id="dashboard-mock">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
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
                <div className="flex items-center gap-3 opacity-90">
                   <button className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      Current Module
                   </button>
                   <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                      <Target className="w-4 h-4" />
                      Complete Setup
                   </button>
                </div>
            </div>

            {/* Next Best Action */}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-8 relative overflow-hidden shadow-xl text-white">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                     <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                        <Zap className="w-3 h-3 text-yellow-300" />
                        <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">Next Best Action</span>
                     </div>
                     <h2 className="text-3xl font-bold leading-tight">Continue working on {focusItem.title}</h2>
                     <p className="text-indigo-100 text-lg">You have a deadline approaching. 20 minutes now will save hours later.</p>
                  </div>
                  <div className="flex gap-3">
                     <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-900 font-bold px-6 py-3.5 shadow-lg">
                        Continue Assignment <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-5">
               <MockCard title="My Lectures" icon={<BookOpen className="w-5 h-5 text-purple-600"/>} 
                   preview={<div className="mt-3 text-xs text-gray-600 bg-purple-50 p-2 rounded border border-purple-100 flex gap-2"><Shield className="w-3 h-3 text-purple-500"/> Last: Intro to Tort Law</div>} />
               <MockCard title="Assignments" icon={<FileText className="w-5 h-5 text-orange-600"/>} 
                   preview={<div className="mt-3"><div className="flex justify-between text-xs mb-1"><span className="font-bold text-gray-700">Formative Essay</span><span className="text-orange-600 font-bold">Due 3d</span></div><div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-orange-500 w-2/3 h-1.5 rounded-full"></div></div></div>} />
               <MockCard title="Year at a Glance" icon={<Calendar className="w-5 h-5 text-blue-600"/>} 
                   preview={<div className="mt-3 flex gap-1 text-[10px] font-bold"><div className="flex-1 h-8 bg-blue-600 text-white rounded border border-blue-600 flex items-center justify-center">T1</div><div className="flex-1 h-8 bg-gray-50 text-gray-400 rounded border border-gray-100 flex items-center justify-center">T2</div><div className="flex-1 h-8 bg-gray-50 text-gray-400 rounded border border-gray-100 flex items-center justify-center">T3</div></div>} />
               <MockCard title="Exam Prep" icon={<Target className="w-5 h-5 text-green-600"/>} 
                   preview={<div className="mt-3 bg-green-50 rounded border border-green-100 p-2 text-center"><div className="text-xs font-bold text-green-800">Today's Set</div><div className="text-[10px] text-green-700">5 Practice Prompts Ready</div></div>} />
            </div>
            
            {/* Split */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Clock className="w-4 h-4"/> Upcoming Deadlines</h3>
                        <div className="space-y-3">
                            {['Contract Law Essay (Formative)', 'Tort Law Problem Question', 'Public Law Reading'].map((t,i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">{t}</span>
                                    <span className="text-xs font-bold text-gray-400">Due {i+2}d</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                         <h3 className="font-bold text-gray-900 mb-4">Today's Tasks</h3>
                         <div className="space-y-3">
                            <div className="flex items-start gap-3"><div className="w-4 h-4 rounded border border-gray-300 mt-0.5"></div><div className="text-sm text-gray-600">Review Tort Law notes</div></div>
                            <div className="flex items-start gap-3"><div className="w-4 h-4 rounded border border-gray-300 mt-0.5"></div><div className="text-sm text-gray-600">Read 'Donoghue v Stevenson'</div></div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

function MockCard({title, icon, preview}: any) {
    return (
      <div className="h-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100">{icon}</div>
         </div>
         <div className="mt-auto">{preview}</div>
      </div>
    )
}

// 2. Durmah AI Mock
function MockDurmah() {
   return (
       <div id="durmah-mock" className="w-[400px] bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col">
           {/* Header */}
           <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
                   <Zap className="w-5 h-5 text-white animate-pulse" />
               </div>
               <div>
                   <h3 className="text-white font-bold">Durmah</h3>
                   <div className="text-xs text-purple-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online • Legal Reasoning Mode</div>
               </div>
           </div>
           
           {/* Chat Area */}
           <div className="bg-gray-50 p-4 h-[300px] space-y-4">
               <div className="flex justify-end"><div className="bg-purple-600 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[85%] shadow-sm">Can you explain the Neighbour Principle?</div></div>
               <div className="flex justify-start"><div className="bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-none px-4 py-2 text-sm max-w-[90%] shadow-sm space-y-2">
                   <p>Certainly.</p>
                   <p>Established in <span className="font-semibold text-purple-700">Donoghue v Stevenson [1932]</span> by Lord Atkin, it is the foundation of negligence.</p>
                   <div className="text-xs bg-purple-50 p-2 rounded border border-purple-100 text-purple-800 italic">"You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour."</div>
               </div></div>
           </div>
           
           {/* Mic Bar */}
           <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-sm"><div className="w-3 h-3 bg-red-500 rounded-sm"></div></div>
              <div className="flex-1 h-10 bg-gray-100 rounded-full flex items-center px-4 text-sm text-gray-400">Listening...</div>
           </div>
       </div>
   )
}

// 3. AWY Mock
function MockAWY() {
    return (
        <div id="awy-mock" className="w-[320px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 p-5 font-sans">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500"/> Always With You</h3>
            
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                           <img src="https://ui-avatars.com/api/?name=Mom&background=random" alt="Mom" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Mom</div>
                        <div className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full w-fit">Online</div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-60">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                           <img src="https://ui-avatars.com/api/?name=Dad&background=random" alt="Dad" />
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-sm">Dad</div>
                        <div className="text-xs text-gray-500">Away</div>
                    </div>
                </div>
            </div>
            
            <button className="w-full mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-pink-500/25 transition flex items-center justify-center gap-2">
                <Video className="w-4 h-4" /> Start Video Call
            </button>
            <div className="text-[10px] text-center text-gray-400 mt-2">Connect via WhatsApp, FaceTime, or Meet</div>
        </div>
    )
}

// 4. YAAG Mock
function MockYAAG() {
    return (
        <div id="yaag-mock" className="bg-white p-8 min-h-screen">
             <div className="max-w-7xl mx-auto">
                 <div className="mb-8">
                     <h1 className="text-2xl font-bold text-gray-900">Year at a Glance</h1>
                     <p className="text-gray-500">Eagle-eye view of your Durham Law pathway</p>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-6">
                     {['Michaelmas', 'Epiphany', 'Easter'].map((term, i) => (
                         <div key={term} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                             <div className={`text-center font-bold text-sm uppercase tracking-wider mb-4 py-1.5 rounded-full ${i===0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                 {term} Term
                             </div>
                             <div className="space-y-2">
                                 {[1,2,3,4,5,6,7,8,9,10].map(w => (
                                     <div key={w} className={`p-3 rounded-xl border flex justify-between items-center ${i===0 && w===4 ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100' : 'bg-white border-gray-100'}`}>
                                         <span className="text-xs font-bold text-gray-400">W{w}</span>
                                         <div className="flex-1 mx-3">
                                            {i===0 && w===4 && <div className="text-xs font-semibold text-blue-900">Tort Law Seminar</div>}
                                            {i===0 && w===8 && <div className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded w-fit">Summative Due</div>}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    )
}

export default function Screenshots() {
  return (
    <div className="space-y-20 bg-gray-200 p-10">
       <div className="bg-white p-4 rounded text-center font-bold">SCROLL DOWN FOR COMPONENTS</div>
       <MockDashboard />
       <div className="h-20"></div>
       <div className="flex justify-center"><MockDurmah /></div>
       <div className="h-20"></div>
       <div className="flex justify-center"><MockAWY /></div>
       <div className="h-20"></div>
       <MockYAAG />
    </div>
  )
}
