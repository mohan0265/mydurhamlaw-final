import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Assignment, AssignmentStatus } from '@/types/assignments';
import { Calendar, CheckCircle, Clock, Trash2, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';

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
