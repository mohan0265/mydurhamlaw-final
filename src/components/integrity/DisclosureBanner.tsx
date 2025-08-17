import React, { useState } from 'react';
import { Info, X, Eye } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/AuthContext';

interface DisclosureBannerProps {
  className?: string;
  onDismiss?: () => void;
}

const DisclosureBanner: React.FC<DisclosureBannerProps> = ({ 
  className = '', 
  onDismiss 
}) => {
  const { user, userProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show if user has opted out or banner is dismissed
  if (!isVisible || !userProfile?.ai_disclosure_consent) {
    return null;
  }

  const handleDismiss = async () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleOptOut = async () => {
    if (!user) return;
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      await supabase
        .from('profiles')
        .update({ ai_disclosure_consent: false })
        .eq('id', user.id);
      
      setIsVisible(false);
      onDismiss?.();
    } catch (error) {
      console.error('Error updating disclosure consent:', error);
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800 font-medium">
                AI Coaching Disclosure
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              AI coaching was used in preparing this work. Final submission is my own original work.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleOptOut}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Hide permanently
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to check if disclosure should be shown based on recent AI usage
export const useDisclosureRequired = () => {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  React.useEffect(() => {
    if (!user) return;

    const checkRecentAIUsage = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          console.error('Supabase client not available');
          return;
        }

        // Check if user has used AI assistance in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data, error } = await supabase
          .from('ai_provenance')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', oneDayAgo.toISOString())
          .limit(1);

        if (!error && data && data.length > 0) {
          setShouldShow(true);
        }
      } catch (error) {
        console.error('Error checking AI usage:', error);
      }
    };

    checkRecentAIUsage();
  }, [user]);

  return shouldShow;
};

export default DisclosureBanner;