'use client';

import React, { useState } from 'react';
import { Check, X, Shield } from 'lucide-react';

type BillingPeriod = 'monthly' | 'annual';
type PlanId = 'free' | 'core_monthly' | 'core_annual' | 'pro_monthly' | 'pro_annual';

interface PricingPlansProps {
  onSelectPlan?: (planId: PlanId) => void;
  showAnnualPricing?: boolean;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  onSelectPlan,
  showAnnualPricing = false,
}) => {
  const [billing, setBilling] = useState<BillingPeriod>(showAnnualPricing ? 'annual' : 'monthly');
  const [parentAddOn, setParentAddOn] = useState(false);

  const handleSelect = (plan: PlanId) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      window.location.href = `/signup?plan=${plan}&parent=${parentAddOn}`;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-full flex gap-1 relative">
           <button
             onClick={() => setBilling('monthly')}
             className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
               billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Monthly
           </button>
           <button
             onClick={() => setBilling('annual')}
             className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
               billing === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Annual <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Save up to 33%</span>
           </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FREE PLAN */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
            <p className="text-gray-500 text-xs leading-relaxed">14-day full-access trial. Light daily limits apply after.</p>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-4">£0</div>
          
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature included text="Durmah Voice: 120 mins/mo" />
            <Feature included text="Durmah Text: 30 msgs/day" />
            <Feature included text="Lecture Tools: 4 Uploads/mo" />
            <Feature included text="Assignment Help: Starter" />
            <Feature included text="Exam Prep: Starter mode" />
            <Feature included text="YAAG (Full Access)" />
          </ul>

          <button
            onClick={() => handleSelect('free')}
            className="w-full py-2.5 px-4 border border-gray-300 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Start Free
          </button>
        </div>

        {/* CORE PLAN */}
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-600 shadow-xl scale-105 relative flex flex-col z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
            Most Popular
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-indigo-900 mb-1">Core</h3>
            <p className="text-indigo-600/80 text-xs leading-relaxed">Full academic year planning & workflow.</p>
          </div>
          <div className="flex items-baseline mb-4">
             <span className="text-3xl font-extrabold text-gray-900">
               {billing === 'monthly' ? '£13.99' : '£119'}
             </span>
             <span className="text-gray-500 ml-1.5 text-xs">
               /{billing === 'monthly' ? 'mo' : 'yr'}
             </span>
          </div>
          
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature included text="Durmah Voice: 1,000 mins/mo" />
            <Feature included text="Durmah Text: Unlimited" />
            <Feature included text="Lecture Tools: 20 Uploads/mo" />
            <Feature included text="Assignment Assist: Standard" />
            <Feature included text="YAAG (Full + Deadlines)" />
          </ul>

          <button
            onClick={() => handleSelect(billing === 'monthly' ? 'core_monthly' : 'core_annual')}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Get Core
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
            BEST VALUE
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Pro</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Maximum power for high-achievers.</p>
          </div>
          
          <div className="flex items-baseline mb-4">
             <span className="text-3xl font-extrabold text-gray-900">
               {billing === 'monthly' ? '£24.99' : '£199'}
             </span>
             <span className="text-gray-500 ml-1.5 text-xs">
               /{billing === 'monthly' ? 'mo' : 'yr'}
             </span>
          </div>
          
          <ul className="space-y-2.5 mb-6 flex-1">
            <Feature included text="Durmah Voice: 4,000 mins/mo" />
            <Feature included text="Durmah Text: Unlimited" />
            <Feature included text="Lecture Tools: Unlimited" />
            <Feature included text="Assignment Assist: Advanced" />
            <Feature included text="Study Sprint Mode: Priority" />
            <Feature included text="YAAG (Full + Analytics)" />
          </ul>

          <button
            onClick={() => handleSelect(billing === 'monthly' ? 'pro_monthly' : 'pro_annual')}
            className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Go Pro
          </button>
        </div>
      </div>

      <div className="mt-6 mb-4 text-center text-[11px] text-gray-400 max-w-xl mx-auto">
        Fair use applies to protect performance for everyone. Normal study use is always fine.
      </div>

      {/* PARENT ADD-ON */}
      <div className="mt-6 bg-pink-50 rounded-2xl p-5 md:p-6 border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-pink-100 rounded-lg text-pink-600">
               <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Parent Peace-of-Mind Add-on</h3>
          </div>
          <p className="text-gray-600 text-xs md:text-sm mb-3">
             Add optional AWY parent presence and weekly wellbeing digests. Student-controlled.
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${parentAddOn ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-gray-300'}`}>
                  {parentAddOn && <Check className="w-3.5 h-3.5" />}
               </div>
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={parentAddOn} 
                 onChange={(e) => setParentAddOn(e.target.checked)} 
              />
               <span className="font-semibold text-sm text-gray-900 group-hover:text-pink-600 transition-colors">Include Parent Add-on</span>
            </label>
            <span className="text-pink-600 font-bold bg-pink-100 px-2.5 py-0.5 rounded-full text-xs">
               {billing === 'monthly' ? '+£4.99/mo' : '+£39/yr'} 
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[10px] text-gray-400">
        Prices include VAT where applicable. You can cancel at any time.
      </div>
    </div>
  );
};

function Feature({ included, text }: { included: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-3 ${included ? '' : 'text-gray-400'}`}>
      {included ? (
        <Check className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <X className="w-5 h-5 text-gray-300 shrink-0" />
      )}
      <span className="text-sm font-medium">{text}</span>
    </li>
  );
}
