import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { getYearDisplayName, type YearKey } from '@/lib/academic/preview';

interface TrialPreviewBannerProps {
  realYear: YearKey;
  effectiveYear: YearKey;
  isPreview: boolean;
  inTrial: boolean;
  trialDaysRemaining?: number;
}

const TrialPreviewBanner: React.FC<TrialPreviewBannerProps> = ({
  realYear,
  effectiveYear,
  isPreview,
  inTrial,
  trialDaysRemaining = 0
}) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  // Always hide trial banner to remove gating
  return null;

  const handleReturnToMyYear = () => {
    // Remove preview parameter and redirect to real year dashboard
    const currentPath = router.asPath.split('?')[0];
    const realYearPath = realYear === 'foundation' ? '/dashboard/foundation' :
                        realYear === 'year_1' ? '/dashboard/year1' :
                        realYear === 'year_2' ? '/dashboard/year2' : '/dashboard/year3';
    
    router.push(realYearPath);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <>
      {/* Trial Warning (always show during trial) */}
      {inTrial && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-amber-800">
                  Trial Period Active
                </span>
                <span className="text-amber-700 ml-2">
                  {trialDaysRemaining > 0 
                    ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                    : 'Trial expires soon'
                  }
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Preview Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-blue-900 text-sm">
                  Preview Mode: {getYearDisplayName(effectiveYear)}
                </div>
                <div className="text-blue-700 text-xs">
                  Your registered year is {getYearDisplayName(realYear)} • Changes won&apos;t be saved
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-blue-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Trial preview only</span>
            </div>
            <button
              onClick={handleReturnToMyYear}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My Year
            </button>
          </div>
        </div>
      </div>

      {/* Additional context for mobile */}
      <div className="sm:hidden bg-blue-50 px-4 py-2 border-b border-blue-200">
        <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
          <AlertTriangle className="w-3 h-3" />
          <span>Preview only • Changes won&apos;t be saved</span>
        </div>
      </div>
    </>
  );
};

export default TrialPreviewBanner;

// Hook to get preview state from middleware headers or URL params
export function usePreviewState() {
  const router = useRouter();
  const [previewState, setPreviewState] = useState({
    realYear: 'foundation' as YearKey,
    effectiveYear: 'foundation' as YearKey,
    isPreview: false,
    inTrial: false,
    canPreview: false
  });

  useEffect(() => {
    // Try to get from URL params first (client-side)
    const previewParam = router.query.previewYear as string;
    const isPreviewMode = !!previewParam;

    // For now, we'll need to get this info from the AuthContext or API call
    // This would be enhanced with actual user profile data
    setPreviewState(prev => ({
      ...prev,
      isPreview: isPreviewMode
    }));
  }, [router.query]);

  return previewState;
}