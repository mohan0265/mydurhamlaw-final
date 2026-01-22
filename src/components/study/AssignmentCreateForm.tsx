import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { Loader2, Calendar as CalendarIcon, Save, X, Upload, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Assignment } from '@/types/assignments';

interface AssignmentCreateFormProps {
  onCancel: () => void;
  onSave: () => void;
  initialDate?: Date; // For YAAG quick-add
  initialData?: Assignment; // For editing
}

export default function AssignmentCreateForm({ onCancel, onSave, initialDate, initialData }: AssignmentCreateFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<any>(null); // Store upload result for linking
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    module_code: initialData?.module_code || '',
    module_name: initialData?.module_name || '',
    assignment_type: initialData?.assignment_type || 'Essay',
    due_date: initialData?.due_date 
      ? new Date(initialData.due_date).toISOString().split('T')[0] 
      : (initialDate ? initialDate.toISOString().split('T')[0] : ''),
    due_time: initialData?.due_date 
      ? new Date(initialData.due_date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})
      : '12:00',
    question_text: initialData?.question_text || '',
    estimated_effort_hours: initialData?.estimated_effort_hours?.toString() || '',
    word_limit: initialData?.word_limit?.toString() || '' // NEW: Word limit field
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
      let data, error;
      
      const payload = {
          user_id: user.id,
          title: formData.title,
          module_code: formData.module_code,
          module_name: formData.module_name,
          assignment_type: formData.assignment_type,
          due_date: dueDateTime,
          question_text: formData.question_text,
          estimated_effort_hours: formData.estimated_effort_hours ? parseFloat(formData.estimated_effort_hours) : null,
          word_limit: formData.word_limit ? parseInt(formData.word_limit) : null, // NEW: Save word limit
          status: initialData ? initialData.status : 'not_started'
      };

      if (initialData) {
         // UPDATE
         const res = await supabase
           .from('assignments')
           .update({ ...payload, updated_at: new Date().toISOString() })
           .eq('id', initialData.id)
           .select()
           .single();
         data = res.data;
         error = res.error;
      } else {
         // INSERT
         const res = await supabase
           .from('assignments')
           .insert(payload)
           .select()
           .single();
         data = res.data;
         error = res.error;
      }

      if (error) throw error;
      const newAssignment = data;

      // Link uploaded file to assignment if exists
      if (newAssignment && uploadedFileData?.uploadedFile) {
        const fileData = uploadedFileData.uploadedFile;
        await supabase.from('assignment_files').insert({
          assignment_id: newAssignment.id,
          user_id: user.id,
          bucket: fileData.bucket,
          path: fileData.path,
          original_name: fileData.originalName,
          mime_type: fileData.mimeType,
          size_bytes: fileData.sizeBytes,
        });
      }

      toast.success(initialData ? "Assignment updated!" : "Assignment created!");
      
      // FIRE AND FORGET: Mark onboarding task as complete
      fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_key: 'add_first_assignment' }),
      }).catch(err => console.warn('[Onboarding] Failed to mark assignment complete', err));

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

      // Get session token for Bearer auth
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No session token');

      // Upload file to assignment_uploads bucket
      const userId = user.id;
      const fileName = `${userId}/${crypto.randomUUID()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-uploads')
        .upload(fileName, file, {
          contentType: file.type || undefined,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Call ingest API with Bearer token
      const parseResponse = await fetch('/api/assignments/ingest-upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bucket: 'assignment-uploads',
          path: fileName,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        throw new Error(error.error || 'Failed to process document');
      }

      const result = await parseResponse.json();
      
      // Auto-fill form with extracted data (API now returns extractedData instead of assignment)
      if (result.extractedData) {
        const updates: any = {
          ...formData,
        };
        
        if (result.extractedData.title) updates.title = result.extractedData.title;
        if (result.extractedData.module_code) updates.module_code = result.extractedData.module_code;
        if (result.extractedData.module_name) updates.module_name = result.extractedData.module_name;
        if (result.extractedPreview) updates.question_text = result.extractedPreview.slice(0, 500);
        if (result.extractedData.word_limit) updates.word_limit = result.extractedData.word_limit.toString();
        
        // Handle due date if extracted
        if (result.extractedData.due_date) {
          try {
            const date = new Date(result.extractedData.due_date);
            if (!isNaN(date.getTime())) {
              updates.due_date = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch {
            // Ignore if can't parse
          }
        }
        
        setFormData(updates);
        // Store uploaded file data for linking after assignment creation
        if (result.uploadedFile) {
          setUploadedFileData(result);
        }
      }

      toast.success('✅ File uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to parse document');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-violet-100 p-6 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-lg shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{initialData ? 'Edit Assignment' : 'New Assignment'}</h2>
            <p className="text-sm text-gray-500">{initialData ? 'Update details below' : 'Add your assignment details below'}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
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

        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Word Limit</label>
            <input
              type="number"
              name="word_limit"
              value={formData.word_limit}
              onChange={handleChange}
              placeholder="1500"
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
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save size={18} /> {initialData ? 'Update Assignment' : 'Create Assignment'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
