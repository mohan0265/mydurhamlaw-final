// src/components/calendar/PersonalItemModal.tsx
import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export type PersonalItemType = 'study' | 'task' | 'appointment' | 'reminder';
export type PersonalItemPriority = 'low' | 'medium' | 'high';

export interface PersonalItemFormData {
  title: string;
  type: PersonalItemType;
  date: string; // YYYY-MM-DD
  isAllDay: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  priority: PersonalItemPriority;
  notes: string;
  moduleId?: string;
}

interface PersonalItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: 'create' | 'edit';
  initialDate?: string; // YYYY-MM-DD for create mode
  existingItem?: {
    id: string;
    title: string;
    type: PersonalItemType;
    start_at: string;
    end_at?: string;
    is_all_day: boolean;
    priority: PersonalItemPriority;
    notes?: string;
    module_id?: string;
    completed: boolean;
  };
}

export default function PersonalItemModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialDate,
  existingItem,
}: PersonalItemModalProps) {
  const [formData, setFormData] = useState<PersonalItemFormData>({
    title: '',
    type: 'study',
    date: initialDate || new Date().toISOString().substring(0, 10),
    isAllDay: true,
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium',
    notes: '',
  });
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form from existing item
  useEffect(() => {
    if (mode === 'edit' && existingItem) {
      const startDate = new Date(existingItem.start_at);
      const endDate = existingItem.end_at ? new Date(existingItem.end_at) : null;
      
      setFormData({
        title: existingItem.title,
        type: existingItem.type,
        date: existingItem.start_at.substring(0, 10),
        isAllDay: existingItem.is_all_day,
        startTime: existingItem.is_all_day ? '09:00' : startDate.toISOString().substring(11, 16),
        endTime: existingItem.is_all_day || !endDate ? '10:00' : endDate.toISOString().substring(11, 16),
        priority: existingItem.priority,
        notes: existingItem.notes || '',
        moduleId: existingItem.module_id,
      });
      setCompleted(existingItem.completed);
    }
  }, [mode, existingItem]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database unavailable');

      // Build start/end timestamps
      let start_at: string;
      let end_at: string | null = null;

      if (formData.isAllDay) {
        start_at = `${formData.date}T00:00:00Z`;
        end_at = `${formData.date}T23:59:59Z`;
      } else {
        start_at = `${formData.date}T${formData.startTime}:00Z`;
        if (formData.endTime) {
          end_at = `${formData.date}T${formData.endTime}:00Z`;
        }
      }

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        start_at,
        end_at,
        is_all_day: formData.isAllDay,
        priority: formData.priority,
        notes: formData.notes.trim() || null,
        module_id: formData.moduleId || null,
        completed,
      };

      if (mode === 'create') {
        const { error } = await supabase.from('personal_items').insert([payload]);
        if (error) throw error;
        toast.success('Personal item created');
      } else {
        if (!existingItem?.id) throw new Error('No item ID');
        const { error } = await supabase
          .from('personal_items')
          .update(payload)
          .eq('id', existingItem.id);
        if (error) throw error;
        toast.success('Personal item updated');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingItem?.id) return;
    if (!confirm('Delete this item?')) return;

    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database unavailable');

      const { error } = await supabase.from('personal_items').delete().eq('id', existingItem.id);
      if (error) throw error;

      toast.success('Personal item deleted');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {mode === 'create' ? 'Add Personal Item' : 'Edit Personal Item'}
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Study Tort Law"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PersonalItemType })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="study">Study Block</option>
                <option value="task">Task</option>
                <option value="appointment">Appointment</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* All-day toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="allDay" className="text-sm font-medium">All-day event</label>
            </div>

            {/* Time range (if not all-day) */}
            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PersonalItemPriority })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Optional notes..."
              />
            </div>

            {/* Completed checkbox (edit mode only) */}
            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="completed" className="text-sm font-medium">Mark as completed</label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div>
              {mode === 'edit' && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
