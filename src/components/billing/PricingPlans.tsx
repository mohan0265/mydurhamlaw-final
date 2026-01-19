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
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 p-1 rounded-full flex gap-1 relative">
           <button
             onClick={() => setBilling('monthly')}
             className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
               billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Monthly
           </button>
           <button
             onClick={() => setBilling('annual')}
             className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
               billing === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Annual <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Save ~20%</span>
           </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FREE PLAN */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <p className="text-gray-500 text-sm h-10">Start with a 14-day full-access trial. After that, light daily limits apply.</p>
          </div>
          <div className="text-4xl font-extrabold text-gray-900 mb-6">£0</div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature included text="Durmah Voice: 120 mins/mo (fair use)" />
            <Feature included text="Durmah Text: 30 msgs/day" />
            <Feature included text="Lecture Tools: 4 Uploads/mo" />
            <Feature included text="Assignment Help: Starter mode" />
            <Feature included text="Exam Prep: Starter mode" />
            <Feature included text="YAAG (Full Access — Year/Month/Week)" />
            <Feature included text="Community & Wellbeing Access" />
          </ul>

          <button
            onClick={() => handleSelect('free')}
            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Start Free
          </button>
        </div>

        {/* CORE PLAN */}
        <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl scale-105 relative flex flex-col z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
            Most Popular
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-2">Core</h3>
            <p className="text-indigo-600/80 text-sm h-10">Full academic year planning and workflow support.</p>
          </div>
          <div className="flex items-baseline mb-6">
             <span className="text-4xl font-extrabold text-gray-900">
               {billing === 'monthly' ? '£13.99' : '£119'}
             </span>
             <span className="text-gray-500 ml-2 text-sm">
               /{billing === 'monthly' ? 'mo' : 'yr'}
             </span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature included text="Durmah Voice: 1,200 mins/mo (fair use)" />
            <Feature included text="Durmah Text: 2,000 msgs/mo" />
            <Feature included text="Lecture Tools: 24 Uploads/mo" />
            <Feature included text="Assignment Assist: 120 actions/mo" />
            <Feature included text="Exam Prep: 120 sets/mo" />
            <Feature included text="YAAG (Full Access — Year/Month/Week)" />
            <Feature included text="Community & Wellbeing Access" />
          </ul>

          <button
            onClick={() => handleSelect(billing === 'monthly' ? 'core_monthly' : 'core_annual')}
            className="w-full py-3 px-4 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-700 transition-colors shadow-md"
          >
            Choose Core
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-white flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-gray-400 text-sm h-10">For voice support, intensive prep, and lecture summaries.</p>
          </div>
          <div className="flex items-baseline mb-6">
             <span className="text-4xl font-extrabold text-white">
               {billing === 'monthly' ? '£24.99' : '£199'}
             </span>
             <span className="text-gray-400 ml-2 text-sm">
               /{billing === 'monthly' ? 'mo' : 'yr'}
             </span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature included text="Durmah Voice: 4,000 mins/mo (fair use)" />
            <Feature included text="Durmah Text: Unlimited" />
            <Feature included text="Lecture Tools: Unlimited" />
            <Feature included text="Assignment Assist: Unlimited" />
            <Feature included text="Exam Prep: Unlimited" />
            <Feature included text="YAAG (Full + Analytics)" />
            <Feature included text="Priority Study Sprint Mode" />
          </ul>

          <button
            onClick={() => handleSelect(billing === 'monthly' ? 'pro_monthly' : 'pro_annual')}
            className="w-full py-3 px-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            Go Pro
          </button>
        </div>
      </div>

      <div className="mt-8 mb-6 text-center text-sm text-gray-500 max-w-2xl mx-auto">
        Fair use applies to protect performance for everyone. Normal study use is always fine.
      </div>

      {/* PARENT ADD-ON */}
      <div className="mt-12 bg-pink-50 rounded-2xl p-6 md:p-8 border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
               <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Parent Peace-of-Mind Add-on</h3>
          </div>
          <p className="text-gray-600 text-sm md:text-base mb-4">
             Add optional AWY parent presence and weekly wellbeing digests. Non-invasive, student-controlled.
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
               <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${parentAddOn ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-gray-300'}`}>
                  {parentAddOn && <Check className="w-4 h-4" />}
               </div>
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={parentAddOn} 
                 onChange={(e) => setParentAddOn(e.target.checked)} 
              />
               <span className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">Include Parent Add-on</span>
            </label>
            <span className="text-pink-600 font-bold bg-pink-100 px-3 py-1 rounded-full text-sm">
               {billing === 'monthly' ? '+£4.99/mo' : '+£39/yr'} 
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
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
