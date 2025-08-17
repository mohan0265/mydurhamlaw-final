import React from 'react';
import { X, Clock, Eye, Shield, BookOpen } from 'lucide-react';

interface TrialExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
  primaryYear: string;
}

const TrialExplainerModal: React.FC<TrialExplainerModalProps> = ({
  isOpen,
  onClose,
  daysRemaining,
  primaryYear
}) => {
  if (!isOpen) return null;

  const getYearLabel = (year: string) => {
    const labels: Record<string, string> = {
      foundation: 'Foundation',
      year1: 'Year 1',
      year2: 'Year 2',
      year3: 'Year 3'
    };
    return labels[year] || year;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">30-Day Trial Preview</h2>
                <p className="text-sm text-gray-600">{daysRemaining} days remaining</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Welcome to MyDurhamLaw!</h3>
                  <p className="text-sm text-blue-700">
                    You&apos;re registered for <strong>{getYearLabel(primaryYear)}</strong>. 
                    For the next {daysRemaining} days, you can preview other years to explore the full curriculum.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Explore All Years</h4>
                  <p className="text-sm text-gray-600">
                    Browse modules, assignments, and resources from Foundation through Year 3 to plan your academic journey.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Your Data Stays Safe</h4>
                  <p className="text-sm text-gray-600">
                    All your personal data, progress, and assignments remain tied to your registered year ({getYearLabel(primaryYear)}).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Preview Mode Only</h4>
                  <p className="text-sm text-gray-600">
                    After {daysRemaining} days, you&apos;ll automatically return to your registered year with full access to all features.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">How to Use Preview Mode</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Look for the &quot;Trial Preview&quot; switcher in your dashboard
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Select any year to preview its curriculum and modules
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Click &quot;Return to My Year&quot; anytime to go back to {getYearLabel(primaryYear)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExplainerModal;