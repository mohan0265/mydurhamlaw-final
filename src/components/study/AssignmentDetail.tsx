import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Assignment, AssignmentStatus } from '@/types/assignments';
import { 
  Calendar, CheckCircle, Trash2, Brain, Eye, 
  LayoutDashboard, FileText, CheckSquare, Award, Flag, Send 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import AssignmentPreviewModal from './AssignmentPreviewModal';

// Tabs
import OverviewTab from './tabs/OverviewTab';
import BriefTab from './tabs/BriefTab';
import ChecklistTab from './tabs/ChecklistTab';
import RubricTab from './tabs/RubricTab';
import MilestonesTab from './tabs/MilestonesTab';
import SubmissionTab from './tabs/SubmissionTab';

interface AssignmentDetailProps {
  assignment: Assignment;
  onUpdate: () => void;
  onPlanWithAI: () => void;
  onDelete: () => void;
}

export default function AssignmentDetail({ assignment, onUpdate, onPlanWithAI, onDelete }: AssignmentDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Status State (for header access)
  const [status, setStatus] = useState<AssignmentStatus>(assignment.status);

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
      setStatus(assignment.status);
    }
  };

  const daysLeft = differenceInDays(new Date(assignment.due_date), new Date());
  const isOverdue = daysLeft < 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'brief', label: 'Brief', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'rubric', label: 'Rubric', icon: Award },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'submission', label: 'Submission', icon: Send },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[800px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">{assignment.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-sm">
                {assignment.module_code && <span className="font-mono bg-gray-100/50 px-2 py-0.5 rounded text-gray-600">{assignment.module_code}</span>}
                <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    <Calendar size={14} />
                    {format(new Date(assignment.due_date), 'MMM d')} ({isOverdue ? 'Overdue' : `${daysLeft}d left`})
                </span>
              </div>
          </div>
          <div className="flex gap-2">
             <button
               onClick={onPlanWithAI}
               className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
             >
               <Brain size={16} /> Plan with Durmah
             </button>
             <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
             >
                <Trash2 size={18} />
             </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-gray-900 text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <tab.icon size={16} className={activeTab === tab.id ? 'text-violet-300' : ''} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-[#F8FAFC] relative">
          <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
             {activeTab === 'overview' && <OverviewTab assignment={assignment} />}
             {activeTab === 'brief' && <BriefTab assignment={assignment} onUpdate={onUpdate} />}
             {activeTab === 'checklist' && <ChecklistTab assignment={assignment} />}
             {activeTab === 'rubric' && <RubricTab assignment={assignment} />}
             {activeTab === 'milestones' && <MilestonesTab assignment={assignment} />}
             {activeTab === 'submission' && <SubmissionTab assignment={assignment} />}
          </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Assignment?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete <span className="font-semibold">"{assignment.title}"</span>? 
              This matches the "measure twice, cut once" principle—deletion is permanent.
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
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold transition"
              >
                Yes, Delete
              </button>
            </div >
          </div >
        </div >
      )}

      {/* Preview Modal (kept for compatibility) */}
      <AssignmentPreviewModal
        assignment={assignment}
        finalDraft={null}
        aiUsageLog={[]}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onDownload={() => {}}
      />
    </div>
  );
}

