import { Assignment, AssignmentMilestone } from '@/types/assignments';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Calendar, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface MilestonesTabProps {
  assignment: Assignment;
}

export default function MilestonesTab({ assignment }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<AssignmentMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const fetchMilestones = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('assignment_milestones')
      .select('*')
      .eq('assignment_id', assignment.id)
      .order('due_at', { ascending: true });
      
    if (data) setMilestones(data as AssignmentMilestone[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchMilestones();
  }, [assignment.id]);

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const supabase = getSupabaseClient();
    const tempId = `temp-${Date.now()}`;
    const newMilestone: AssignmentMilestone = {
        id: tempId,
        user_id: assignment.user_id,
        assignment_id: assignment.id,
        title: newTitle,
        due_at: new Date(newDate).toISOString(),
        status: 'pending',
        sort_order: milestones.length,
        created_at: new Date().toISOString()
    };
    
    setMilestones([...milestones, newMilestone].sort((a,b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()));
    setNewTitle('');
    setNewDate('');

    const { data, error } = await supabase
        .from('assignment_milestones')
        .insert({
            assignment_id: assignment.id,
            user_id: assignment.user_id,
            title: newMilestone.title,
            due_at: newMilestone.due_at,
            status: 'pending'
        })
        .select()
        .single();
        
    if (error) {
        toast.error("Failed to add milestone");
        setMilestones(prev => prev.filter(m => m.id !== tempId));
    } else {
        setMilestones(prev => prev.map(m => m.id === tempId ? (data as AssignmentMilestone) : m));
    }
  }

  const handleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'pending' ? 'completed' : 'pending';
    const supabase = getSupabaseClient();
    
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status: nextStatus as any } : m));
    await supabase.from('assignment_milestones').update({ status: nextStatus }).eq('id', id);
  }

  const handleDelete = async (id: string) => {
     const supabase = getSupabaseClient();
     setMilestones(prev => prev.filter(m => m.id !== id));
     await supabase.from('assignment_milestones').delete().eq('id', id);
  }

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading timeline...</div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">No milestones set</p>
                    <p className="text-xs text-gray-400">Add key dates like 'First Draft' or 'Research Complete'.</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-gray-200 ml-4 space-y-6 my-4">
                    {milestones.map((m) => {
                        const due = new Date(m.due_at!);
                        const overdue = isPast(due) && !isToday(due) && m.status !== 'completed';
                        
                        return (
                            <div key={m.id} className="ml-6 relative">
                                {/* Dot */}
                                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                                    m.status === 'completed' ? 'border-green-500 bg-green-50' : 
                                    overdue ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`} />
                                
                                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-violet-200 transition group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-bold ${m.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {m.title}
                                            </h4>
                                            <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                                                <Calendar size={12} />
                                                {format(due, 'PPP')}
                                                {overdue && <span className="text-red-600 font-bold uppercase text-[10px] ml-1 bg-red-50 px-1 rounded">Overdue</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleStatus(m.id, m.status)}
                                                className={`p-1.5 rounded-lg transition ${
                                                    m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-green-600'
                                                }`}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(m.id)}
                                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex gap-2 items-center">
            <input 
                type="text" 
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="Milestone title (e.g. First Draft)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
            />
            <input 
                type="date" 
                className="w-32 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
            />
            <button 
                type="submit"
                disabled={!newTitle || !newDate}
                className="bg-gray-900 text-white p-2 rounded-lg hover:bg-violet-600 transition disabled:opacity-50"
            >
                <Plus size={20} />
            </button>
        </form>
    </div>
  )
}
