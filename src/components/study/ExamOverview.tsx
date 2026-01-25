import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ExamPreparation } from '@/types/assignments';
import { Plus, Save, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExamOverviewProps {
  userId: string;
  onSelectModule: (module: string, date: string, moduleId?: string) => void;
}

export default function ExamOverview({ userId, onSelectModule }: ExamOverviewProps) {
  const [exams, setExams] = useState<ExamPreparation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Exam Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newExam, setNewExam] = useState({
     module_name: '',
     exam_date: '',
     readiness_score: 1
  });

  const fetchExams = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
       .from('exam_preparation')
       .select('*')
       .eq('user_id', userId)
       .order('exam_date', { ascending: true });
    if (data) setExams(data as ExamPreparation[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, [userId]);

  const handleSaveNew = async () => {
    if (!newExam.module_name || !newExam.exam_date) return;
    const supabase = getSupabaseClient();
    try {
      await supabase.from('exam_preparation').insert({
         user_id: userId,
         module_name: newExam.module_name,
         exam_date: new Date(newExam.exam_date).toISOString(),
         readiness_score: newExam.readiness_score
      });
      toast.success("Exam added");
      setIsAdding(false);
      setNewExam({ module_name: '', exam_date: '', readiness_score: 1 });
      fetchExams();
    } catch {
      toast.error("Failed to add exam");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ExamPreparation>) => {
     // Optimistic update
     setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
     
     const supabase = getSupabaseClient();
     try {
        await supabase.from('exam_preparation').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
     } catch {
        toast.error("Failed to update");
        fetchExams(); // Revert
     }
  };

  const handleDelete = async (id: string) => {
     if (!confirm("Remove this exam?")) return;
     const supabase = getSupabaseClient();
     await supabase.from('exam_preparation').delete().eq('id', id);
     fetchExams();
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading exams...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <BookOpen size={20} className="text-violet-600" /> Exam Overview
          </h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-sm bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-100 font-medium"
          >
            {isAdding ? "Cancel" : "+ Add Exam"}
          </button>
       </div>

       {isAdding && (
         <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Module</label>
                  <input 
                    className="w-full text-sm p-2 border rounded-md" 
                    placeholder="e.g. Criminal Law"
                    value={newExam.module_name}
                    onChange={e => setNewExam({...newExam, module_name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                  <input 
                    type="date"
                    className="w-full text-sm p-2 border rounded-md" 
                    value={newExam.exam_date}
                    onChange={e => setNewExam({...newExam, exam_date: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Initial Readiness</label>
                  <input 
                    type="range" min="1" max="5"
                    className="w-full h-9" 
                    value={newExam.readiness_score}
                    onChange={e => setNewExam({...newExam, readiness_score: parseInt(e.target.value)})}
                  />
               </div>
            </div>
            <button onClick={handleSaveNew} className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-violet-700">
               Save Exam
            </button>
         </div>
       )}

       <div className="overflow-x-auto">
          <table className="w-full text-sm">
             <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                   <th className="py-3 font-semibold w-[25%]">Module</th>
                   <th className="py-3 font-semibold w-[20%]">Date</th>
                   <th className="py-3 font-semibold w-[25%]">Readiness (1-5)</th>
                   <th className="py-3 font-semibold w-[15%]">Syllabus</th>
                   <th className="py-3 font-semibold w-[15%]"></th>
                </tr>
             </thead>
             <tbody>
                {exams.map(exam => (
                   <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                      <td className="py-3">
                         <div className="font-medium text-gray-800">{exam.module_name}</div>
                         <div className="text-xs text-gray-500 font-mono">{exam.module_code}</div>
                      </td>
                      <td className="py-3 text-gray-600">
                         {new Date(exam.exam_date).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                      </td>
                      <td className="py-3">
                         <div className="flex items-center gap-2">
                            <input 
                               type="range" min="1" max="5" 
                               value={exam.readiness_score || 1}
                               onChange={(e) => handleUpdate(exam.id, { readiness_score: parseInt(e.target.value) })}
                               className="w-24 accent-violet-600 cursor-pointer"
                            />
                            <span className="font-bold text-violet-600">{exam.readiness_score}/5</span>
                         </div>
                      </td>
                      <td className="py-3">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                               type="checkbox"
                               checked={exam.syllabus_covered || false}
                               onChange={(e) => handleUpdate(exam.id, { syllabus_covered: e.target.checked })}
                               className="rounded text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs text-gray-600">Covered</span>
                         </label>
                      </td>
                      <td className="py-3 text-right">
                         <div className="flex items-center justify-end gap-2 text-gray-400">
                            <button 
                               onClick={() => onSelectModule(exam.module_name || 'Exam', new Date(exam.exam_date).toLocaleDateString('en-GB', { timeZone: 'Europe/London' }), exam.module_id)}
                               className="hover:text-violet-600 p-1" title="Plan Revision"
                            >
                               <BookOpen size={16} />
                            </button>
                            <button 
                               onClick={() => handleDelete(exam.id)}
                               className="hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </td>
                   </tr>
                ))}
                {exams.length === 0 && !isAdding && (
                   <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                         No exams tracked yet. Add one to start preparing.
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}
