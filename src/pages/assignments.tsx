'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { getSupabaseClient } from '@/lib/supabase/client'
import { AuthContext } from '@/lib/supabase/AuthContext'
import ModernSidebar from '@/components/layout/ModernSidebar'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import AssignmentList from '@/components/study/AssignmentList'
import AssignmentDetail from '@/components/study/AssignmentDetail'
import AssignmentCreateForm from '@/components/study/AssignmentCreateForm'
import DurmahChat from '@/components/durmah/DurmahChat'
import AssignmentWorkflow from '@/components/assignment-assistant/AssignmentWorkflow'
import { Assignment } from '@/types/assignments'
import toast from 'react-hot-toast'
import { useStudentOnly } from '@/hooks/useStudentOnly'

export default function AssignmentsPage() {
  const router = useRouter()
  const { user, getDashboardRoute } = useContext(AuthContext)
  
  // Protect from loved ones
  const { isChecking: isRoleChecking, isLovedOne } = useStudentOnly();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  
  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // NEW: Edit mode
  const [showWorkflow, setShowWorkflow] = useState(false)
  
  // Chat State
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>()

  // AGGRESSIVE SCROLL FIX: Always scroll to top on mount and navigation
  useEffect(() => {
    // Immediate scroll on mount
    window.scrollTo(0, 0);
    
    // Prevent browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Listen to router events for scroll reset
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };
    
    router.events?.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

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
    // Handle YAAG deep-link: openAssessmentId (from user_assessments)
    if (router.query.openAssessmentId) {
      // For now, show message to create assignment from assessment
      toast.success('Opening assessment from calendar - create assignment from this deadline');
      setShowCreateForm(true);
      setSelectedAssignment(null);
      setShowWorkflow(false);
      return;
    }

    // Handle YAAG deep-link: openBriefId (from user_assignment_briefs)  
    if (router.query.openBriefId) {
      // For now, show message to link brief
      toast.success('Opening assignment brief - link to assignment or create new one');
      setShowCreateForm(true);
      setSelectedAssignment(null);
      setShowWorkflow(false);
      return;
    }

    // Handle opening specific assignment
    if (router.query.assignmentId && assignments.length > 0) {
      const target = assignments.find(a => a.id === router.query.assignmentId)
      if (target) {
        setSelectedAssignment(target)
        setShowCreateForm(false)
        
        // Check if we should show workflow view
        if (router.query.view === 'workflow') {
          setShowWorkflow(true);
        } else {
          setShowWorkflow(false);
        }
      }
    } else {
      // No assignment ID = show select screen
      setSelectedAssignment(null);
      setShowWorkflow(false);
      setShowCreateForm(false);
    }
    
    // Handle new assignment with date param
    if (router.query.new === 'true') {
      setShowCreateForm(true)
      setSelectedAssignment(null)
      setShowWorkflow(false);
    }
  }, [router.query, assignments])

  // Scroll to top when navigating to assignment (more aggressive approach)
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router.query.assignmentId, router.query.new, router.query.openAssessmentId, router.query.openBriefId]);

  // Handlers
  const handleCreateSave = () => {
    setShowCreateForm(false)
    setIsEditing(false)
    fetchAssignments()
    router.push('/assignments', undefined, { shallow: true });
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
      router.push('/assignments', undefined, { shallow: true });
      fetchAssignments();
    } catch {
       toast.error("Failed to delete");
    }
  }

  const handlePlanWithAI = () => {
    if (!selectedAssignment) return;
    
    // Build context-aware prompt
    const brief = selectedAssignment.brief_rich 
      ? (typeof selectedAssignment.brief_rich === 'string' ? selectedAssignment.brief_rich : JSON.stringify(selectedAssignment.brief_rich))
      : selectedAssignment.question_text || 'No brief provided.';

    const prompt = `I want to plan my assignment "${selectedAssignment.title}".
Due Date: ${new Date(selectedAssignment.due_date).toDateString()}
Module: ${selectedAssignment.module_code || 'Unknown'}
Brief: ${brief.substring(0, 1000)}

Please help me:
1. Break this down into key milestones.
2. Suggest a checklist of tasks.
3. Identify key resources I might need.`;

    setChatInitialPrompt(prompt);
    
    // Explicitly open workflow modal
    setShowWorkflow(true);
    
    // Send context to sidebar chat as well (optional, for continuity)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('durmah:message', { 
            detail: { text: prompt, mode: 'study' }
        }));
    }
    
    toast.success("Durmah briefed with assignment context");
  }

  if (loading || isRoleChecking || isLovedOne) {
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
                   // URL-based navigation: use router.push instead of setState
                   router.push(
                     `/assignments?assignmentId=${a.id}`,
                     undefined,
                     { shallow: true }
                   );
                 }}
                 onNew={() => {
                   router.push('/assignments?new=true', undefined, { shallow: true });
                 }}
               />
            </div>

            {/* Center Col: Detail or Form (5 cols) */}
            <div className="lg:col-span-5 h-full">
               {showCreateForm || (isEditing && selectedAssignment) ? (
                 <AssignmentCreateForm 
                   onCancel={() => {
                      setShowCreateForm(false);
                      setIsEditing(false);
                   }} 
                   onSave={handleCreateSave}
                   initialDate={router.query.date ? new Date(router.query.date as string) : undefined}
                   initialData={isEditing && selectedAssignment ? selectedAssignment : undefined}
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

            {/* Right Col: Chat or Workflow Overlay (4 cols) */}
            <div className="lg:col-span-4 h-full">
              {selectedAssignment && !showWorkflow && (
                <DurmahChat
                  contextType="assignment"
                  contextTitle={selectedAssignment.title}
                  contextId={selectedAssignment.id}
                  initialPrompt={chatInitialPrompt}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Modal Overlay */}
      {showWorkflow && selectedAssignment && (
        <AssignmentWorkflow
          assignmentId={selectedAssignment.id}
          assignmentData={selectedAssignment}
          onClose={() => {
            // Navigate back to assignment view (remove view param)
            router.push(
              `/assignments?assignmentId=${selectedAssignment.id}`,
              undefined,
              { shallow: true }
            );
            setShowWorkflow(false);
            fetchAssignments(); // Refresh in case brief was uploaded
          }}
        />
      )}
    </div>
  )
}

