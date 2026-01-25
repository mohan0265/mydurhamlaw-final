'use client'

import { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import ExamOverview from '@/components/study/ExamOverview'
import DurmahChat from '@/components/durmah/DurmahChat'
import { Calendar, Play } from 'lucide-react'
import { addWeeks, format } from 'date-fns'

export default function ExamPrepPage() {
  useScrollToTop()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useContext(AuthContext)
  
  // Revision Planner State
  const [selectedModule, setSelectedModule] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [generatedPlan, setGeneratedPlan] = useState<string[]>([]);
  
  // Durmah Context
  const [chatContext, setChatContext] = useState({ title: 'Exam Revision', hint: '' });

  // Deep Linking from Dashboard
  useEffect(() => {
    if (router.query.module) {
       const mod = decodeURIComponent(router.query.module as string);
       setSelectedModule(mod);
       setChatContext({
          title: `Revision: ${mod}`,
          hint: `The student is revising for ${mod} exam. Help them create a detailed study schedule.`
       });
    }
  }, [router.query]);

  const handleSelectModuleForRevision = (moduleName: string, date: string) => {
     setSelectedModule(moduleName);
     // Scroll to planner?
     setChatContext({
        title: `Revision: ${moduleName}`,
        hint: `The student is revising for ${moduleName} exam on ${date}. Help them create a detailed study schedule.`
     });
  };

  const generatePlan = () => {
    if (!selectedModule || !revisionStartDate) return;
    const start = new Date(revisionStartDate);
    const plan = [];
    for (let i = 0; i < 4; i++) { // Generate 4 weeks preview
       const weekStart = addWeeks(start, i);
       plan.push(`Week of ${format(weekStart, 'MMM d')}: ${selectedModule} - Phase ${i+1} (Review & Practice)`);
    }
    setGeneratedPlan(plan);
  };

  if (!user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0`}>
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          
          <div className="flex items-center gap-4 mb-6">
             <BackToHomeButton />
             <h1 className="text-2xl font-bold text-gray-800">Exam Preparation Hub</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
             
             {/* LEFT/CENTER: Overview & Planner (7 cols) */}
             <div className="lg:col-span-7 space-y-6">
                {/* 1. Overview Table */}
                <ExamOverview 
                   userId={user.id} 
                   onSelectModule={handleSelectModuleForRevision} 
                />

                {/* 2. Revision Planner */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="text-violet-600" size={20} /> Revision Planner
                   </h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase">Module</label>
                         <input 
                           className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                           placeholder="Type or select from above..."
                           value={selectedModule}
                           onChange={e => setSelectedModule(e.target.value)}
                         />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                         <input 
                           type="date"
                           className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                           value={revisionStartDate}
                           onChange={e => setRevisionStartDate(e.target.value)}
                         />
                      </div>
                      <div className="flex items-end">
                         <button 
                           onClick={generatePlan}
                           disabled={!selectedModule || !revisionStartDate}
                           className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                         >
                            <Play size={16} /> Generate Plan
                         </button>
                      </div>
                   </div>

                   {/* Generated Plan Output */}
                   {generatedPlan.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 animate-in fade-in">
                         <h3 className="font-bold text-blue-800 text-sm mb-3">Suggested Schedule:</h3>
                         <ul className="space-y-2">
                            {generatedPlan.map((item, i) => (
                               <li key={i} className="flex gap-2 text-sm text-blue-900 bg-white/50 p-2 rounded border border-blue-100">
                                  <span className="font-mono text-blue-400 font-bold">{i+1}.</span>
                                  {item}
                               </li>
                            ))}
                         </ul>
                         <p className="text-xs text-blue-500 mt-3 text-center">
                            Ask Durmah for detailed daily breakdowns of this plan.
                         </p>
                      </div>
                   )}
                </div>
             </div>

             {/* RIGHT: Durmah Chat (5 cols) */}
             <div className="lg:col-span-5 h-[650px] lg:h-auto lg:sticky lg:top-6">
                <DurmahChat 
                   contextType="exam"
                   contextTitle={chatContext.title}
                   systemHint={chatContext.hint}
                   className="h-full shadow-md"
                />
             </div>

          </div>

        </div>
      </div>
    </div>
  )
}
