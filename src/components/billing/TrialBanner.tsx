
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TrialBannerProps {
  userId: string;
  onUpgrade: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ userId, onUpgrade }) => {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkTrialStatus();
  }, [userId]);

  const checkTrialStatus = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      const data = await response.json();
      
      if (data.subscription?.status === 'trial' && data.subscription.trial_end_date) {
        const trialEnd = new Date(data.subscription.trial_end_date);
        const now = new Date();
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(Math.max(0, diffDays));
        setIsVisible(diffDays <= 7); // Show banner when 7 days or less remaining
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  if (!isVisible || isDismissed || daysRemaining === null) {
    return null;
  }

  const getBannerStyle = () => {
    if (daysRemaining === 0) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (daysRemaining <= 3) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    } else {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getIcon = () => {
    if (daysRemaining === 0) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getMessage = () => {
    if (daysRemaining === 0) {
      return 'Your free trial has expired. Upgrade now to continue using MyDurhamLaw.';
    } else if (daysRemaining === 1) {
      return 'Your free trial expires tomorrow. Upgrade now to avoid interruption.';
    } else {
      return `Your free trial expires in ${daysRemaining} days. Upgrade now to continue enjoying all features.`;
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getBannerStyle()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="font-medium">{getMessage()}</p>
            <p className="text-sm mt-1 opacity-90">
              Don't lose access to your AI assistant, AWY connections, and premium features.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onUpgrade}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upgrade Now
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
