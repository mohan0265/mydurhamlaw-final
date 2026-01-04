import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { Loader2, Calendar as CalendarIcon, Save, X, Upload, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AssignmentCreateFormProps {
  onCancel: () => void;
  onSave: () => void;
  initialDate?: Date; // For YAAG quick-add
}

export default function AssignmentCreateForm({ onCancel, onSave, initialDate }: AssignmentCreateFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadedFile(file);

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) throw new Error('Not authenticated');

      // Upload file to Supabase storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName);

      // Parse the document
      const parseResponse = await fetch('/api/assignment/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: publicUrl,
          fileName: file.name,
          assignmentId: null // No assignmentassignment yet
        })
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        throw new Error(error.error || 'Failed to parse document');
      }

      const parsed = await parseResponse.json();
      
      // Auto-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        title: parsed.parsedData?.title || prev.title,
        module_code: parsed.parsedData?.moduleCode || prev.module_code,
        module_name: parsed.parsedData?.moduleName || prev.module_name,
        assignment_type: parsed.parsedData?.type || prev.assignment_type,
        due_date: parsed.parsedData?.dueDate?.split('T')[0] || prev.due_date,
        question_text: parsed.parsedData?.fullText || prev.question_text,
        estimated_effort_hours: parsed.parsedData?.wordLimit ? String(Math.ceil(parseInt(parsed.parsedData.wordLimit) / 250)) : prev.estimated_effort_hours
      }));

      toast.success('✅ Document parsed! Form auto-filled.');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to parse document');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
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
        {/* File Upload Section */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-dashed border-violet-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-600" />
              <h3 className="font-semibold text-gray-800">Upload Assignment Brief (Optional)</h3>
            </div>
            {uploadedFile && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>{uploadedFile.name}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Upload a PDF or Word document to auto-fill the form below
          </p>
          <label className="block">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="brief-upload"
            />
            <label
              htmlFor="brief-upload"
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-violet-300 rounded-lg font-medium transition-colors cursor-pointer ${
                uploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-violet-600 hover:bg-violet-50'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Parsing document...
                </>
              ) : uploadedFile ? (
                <>
                  <FileText className="w-5 h-5" />
                  Upload different file
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Choose PDF or Word Doc
                </>
              )}
            </label>
          </label>
        </div>

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
