import { Assignment, AssignmentRubricCriterion } from '@/types/assignments';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Award, Info } from 'lucide-react';

interface RubricTabProps {
  assignment: Assignment;
}

export default function RubricTab({ assignment }: RubricTabProps) {
  const [criteria, setCriteria] = useState<AssignmentRubricCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Item State
  const [criterion, setCriterion] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCriteria = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('assignment_rubric_criteria')
      .select('*')
      .eq('assignment_id', assignment.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
      
    if (data) setCriteria(data as AssignmentRubricCriterion[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchCriteria();
  }, [assignment.id]);

  const handleAdd = async () => {
    if (!criterion.trim()) return;
    
    const supabase = getSupabaseClient();
    const newOrder = criteria.length;
    
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const newCrit: AssignmentRubricCriterion = {
        id: tempId,
        user_id: assignment.user_id,
        assignment_id: assignment.id,
        criterion: criterion,
        description: description,
        weight: weight === '' ? undefined : Number(weight),
        sort_order: newOrder,
        created_at: new Date().toISOString()
    };
    
    const prevList = [...criteria];
    setCriteria([...criteria, newCrit]);
    setShowAddForm(false);
    // Reset form
    setCriterion(''); 
    setDescription(''); 
    setWeight('');

    const { data, error } = await supabase
        .from('assignment_rubric_criteria')
        .insert({
            assignment_id: assignment.id,
            user_id: assignment.user_id,
            criterion: newCrit.criterion,
            description: newCrit.description,
            weight: newCrit.weight,
            sort_order: newCrit.sort_order
        })
        .select()
        .single();
        
    if (error) {
        toast.error("Failed to add criterion");
        setCriteria(prevList);
    } else {
        setCriteria(prev => prev.map(c => c.id === tempId ? (data as AssignmentRubricCriterion) : c));
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseClient();
    setCriteria(prev => prev.filter(c => c.id !== id));
    await supabase.from('assignment_rubric_criteria').delete().eq('id', id);
  }

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
        {/* Header Summary */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Award size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">Marking Rubric</h4>
                    <p className="text-xs text-gray-500">Define how this assignment is graded.</p>
                </div>
            </div>
            <div className={`text-right ${totalWeight > 100 ? 'text-red-500' : totalWeight === 100 ? 'text-green-600' : 'text-gray-500'}`}>
                <p className="text-2xl font-bold">{totalWeight}%</p>
                <p className="text-xs uppercase font-bold">Total Weight</p>
            </div>
        </div>

        {/* Criteria List */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading rubric...</div>
            ) : criteria.length === 0 && !showAddForm ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium mb-4">No criteria defined yet.</p>
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:border-violet-400 hover:text-violet-600 transition"
                    >
                        + Add First Criterion
                    </button>
                </div>
            ) : (
                criteria.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{c.criterion}</h4>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{c.weight ? `${c.weight}%` : '-'}</span>
                                <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        {c.description && <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>}
                    </div>
                ))
            )}
            
            {showAddForm && (
                <div className="bg-gray-50 border border-violet-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Criterion Name</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="e.g. Critical Analysis"
                                value={criterion}
                                onChange={(e) => setCriterion(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (%)</label>
                            <input 
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="25"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none h-20"
                            placeholder="What constitutes a high mark in this category?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button 
                            onClick={() => setShowAddForm(false)}
                            className="text-gray-500 text-sm font-medium px-4 py-2 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAdd}
                            disabled={!criterion.trim()}
                            className="bg-violet-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                        >
                            Add Criterion
                        </button>
                    </div>
                </div>
            )}
        </div>

        {!showAddForm && criteria.length > 0 && (
             <button 
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-violet-400 hover:text-violet-600 transition flex items-center justify-center gap-2"
             >
                <Plus size={18} /> Add Criteria
             </button>
        )}
    </div>
  )
}
