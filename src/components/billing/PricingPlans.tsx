// src/components/billing/PricingPlans.tsx
'use client';

import React, { useMemo, useState } from 'react';

type PlanKey = 'monthly' | 'annual';

type Props = {
  /** optional: you can intercept plan clicks */
  onSelectPlan?: (plan: PlanKey) => void;
  /** optional: default which tab is selected */
  showAnnualPricing?: boolean;
};

const features = [
  'AI Study Assistant & chat',
  'Year-at-a-Glance planner',
  'Assignments & research helpers',
  'Durmah (wellbeing) voice buddy',
  'AWY presence for loved ones',
  'Secure notes & memory journal',
];

async function startCheckout(plan: PlanKey) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!res.ok || !data?.url) {
    throw new Error(data?.error || 'Unable to start checkout');
  }
  window.location.assign(data.url);
}

export const PricingPlans: React.FC<Props> = ({
  onSelectPlan,
  showAnnualPricing = false,
}) => {
  const [active, setActive] = useState<PlanKey>(showAnnualPricing ? 'annual' : 'monthly');
  const savePct = 15; // display only

  const price = useMemo(
    () =>
      active === 'annual'
        ? { label: '£/yr', main: '79', sub: 'per year' }
        : { label: '£/mo', main: '9', sub: 'per month' },
    [active]
  );

  const choose = async (plan: PlanKey) => {
    try {
      if (onSelectPlan) return onSelectPlan(plan);
      await startCheckout(plan);
    } catch (e: any) {
      alert(e?.message || 'Could not open checkout.');
    }
  };

  return (
    <div>
      {/* toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setActive('monthly')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            active === 'monthly'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setActive('annual')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            active === 'annual'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Annual <span className="ml-1 text-xs opacity-80">(save ~{savePct}%)</span>
        </button>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student plan */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="p-6 border-b">
            <div className="text-sm font-semibold text-indigo-700">Student</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-bold text-gray-900">{price.main}</div>
              <div className="text-gray-500">{price.label}</div>
            </div>
            <div className="text-sm text-gray-500">{price.sub} • 14-day free trial</div>
          </div>

          <ul className="p-6 space-y-2 text-sm text-gray-700">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-green-500" />
                {f}
              </li>
            ))}
          </ul>

          <div className="p-6 pt-0">
            <button
              onClick={() => choose(active)}
              className="w-full rounded-lg bg-indigo-600 text-white px-4 py-2.5 hover:bg-indigo-700"
            >
              Start free trial
            </button>
          </div>
        </div>

        {/* Free plan (teaser) */}
        <div className="rounded-2xl border shadow-sm bg-white">
          <div className="p-6 border-b">
            <div className="text-sm font-semibold text-gray-700">Free (limited)</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-bold text-gray-900">0</div>
              <div className="text-gray-500">£</div>
            </div>
            <div className="text-sm text-gray-500">Try essentials, upgrade anytime</div>
          </div>

          <ul className="p-6 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-400" />
              Limited AI chat & basic planning
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gray-400" />
              No voice buddy / reduced AWY
            </li>
          </ul>

          <div className="p-6 pt-0">
            <a
              href="/signup"
              className="block w-full text-center rounded-lg border px-4 py-2.5 hover:bg-gray-50"
            >
              Continue free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
