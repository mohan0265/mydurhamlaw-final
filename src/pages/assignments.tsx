'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import AssignmentList from '@/components/study/AssignmentList'
import AssignmentDetail from '@/components/study/AssignmentDetail'
import AssignmentCreateForm from '@/components/study/AssignmentCreateForm'
import DurmahChat from '@/components/durmah/DurmahChat'
import { Assignment } from '@/types/assignments'
import toast from 'react-hot-toast'

export default function AssignmentsPage() {
  useScrollToTop()
  const router = useRouter()
  const { user, getDashboardRoute } = useContext(AuthContext)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  
  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Chat State
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>()

  // 1. Fetch Assignments
  const fetchAssignments = async () => {
    if (!user?.id) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
    
    if (data) setAssignments(data as Assignment[])
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchAssignments()
  }, [user])

  // 2. Handle Query Param Selection
  useEffect(() => {
    // Handle opening specific assignment
    if (router.query.assignmentId && assignments.length > 0) {
      const target = assignments.find(a => a.id === router.query.assignmentId)
      if (target) {
        setSelectedAssignment(target)
        setShowCreateForm(false)
      }
    }
    
    // Handle new assignment with date param
    if (router.query.new === 'true') {
      setShowCreateForm(true)
      setSelectedAssignment(null)
    }
  }, [router.query, assignments])

  // Handlers
  const handleCreateSave = () => {
    setShowCreateForm(false)
    fetchAssignments()
    // clear params to avoid re-opening on refresh?
    router.replace('/assignments', undefined, { shallow: true });
  }

  const handleUpdate = () => {
    fetchAssignments()
    // Optimistically update selected if needed? fetchAssignments handles it.
  }

  const handleDelete = async () => {
    if (!selectedAssignment || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      await supabase.from('assignments').delete().eq('id', selectedAssignment.id);
      toast.success("Assignment deleted");
      setSelectedAssignment(null);
      fetchAssignments();
    } catch {
       toast.error("Failed to delete");
    }
  }

  const handlePlanWithAI = () => {
     if (!selectedAssignment) return;
     setChatInitialPrompt(`I need help planning my assignment: "${selectedAssignment.title}". Here is the brief: ${selectedAssignment.question_text || "No brief provided"}. Can you help me break this down?`);
     // Force chat re-render or prompt trigger if needed, passing key to component often simplest
  }

  if (loading) {
     return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0`}>
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          {/* Top Nav */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                <BackToHomeButton />
                <h1 className="text-2xl font-bold text-gray-800">Assignment Hub</h1>
             </div>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[800px]">
            
            {/* Left Col: List (3 cols) */}
            <div className="lg:col-span-3 h-full">
               <AssignmentList 
                 assignments={assignments}
                 selectedId={selectedAssignment?.id || null}
                 onSelect={(a) => {
                    setSelectedAssignment(a);
                    setShowCreateForm(false);
                    setChatInitialPrompt(undefined);
                 }}
                 onNew={() => {
                    setSelectedAssignment(null);
                    setShowCreateForm(true);
                 }}
               />
            </div>

            {/* Center Col: Detail or Form (5 cols) */}
            <div className="lg:col-span-5 h-full">
               {showCreateForm ? (
                 <AssignmentCreateForm 
                   onCancel={() => setShowCreateForm(false)} 
                   onSave={handleCreateSave}
                   initialDate={router.query.date ? new Date(router.query.date as string) : undefined}
                 />
               ) : selectedAssignment ? (
                 <AssignmentDetail 
                   assignment={selectedAssignment} 
                   onUpdate={handleUpdate}
                   onDelete={handleDelete}
                   onPlanWithAI={handlePlanWithAI} 
                 />
               ) : (
                 <div className="bg-white/50 border border-white/50 rounded-xl h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center dashed-border">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                       <span className="text-4xl">📚</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Select an Assignment</h3>
                    <p className="max-w-xs mx-auto">Choose a task from the list or create a new one to get started with Durmah.</p>
                 </div>
               )}
            </div>

            {/* Right Col: Durmah Chat (4 cols) */}
            <div className="lg:col-span-4 h-full">
               <DurmahChat 
                 key={selectedAssignment?.id || 'general'} // Re-mount on assignment change for fresh context
                 contextType={selectedAssignment ? 'assignment' : 'general'}
                 contextTitle={selectedAssignment?.title || 'General Study Help'}
                 contextId={selectedAssignment?.id}
                 initialPrompt={chatInitialPrompt}
                 className="h-full"
               />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

