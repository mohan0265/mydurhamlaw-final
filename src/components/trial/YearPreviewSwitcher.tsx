import React, { useState } from 'react';
import { ChevronDown, Clock, ArrowLeft, Eye } from 'lucide-react';
import { useActiveYear, type YearGroup } from '@/lib/session/getActiveYear';

interface YearPreviewSwitcherProps {
  className?: string;
}

const YEAR_LABELS: Record<YearGroup, string> = {
  foundation: 'Foundation',
  year1: 'Year 1',
  year2: 'Year 2',
  year3: 'Year 3'
};

const YearPreviewSwitcher: React.FC<YearPreviewSwitcherProps> = ({ className = '' }) => {
  const { activeYear, trialStatus, activatePreviewYear, clearPreview, isPreviewActive } = useActiveYear();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Don't show if trial is not active
  if (!trialStatus?.trialActive) {
    return null;
  }

  const handleYearChange = async (yearGroup: YearGroup) => {
    if (yearGroup === activeYear || isChanging) return;
    
    setIsChanging(true);
    const success = await activatePreviewYear(yearGroup);
    if (success) {
      setIsOpen(false);
      // Reload page to refresh dashboard data
      window.location.reload();
    }
    setIsChanging(false);
  };

  const handleClearPreview = async () => {
    setIsChanging(true);
    const success = await clearPreview();
    if (success) {
      setIsOpen(false);
      // Reload page to refresh dashboard data
      window.location.reload();
    }
    setIsChanging(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trial Preview Banner */}
      {isPreviewActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-blue-900 text-sm">
                  Previewing {YEAR_LABELS[activeYear!]}
                </div>
                <div className="text-blue-700 text-xs">
                  Your primary year is {YEAR_LABELS[trialStatus.primaryYear!]} • 
                  {trialStatus.daysLeft} days remaining
                </div>
              </div>
            </div>
            <button
              onClick={handleClearPreview}
              disabled={isChanging}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My Year
            </button>
          </div>
        </div>
      )}

      {/* Year Switcher */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-gray-900 text-sm">Trial Preview</span>
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {trialStatus.daysLeft} days left
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isChanging}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
          >
            <span className="font-medium text-gray-900">
              {isPreviewActive ? `Previewing ${YEAR_LABELS[activeYear!]}` : YEAR_LABELS[activeYear!]}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
                  Preview any year to explore curriculum
                </div>
                {(['foundation', 'year1', 'year2', 'year3'] as YearGroup[]).map((yearGroup) => (
                  <button
                    key={yearGroup}
                    onClick={() => handleYearChange(yearGroup)}
                    disabled={isChanging}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeYear === yearGroup
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    } ${isChanging ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{YEAR_LABELS[yearGroup]}</span>
                      {activeYear === yearGroup && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {trialStatus.personas.includes(yearGroup) && activeYear !== yearGroup && (
                        <div className="text-xs text-gray-400">Previously viewed</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-100 p-3">
                <div className="text-xs text-gray-500 text-center">
                  Data and progress remain tied to your primary year
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearPreviewSwitcher;