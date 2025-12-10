import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { Loader2, Calendar as CalendarIcon, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssignmentCreateFormProps {
  onCancel: () => void;
  onSave: () => void;
  initialDate?: Date; // For YAAG quick-add
}

export default function AssignmentCreateForm({ onCancel, onSave, initialDate }: AssignmentCreateFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    module_code: '',
    module_name: '',
    assignment_type: 'Essay',
    due_date: initialDate ? initialDate.toISOString().split('T')[0] : '',
    due_time: '12:00',
    question_text: '',
    estimated_effort_hours: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.title || !formData.due_date) {
      toast.error("Please enter a title and due date");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    
    // Combine date and time
    const dueDateTime = new Date(`${formData.due_date}T${formData.due_time || '23:59'}:00`).toISOString();

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          user_id: user.id,
          title: formData.title,
          module_code: formData.module_code,
          module_name: formData.module_name,
          assignment_type: formData.assignment_type,
          due_date: dueDateTime,
          question_text: formData.question_text,
          estimated_effort_hours: formData.estimated_effort_hours ? parseFloat(formData.estimated_effort_hours) : null,
          status: 'not_started'
        });

      if (error) throw error;
      toast.success("Assignment created!");
      onSave();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">New Assignment</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Contract Law Essay - Frustration"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-500 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Code</label>
            <input
              name="module_code"
              value={formData.module_code}
              onChange={handleChange}
              placeholder="e.g. LAW1011"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Name</label>
            <input
              name="module_name"
              value={formData.module_name}
              onChange={handleChange}
              placeholder="e.g. Contract Law"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="assignment_type"
              value={formData.assignment_type}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
            >
              <option value="Essay">Essay</option>
              <option value="Problem Question">Problem Question</option>
              <option value="Presentation">Presentation</option>
              <option value="Dissertation">Dissertation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Effort (Hours)</label>
            <input
              type="number"
              name="estimated_effort_hours"
              value={formData.estimated_effort_hours}
              onChange={handleChange}
              placeholder="10"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              name="due_time"
              value={formData.due_time}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question / Brief</label>
          <textarea
            name="question_text"
            value={formData.question_text}
            onChange={handleChange}
            placeholder="Paste the assignment question or brief here..."
            className="w-full h-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none resize-none"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save size={18} /> Create Assignment</>}
          </button>
        </div>
      </form>
    </div>
  );
}
