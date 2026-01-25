// src/components/billing/TrialBanner.tsx
'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  userId: string;
  onUpgrade?: () => void;
};

type SubInfo = {
  tier: string;
  inTrial: boolean;
  trialEndsAt: string | null;
  status: string;
};

export const TrialBanner: React.FC<Props> = ({ onUpgrade }) => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SubInfo | null>(null);
  const [starting, setStarting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/billing/subscription');
      const j = await r.json();
      setInfo(j?.subscription ?? null);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startTrial = async () => {
    try {
      setStarting(true);
      const r = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_trial' }),
      });
      const j = await r.json();
      if (!r.ok || !j?.success) {
        throw new Error(j?.error || 'Could not start trial');
      }
      await load();
    } catch (e: any) {
      alert(e?.message || 'Could not start trial.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return null;

  // If user already has any profile/subscription data at all, hide banner
  // (This means they've already signed up - banner only for completely new visitors)
  if (info) {
    // If already active paid subscription, no banner
    if (info.status === 'active' && (info.tier || '').toLowerCase() !== 'free') return null;
    
    // If in trial, show remaining
    if (info.inTrial) {
    return (
      <div className="rounded-xl border bg-blue-50 p-4 text-blue-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Your free trial is active</div>
            {info.trialEndsAt && (
              <div className="text-sm">
                Ends on <strong>{new Date(info.trialEndsAt).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}</strong>
              </div>
            )}
          </div>
          <button
            onClick={onUpgrade}
            className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
          >
            Upgrade now
          </button>
        </div>
      </div>
    );
  }

    // If logged in but not in trial and not paid, hide banner
    // (They already have an account, shouldn't see "start trial")
    return null;
  }

  // Not in trial: offer to start one (only for visitors without any info)
  return (
    <div className="rounded-xl border bg-indigo-50 p-4 text-indigo-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Start your 14-day free trial</div>
          <div className="text-sm">No card needed • Cancel anytime</div>
        </div>
        <button
          onClick={startTrial}
          disabled={starting}
          className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {starting ? 'Starting…' : 'Start free trial'}
        </button>
      </div>
    </div>
  );
};
