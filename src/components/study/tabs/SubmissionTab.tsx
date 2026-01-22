import { Assignment, AssignmentSubmission, AssignmentFeedback } from '@/types/assignments';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SubmissionTabProps {
  assignment: Assignment;
}

export default function SubmissionTab({ assignment }: SubmissionTabProps) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [feedback, setFeedback] = useState<AssignmentFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    
    // Fetch submissions
    const { data: subData } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false });
      
    if (subData) setSubmissions(subData as AssignmentSubmission[]);
    
    // Fetch feedback
    const { data: fbData } = await supabase
        .from('assignment_feedback')
        .select('*')
        .eq('assignment_id', assignment.id)
        .maybeSingle();

    if (fbData) setFeedback(fbData as AssignmentFeedback);
    
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [assignment.id]);

  const handleManualSubmit = async () => {
    const supabase = getSupabaseClient();
    const tempId = `temp-${Date.now()}`;
    const newSub: AssignmentSubmission = {
        id: tempId,
        user_id: assignment.user_id,
        assignment_id: assignment.id,
        submitted_at: new Date().toISOString(),
        method: 'manual',
        notes: notes,
        created_at: new Date().toISOString()
    };
    
    setSubmissions([newSub, ...submissions]);
    setNotes('');
    
    await supabase.from('assignment_submissions').insert({
        assignment_id: assignment.id,
        user_id: assignment.user_id,
        submitted_at: newSub.submitted_at,
        method: 'manual',
        notes: newSub.notes
    });
    
    // Also update assignment status
    await supabase.from('assignments').update({ status: 'submitted' }).eq('id', assignment.id);
    toast.success('Logged as submitted');
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300 overflow-y-auto pr-2 custom-scrollbar">
       
       {/* Feedback Section */}
       {feedback ? (
         <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" /> 
                Feedback Received
            </h3>
            <div className="space-y-4">
                <div className="bg-white/60 p-4 rounded-lg">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Overall Comments</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{feedback.overall_comments || 'No comments provided.'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 p-4 rounded-lg border-l-4 border-green-400">
                        <p className="text-xs font-bold text-green-700 uppercase mb-1">Strengths</p>
                        <p className="text-sm text-gray-700">{feedback.strengths || '-'}</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border-l-4 border-amber-400">
                        <p className="text-xs font-bold text-amber-700 uppercase mb-1">Improvements</p>
                        <p className="text-sm text-gray-700">{feedback.improvements || '-'}</p>
                    </div>
                </div>
                {feedback.feed_forward && (
                    <div className="bg-violet-50 p-4 rounded-lg border border-violet-100">
                         <p className="text-xs font-bold text-violet-700 uppercase mb-1">Feed Forward (Next Time)</p>
                         <p className="text-sm text-gray-800 italic">"{feedback.feed_forward}"</p>
                    </div>
                )}
                {feedback.grade && (
                    <div className="text-right">
                        <span className="text-3xl font-bold text-emerald-800">{feedback.grade}</span>
                        <span className="text-emerald-600 text-sm font-medium ml-1">Grade</span>
                    </div>
                )}
            </div>
         </div>
       ) : (
         <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-500 font-medium">No feedback recorded yet.</p>
            <p className="text-xs text-gray-400">Once logged, your feedback breakdown will appear here.</p>
         </div>
       )}

       {/* Submission History */}
       <div>
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} /> Submission History
          </h4>
          
          <div className="space-y-3">
             {submissions.map(sub => (
                 <div key={sub.id} className="bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Submitted via {sub.method || 'Manual Log'}</p>
                        <p className="text-xs text-gray-500">{format(new Date(sub.submitted_at), 'PPP p')}</p>
                        {sub.notes && <p className="text-sm text-gray-600 mt-1 italic">"{sub.notes}"</p>}
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Sent
                    </div>
                 </div>
             ))}
          </div>

          {/* Log New */}
          <div className="mt-4 bg-white border border-gray-200 p-4 rounded-xl">
              <p className="text-sm font-bold text-gray-700 mb-2">Log a Submission</p>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    placeholder="Notes (e.g. Uploaded to Turnitin, ID: 12345)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <button 
                    onClick={handleManualSubmit}
                    disabled={!notes}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-violet-600 transition disabled:opacity-50"
                  >
                    Log
                  </button>
              </div>
          </div>
       </div>
    </div>
  )
}
