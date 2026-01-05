import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabase/client';
import {Assignment, AssignmentStatus } from '@/types/assignments';
import { Calendar, CheckCircle, Clock, Trash2, Brain, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import AssignmentPreviewModal from './AssignmentPreviewModal';

interface AssignmentDetailProps {
  assignment: Assignment;
  onUpdate: () => void;
  onPlanWithAI: () => void;
  onDelete: () => void;
}

export default function AssignmentDetail({ assignment, onUpdate, onPlanWithAI, onDelete }: AssignmentDetailProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AssignmentStatus>(assignment.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [finalDraft, setFinalDraft] = useState<string | null>(null);
  const [aiUsageLog, setAiUsageLog] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Scroll to top when component mounts
  useScrollToTop();

  useEffect(() => {
    setStatus(assignment.status);
  }, [assignment]);

  const updateStatus = async (newStatus: AssignmentStatus) => {
    const supabase = getSupabaseClient();
    setStatus(newStatus);
    try {
      await supabase
        .from('assignments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', assignment.id);
      toast.success("Status updated");
      onUpdate();
    } catch {
      toast.error("Failed to update status");
      setStatus(assignment.status); // revert
    }
  };

  // Fetch final draft if assignment is completed
  useEffect(() => {
    if (status === 'completed') {
      const fetchDraft = async () => {
        const supabase = getSupabaseClient();
        
        // Try Stage 5 (formatted draft) first, then fall back to Stage 4 (raw draft)
        let draft = null;
        let aiLog: string[] = [];
        
        // Stage 5: Formatting & Citations (has formattedDraft)
        const { data: stage5Data } = await supabase
          .from('assignment_progress')
          .select('content')
          .eq('assignment_id', assignment.id)
          .eq('step_key', 'stage_5_formatting')
          .maybeSingle();
        
        if (stage5Data?.content?.formattedDraft) {
          draft = stage5Data.content.formattedDraft;
        }
        
        // Fallback to Stage 4 if Stage 5 doesn't exist
        if (!draft) {
          const { data: stage4Data } = await supabase
            .from('assignment_progress')
            .select('content')
            .eq('assignment_id', assignment.id)
            .eq('step_key', 'stage_4_drafting')
            .maybeSingle();
          
          if (stage4Data?.content?.content) {
            draft = stage4Data.content.content;
          }
          
          // Get AI usage log from Stage 4
          if (stage4Data?.content?.aiUsageLog) {
            aiLog = stage4Data.content.aiUsageLog;
          }
        }
        
        setFinalDraft(draft);
        setAiUsageLog(aiLog);
      };
      fetchDraft();
    }
  }, [status, assignment.id]);

  const downloadAssignment = () => {
    if (!finalDraft) {
      toast.error('No draft available for download');
      return;
    }

    try {
      setLoading(true);
      
      // Encode all data as base64 to pass in URL
      const payload = {
        assignment: {
          module_code: assignment.module_code,
          module_name: assignment.module_name,
          title: assignment.title,
          due_date: assignment.due_date ? format(new Date(assignment.due_date), 'PPP') : null,
        },
        finalDraft,
        aiUsageLog,
      };

      const jsonString = JSON.stringify(payload);
      const base64Data = btoa(unescape(encodeURIComponent(jsonString))); // Proper UTF-8 handling
      const downloadUrl = `/.netlify/functions/generate-assignment-doc?data=${encodeURIComponent(base64Data)}`;

      // Open download URL directly - triggers native browser download
      window.open(downloadUrl, '_blank');
      
      toast.success('✅ Download started! Check your Downloads folder.');
    } catch (error) {
      console.error('[Download Error]:', error);
      toast.error('Failed to generate document: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = differenceInDays(new Date(assignment.due_date), new Date());
  const isOverdue = daysLeft < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[600px] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-800 leading-tight">{assignment.title}</h2>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition flex items-center gap-1.5"
            title="Delete this assignment"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
          {assignment.module_code && (
             <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{assignment.module_code}</span>
          )}
          {assignment.module_name && (
             <span className="font-medium">{assignment.module_name}</span>
          )}
          <span className="text-gray-300">|</span>
          <span>{assignment.assignment_type}</span>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className={`flex items-center gap-2 ${isOverdue && status !== 'completed' ? 'text-red-600' : 'text-gray-700'}`}>
             <Calendar size={18} />
             <span className="font-medium">Due: {format(new Date(assignment.due_date), 'PPP p')}</span>
          </div>
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            status === 'completed' ? 'bg-green-100 text-green-700' : 
            isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
             {status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : `${daysLeft} days left`}
          </div>
        </div>
      </div>

      {/* Status Control */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
        <div className="grid grid-cols-3 gap-2">
           {(['not_started', 'planning', 'drafting', 'editing', 'submitted', 'completed'] as AssignmentStatus[]).map((s) => (
             <button
               key={s}
               onClick={() => updateStatus(s)}
               className={`py-2 px-1 text-xs font-medium rounded-md border transition-all ${
                 status === s
                   ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                   : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
               }`}
             >
               {s.replace('_', ' ')}
             </button>
           ))}
        </div>
      </div>

      {/* Question / Brief */}
      <div className="flex-1 min-h-0 flex flex-col mb-6">
         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assignment Brief</label>
         <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-y-auto whitespace-pre-wrap text-sm text-gray-800 leading-relaxed shadow-inner">
           {assignment.question_text || <span className="text-gray-400 italic">No brief provided.</span>}
         </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Preview & Download button for completed assignments */}
        {status === 'completed' && finalDraft && (
          <button
            onClick={() => setShowPreviewModal(true)}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Review & Download
          </button>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onPlanWithAI}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Brain size={18} />
            Plan with Durmah
          </button>
          {status !== 'completed' && status !== 'submitted' && (
            <button
              onClick={() => updateStatus('submitted')}
              className="flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> Submit
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AssignmentPreviewModal
        assignment={assignment}
        finalDraft={finalDraft}
        aiUsageLog={aiUsageLog}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onDownload={downloadAssignment}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Delete Assignment?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">"{assignment.title}"</span>? 
              This action cannot be undone and all progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
              >
                Delete Assignment
              </button>
            </div >
          </div >
        </div >
      )}
    </div >
  );
}
