// src/components/billing/SubscriptionStatus.tsx
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
  status: string; // active | past_due | canceled | inactive
};

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
        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-gray-700">Couldn’t load subscription details.</div>
      </div>
    );
  }

  const trialLabel =
    info.inTrial && info.trialEndsAt
      ? `Trial ends ${new Date(info.trialEndsAt).toLocaleDateString()}`
      : info.inTrial
      ? 'Trial active'
      : null;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Subscription</div>
          <div className="text-lg font-semibold text-gray-900 capitalize">
            {info.tier || 'free'} • {info.status}
          </div>
          {trialLabel && <div className="text-sm text-indigo-700">{trialLabel}</div>}
        </div>
        {info.status !== 'active' && (
          <button
            onClick={onUpgrade}
            className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};
