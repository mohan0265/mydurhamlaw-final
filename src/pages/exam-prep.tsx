'use client'

import { useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import ExamOverview from '@/components/study/ExamOverview'
import DurmahChat from '@/components/durmah/DurmahChat'
import { Calendar, Play, Clock } from 'lucide-react'
import { addWeeks, format } from 'date-fns'

export default function ExamPrepPage() {
  useScrollToTop()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useContext(AuthContext)
  
  // Revision Planner State
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [generatedPlan, setGeneratedPlan] = useState<string[]>([]);
  
  // Durmah Context
  const [chatContext, setChatContext] = useState({ title: 'Exam Revision', hint: '' });
  
  // Active Workspaces
  const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exam/workspaces')
        .then(res => res.json())
        .then(data => {
            setActiveWorkspaces(data);
            setLoading(false);
        })
        .catch(err => console.error(err));
  }, []);

  // Deep Linking from Dashboard
  useEffect(() => {
    if (router.query.module) {
       const mod = decodeURIComponent(router.query.module as string);
       setSelectedModule(mod);
       
       // Try to find matching workspace ID if available
       const workspace = activeWorkspaces.find(w => w.module.title === mod || w.module.code === mod);
       if (workspace) setSelectedModuleId(workspace.module_id);

       setChatContext({
          title: `Revision: ${mod}`,
          hint: `The student is revising for ${mod} exam. Help them create a detailed study schedule.`
       });
    }
  }, [router.query, activeWorkspaces]);

  const handleSelectModuleForRevision = (moduleName: string, date: string, moduleId?: string) => {
     setSelectedModule(moduleName);
     if (moduleId) setSelectedModuleId(moduleId);
     else setSelectedModuleId(undefined); // Clear if not provided (fallback to global)

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

                 {/* 2. Active Exam Workspaces (Unlocked) */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <Play className="text-violet-600" size={20} /> Active Workspaces
                    </h2>
                    
                    {loading ? (
                        <p className="text-sm text-gray-400">Loading workspaces...</p>
                    ) : activeWorkspaces.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeWorkspaces.map(ws => (
                                <div 
                                    key={ws.id}
                                    onClick={() => router.push(`/exam-prep/${ws.module_id}`)}
                                    className="border rounded-lg p-4 hover:border-violet-500 hover:bg-violet-50 transition cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 group-hover:text-violet-700">{ws.module.title}</h3>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Active</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">Code: {ws.module.code}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock size={12} /> Last active: {new Date(ws.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-sm text-gray-500 mb-2">No active exam workspaces yet.</p>
                            <p className="text-xs text-gray-400 mb-4">Complete your lecture uploads in My Lectures to unlock.</p>
                            <button 
                                onClick={() => router.push('/study/lectures')}
                                className="text-sm font-bold text-violet-600 hover:underline"
                            >
                                Go to My Lectures
                            </button>
                        </div>
                    )}
                 </div>

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
                   contextId={selectedModuleId}
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
