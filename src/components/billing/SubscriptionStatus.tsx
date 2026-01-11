// src/components/billing/SubscriptionStatus.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

type Props = {
  userId: string;
  onUpgrade?: () => void;
};

type SubInfo = {
  tier: string;
  inTrial: boolean;
  trialEndsAt: string | null;
  status: string; // active | past_due | canceled | inactive
};

function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getProgressColor(daysLeft: number): string {
  if (daysLeft > 7) return 'bg-green-500';
  if (daysLeft >= 3) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getStatusBadgeColor(daysLeft: number): string {
  if (daysLeft > 7) return 'bg-green-50 text-green-700 border-green-200';
  if (daysLeft >= 3) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export const SubscriptionStatus: React.FC<Props> = ({ onUpgrade }) => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SubInfo | null>(null);

  useEffect(() => {
    let done = false;
    const run = async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/billing/subscription');
        const j = await r.json();
        setInfo(j?.subscription ?? null);
      } catch {
        setInfo(null);
      } finally {
        if (!done) setLoading(false);
      }
    };
    run();
    return () => {
      done = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-gray-700">Couldn't load subscription details.</div>
      </div>
    );
  }

  // Edge case: If paid subscriber (status=active, tier not free), don't show trial
  const isPaidSubscriber = info.status === 'active' && info.tier && info.tier.toLowerCase() !== 'free';
  
  if (isPaidSubscriber) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Subscription</div>
            <div className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2">
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-sm">
                {info.tier} • Active
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trial or free user
  const daysLeft = getTrialDaysRemaining(info.trialEndsAt);
  const isInTrial = info.inTrial && daysLeft > 0;
  const totalTrialDays = 14; // Assuming 14-day trial
  const progressPercent = isInTrial ? ((totalTrialDays - daysLeft) / totalTrialDays) * 100 : 100;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">Subscription</div>
          
          {isInTrial ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-sm font-semibold border ${getStatusBadgeColor(daysLeft)}`}>
                  Free Trial
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock size={14} />
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getProgressColor(daysLeft)}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {info.status === 'inactive' ? 'Free (Limited)' : info.status}
            </div>
          )}
          
          {!isInTrial && info.trialEndsAt && (
            <div className="text-xs text-gray-500 mt-1">
              Trial expired
            </div>
          )}
        </div>
        
        {!isPaidSubscriber && (
          <button
            onClick={onUpgrade}
            className="ml-4 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};
