import { Assignment, AssignmentChecklistItem } from '@/types/assignments';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface ChecklistTabProps {
  assignment: Assignment;
}

export default function ChecklistTab({ assignment }: ChecklistTabProps) {
  const [items, setItems] = useState<AssignmentChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemLabel, setNewItemLabel] = useState('');

  const fetchItems = async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('assignment_checklist_items')
      .select('*')
      .eq('assignment_id', assignment.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
      
    if (data) setItems(data as AssignmentChecklistItem[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, [assignment.id]);

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItemLabel.trim()) return;

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const newItem: AssignmentChecklistItem = {
        id: tempId,
        user_id: assignment.user_id,
        assignment_id: assignment.id,
        label: newItemLabel,
        is_done: false,
        sort_order: items.length,
        created_at: new Date().toISOString()
    };
    setItems([...items, newItem]);
    setNewItemLabel('');

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('assignment_checklist_items')
        .insert({
            assignment_id: assignment.id,
            label: newItem.label,
            user_id: assignment.user_id, // explicit for RLS safety, though trigger might handle
            sort_order: newItem.sort_order
        })
        .select()
        .single();
    
    if (error) {
        toast.error('Failed to add item');
        setItems(prev => prev.filter(i => i.id !== tempId));
    } else {
        setItems(prev => prev.map(i => i.id === tempId ? (data as AssignmentChecklistItem) : i));
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    const supabase = getSupabaseClient();
    // Optimistic
    setItems(items.map(i => i.id === id ? { ...i, is_done: !current } : i));
    
    await supabase
        .from('assignment_checklist_items')
        .update({ is_done: !current })
        .eq('id', id);
  }

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseClient();
    // Optimistic
    const prevItems = [...items];
    setItems(prevItems.filter(i => i.id !== id));
    
    const { error } = await supabase.from('assignment_checklist_items').delete().eq('id', id);
    if (error) {
        toast.error("Failed to delete");
        setItems(prevItems);
    }
  }

  const progress = items.length > 0 ? Math.round((items.filter(i => i.is_done).length / items.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
       {/* Progress Header */}
       <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 rounded-xl border border-violet-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-violet-800">Completion Progress</h4>
            <p className="text-xs text-violet-600">{items.filter(i => i.is_done).length} of {items.length} tasks completed</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-violet-600">{progress}%</span>
          </div>
       </div>

       {/* List using custom scrollbar */}
       <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? (
             <div className="text-center py-8 text-gray-400 text-sm">Loading checklist...</div>
          ) : items.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No tasks yet</p>
                <p className="text-xs text-gray-400">Break your assignment down into small steps.</p>
             </div>
          ) : (
            items.map((item) => (
                <div key={item.id} className="group flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-violet-200 transition-colors">
                    <button 
                        onClick={() => handleToggle(item.id, item.is_done)}
                        className={`mt-0.5 flex-none ${item.is_done ? 'text-green-500' : 'text-gray-300 hover:text-violet-500'} transition`}
                    >
                        {item.is_done ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <span className={`flex-1 text-sm leading-relaxed ${item.is_done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {item.label}
                    </span>
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))
          )}
       </div>

       {/* Add New */}
       <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input 
            type="text" 
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
            placeholder="Add a new task (e.g. 'Find 3 cases on negligence')" // Ethics: specific actionable task
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newItemLabel.trim()}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-violet-600 transition disabled:opacity-50 flex items-center justify-center font-bold"
          >
            <Plus size={20} />
          </button>
       </form>
    </div>
  )
}
