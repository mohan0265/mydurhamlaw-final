// src/components/calendar/UnifiedAddModal.tsx
// Unified modal for adding Personal Items OR Assignments
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export type ItemCategory = 'personal' | 'assignment';
export type PersonalItemType = 'study' | 'task' | 'appointment' | 'reminder';
export type AssignmentType = 'essay' | 'problem' | 'presentation' | 'moot' | 'other';

interface UnifiedAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialDate?: string; // YYYY-MM-DD
  category?: ItemCategory; // Pre-select category
}

export default function UnifiedAddModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  category: initialCategory = 'personal',
}: UnifiedAddModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<ItemCategory>(initialCategory);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal Item fields
  const [personalData, setPersonalData] = useState({
    title: '',
    type: 'study' as PersonalItemType,
    date: initialDate || new Date().toISOString().substring(0, 10),
    isAllDay: true,
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
  });

  // Assignment fields
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    moduleCode: '',
    moduleName: '',
    type: 'essay' as AssignmentType,
    dueDate: initialDate || '',
    dueTime: '23:59',
    wordLimit: '',
    effort: '',
    brief: '',
    briefFile: null as File | null,
  });

  // Reset on category change
  useEffect(() => {
    if (isOpen) {
      const date = initialDate || new Date().toISOString().substring(0, 10);
      setPersonalData(prev => ({ ...prev, date }));
      setAssignmentData(prev => ({ ...prev, dueDate: date }));
    }
  }, [isOpen, initialDate]);

  const handleSavePersonal = async () => {
    if (!personalData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user?.id) throw new Error('Not authenticated');

      let start_at: string;
      let end_at: string | null = null;

      if (personalData.isAllDay) {
        start_at = `${personalData.date}T00:00:00Z`;
        end_at = `${personalData.date}T23:59:59Z`;
      } else {
        start_at = `${personalData.date}T${personalData.startTime}:00Z`;
        if (personalData.endTime) {
          end_at = `${personalData.date}T${personalData.endTime}:00Z`;
        }
      }

      const payload = {
        user_id: user.id,
        title: personalData.title.trim(),
        type: personalData.type,
        start_at,
        end_at,
        is_all_day: personalData.isAllDay,
        priority: personalData.priority,
        notes: personalData.notes.trim() || null,
        completed: false,
      };

      const { error } = await supabase.from('personal_items').insert([payload]);
      if (error) throw error;

      toast.success('Personal item added');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentData.title.trim()) {
      toast.error('Assignment title is required');
      return;
    }
    if (!assignmentData.dueDate) {
      toast.error('Due date is required');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user?.id) throw new Error('Not authenticated');

      // Build due date timestamp
      const dueDateTime = `${assignmentData.dueDate}T${assignmentData.dueTime}:00Z`;

      const payload = {
        user_id: user.id,
        title: assignmentData.title.trim(),
        module_code: assignmentData.moduleCode.trim() || null,
        module_name: assignmentData.moduleName.trim() || null,
        assignment_type: assignmentData.type,
        due_date: dueDateTime,
        word_limit: assignmentData.wordLimit ? parseInt(assignmentData.wordLimit) : null,
        estimated_effort: assignmentData.effort ? parseInt(assignmentData.effort) : null,
        brief: assignmentData.brief.trim() || null,
        status: 'not_started',
      };

      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // If there's a brief file, upload it
      if (assignmentData.briefFile && newAssignment) {
        const fileExt = assignmentData.briefFile.name.split('.').pop();
        const fileName = `${newAssignment.id}_brief.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignment-briefs')
          .upload(filePath, assignmentData.briefFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast.error('Assignment saved but file upload failed');
        } else {
          // Update assignment with file path
          await supabase
            .from('assignments')
            .update({ brief_file_path: filePath })
            .eq('id', newAssignment.id);
        }
      }

      toast.success('Assignment added');
      onSave();
      onClose();

      // Optionally navigate to assignments page
      // router.push(`/assignments?assignmentId=${newAssignment.id}`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      setAssignmentData(prev => ({ ...prev, briefFile: file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Add Item</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Category Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCategory('personal')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  category === 'personal'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personal Item
              </button>
              <button
                onClick={() => setCategory('assignment')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  category === 'assignment'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assignment
              </button>
            </div>
          </div>

          {/* Personal Item Form */}
          {category === 'personal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={personalData.title}
                  onChange={(e) => setPersonalData({ ...personalData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Study Tort Law"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={personalData.type}
                  onChange={(e) => setPersonalData({ ...personalData, type: e.target.value as PersonalItemType })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="study">Study Block</option>
                  <option value="task">Task</option>
                  <option value="appointment">Appointment</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={personalData.date}
                  onChange={(e) => setPersonalData({ ...personalData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={personalData.isAllDay}
                  onChange={(e) => setPersonalData({ ...personalData, isAllDay: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="allDay" className="text-sm font-medium">All-day event</label>
              </div>

              {!personalData.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={personalData.startTime}
                      onChange={(e) => setPersonalData({ ...personalData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={personalData.endTime}
                      onChange={(e) => setPersonalData({ ...personalData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={personalData.priority}
                  onChange={(e) => setPersonalData({ ...personalData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={personalData.notes}
                  onChange={(e) => setPersonalData({ ...personalData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          )}

          {/* Assignment Form */}
          {category === 'assignment' && (
            <div className="space-y-4">
              {/* PDF Upload */}
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
                <div className="text-sm font-medium text-purple-900 mb-2">
                  📄 Upload Assignment Brief (Optional)
                </div>
                <p className="text-xs text-purple-700 mb-3">
                  Upload a PDF or Word document to auto-fill the form below
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  {assignmentData.briefFile ? assignmentData.briefFile.name : 'Choose PDF or Word Doc'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Contract Law Essay - Frustration"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Module Code</label>
                  <input
                    type="text"
                    value={assignmentData.moduleCode}
                    onChange={(e) => setAssignmentData({ ...assignmentData, moduleCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., LAW1011"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Module Name</label>
                  <input
                    type="text"
                    value={assignmentData.moduleName}
                    onChange={(e) => setAssignmentData({ ...assignmentData, moduleName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Contract Law"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={assignmentData.type}
                    onChange={(e) => setAssignmentData({ ...assignmentData, type: e.target.value as AssignmentType })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="essay">Essay</option>
                    <option value="problem">Problem Question</option>
                    <option value="presentation">Presentation</option>
                    <option value="moot">Moot</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Est. Effort (Hours)</label>
                  <input
                    type="number"
                    value={assignmentData.effort}
                    onChange={(e) => setAssignmentData({ ...assignmentData, effort: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={assignmentData.dueDate}
                    onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={assignmentData.dueTime}
                    onChange={(e) => setAssignmentData({ ...assignmentData, dueTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Word Limit</label>
                <input
                  type="number"
                  value={assignmentData.wordLimit}
                  onChange={(e) => setAssignmentData({ ...assignmentData, wordLimit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Question / Brief</label>
                <textarea
                  value={assignmentData.brief}
                  onChange={(e) => setAssignmentData({ ...assignmentData, brief: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Paste the assignment question or brief here..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={category === 'personal' ? handleSavePersonal : handleSaveAssignment}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
