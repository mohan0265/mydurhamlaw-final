// src/components/billing/PricingPlans.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Props = {
  onSelectPlan?: (planKey: 'monthly' | 'annual') => void;
  showAnnualPricing?: boolean;
};

export const PricingPlans: React.FC<Props> = ({ onSelectPlan, showAnnualPricing = false }) => {
  const [loading, setLoading] = useState<null | 'monthly' | 'annual'>(null);

  const startCheckout = async (plan: 'monthly' | 'annual') => {
    try {
      setLoading(plan);
      if (onSelectPlan) {
        // allow parent to override behavior
        await onSelectPlan(plan);
        setLoading(null);
        return;
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert('Could not start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Student Monthly</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Flexible</span>
        </div>
        <div className="mt-4 flex items-end gap-1">
          <span className="text-4xl font-bold">£7</span>
          <span className="text-gray-500 mb-1">/month</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>• YAAG + Planner + Notes</li>
          <li>• Assessments</li>
          <li>• Durmah voice</li>
          <li>• Loved ones (AWY)</li>
        </ul>
        <Button
          disabled={loading !== null}
          onClick={() => startCheckout('monthly')}
          className="mt-6 w-full"
        >
          {loading === 'monthly' ? 'Starting trial…' : 'Start free trial'}
        </Button>
      </Card>

      <Card className="p-6 ring-2 ring-indigo-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Student Annual</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Best value</span>
        </div>
        <div className="mt-4 flex items-end gap-1">
          <span className="text-4xl font-bold">£59</span>
          <span className="text-gray-500 mb-1">/year</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li>• Everything in Monthly</li>
          <li>• Priority features</li>
          <li>• Family dashboard (beta)</li>
        </ul>
        <Button
          disabled={loading !== null}
          onClick={() => startCheckout('annual')}
          className="mt-6 w-full"
        >
          {loading === 'annual' ? 'Starting trial…' : 'Start free trial'}
        </Button>
      </Card>
    </div>
  );
};
