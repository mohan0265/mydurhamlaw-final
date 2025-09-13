import React, { useState } from 'react';
import { Shield, Check, AlertTriangle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

interface IntegrityPledgeProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledged: (pledgedAt: string) => void;
}

const IntegrityPledge: React.FC<IntegrityPledgeProps> = ({ isOpen, onClose, onAcknowledged }) => {
  const { user } = useAuth();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !isChecked) return;
    
    setIsSubmitting(true);
    const pledgedAt = new Date().toISOString();
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          integrity_acknowledged: true,
          integrity_pledge_at: pledgedAt,
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating integrity pledge:', error);
        // Handle error gracefully in UI
        return;
      }
      
      onAcknowledged(pledgedAt);
      onClose();
    } catch (error) {
      console.error('Error submitting pledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Academic Integrity Pledge</h2>
              <p className="text-sm text-gray-600">Required before using AI assistance</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Important</p>
                <p className="text-sm text-amber-700 mt-1">
                  This pledge ensures your use of AI meets Durham University&apos;s academic integrity standards.
                </p>
              </div>
            </div>
          </div>

          {/* Pledge Item */}
          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  isChecked
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">I will submit only my own original work</p>
                <p className="text-sm text-gray-600 mt-1">
                  AI output is guidance to be rewritten and cited where appropriate.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isChecked || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isChecked && !isSubmitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'I Acknowledge'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By acknowledging this pledge, you agree to uphold Durham University&apos;s academic integrity standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrityPledge;