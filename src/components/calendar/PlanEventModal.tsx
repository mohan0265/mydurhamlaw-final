// src/components/calendar/PlanEventModal.tsx
import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';
import toast from 'react-hot-toast';
import type { NormalizedEvent } from '@/lib/calendar/normalize';

interface PlanEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  event: NormalizedEvent | null;
}

export const PlanEventModal: React.FC<PlanEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    tutor: '',
    venue: '',
   notes: '',
    is_cancelled: false,
  });
  const [saving, setSaving] = useState(false);
  const [isOverride, setIsOverride] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      // Check if this is an override or original plan event
      const override = event.meta?.source === 'plan_override';
      setIsOverride(override);

      setFormData({
        title: event.title || '',
        tutor: event.meta?.tutor || '',
        venue: event.meta?.venue || '',
        notes: event.meta?.notes || '',
        is_cancelled: event.meta?.is_cancelled || false,
      });
    }
  }, [isOpen, event]);

  const handleSave = async () => {
    if (!user || !event) {
      toast.error('You must be logged in');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      if (isOverride && event.meta?.personalItemId) {
        // Update existing override
        const { error } = await supabase
          .from('personal_items')
          .update({
            title: formData.title.trim(),
            tutor: formData.tutor.trim() || null,
            venue: formData.venue.trim() || null,
            notes: formData.notes.trim() || null,
            is_cancelled: formData.is_cancelled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.meta.personalItemId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Plan event updated!');
      } else {
        // Create new override
        const { error } = await supabase
          .from('personal_items')
          .insert({
            user_id: user.id,
            title: formData.title.trim(),
            type: 'study', // Default type for plan overrides
            start_at: `${event.date}T${event.start || '00:00'}:00Z`,
            end_at: event.end ? `${event.date}T${event.end}:00Z` : null,
            is_all_day: !event.start,
            original_plan_id: event.id,
            tutor: formData.tutor.trim() || null,
            venue: formData.venue.trim() || null,
            notes: formData.notes.trim() || null,
            is_cancelled: formData.is_cancelled,
          });

        if (error) throw error;
        toast.success('Customization saved!');
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

  const handleRevert = async () => {
    if (!user || !event?.meta?.personalItemId) return;

    if (!confirm('Revert to original plan event? Your customizations will be lost.')) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('personal_items')
        .delete()
        .eq('id', event.meta.personalItemId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Reverted to original!');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Revert error:', error);
      toast.error(error.message || 'Failed to revert');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold">
              {isOverride ? 'Edit Customization' : 'Customize Event'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {event.moduleCode || 'Plan Event'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={event.title}
            />
            <p className="text-xs text-gray-500 mt-1">
              Customize the title (e.g., add professor name)
            </p>
          </div>

          {/* Tutor/Lecturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutor / Lecturer
            </label>
            <input
              type="text"
              value={formData.tutor}
              onChange={(e) => setFormData({ ...formData, tutor: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Prof. Smith"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue / Location
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Room 301, Main Building"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Personal notes about this event..."
            />
          </div>

          {/* Mark as Cancelled */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cancelled"
              checked={formData.is_cancelled}
              onChange={(e) => setFormData({ ...formData, is_cancelled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="cancelled" className="text-sm text-gray-700">
              Mark as cancelled
            </label>
          </div>

          {isOverride && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ✓ This event has been customized by you
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 sticky bottom-0">
          <div>
            {isOverride && (
              <button
                onClick={handleRevert}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" />
                Revert to Original
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
