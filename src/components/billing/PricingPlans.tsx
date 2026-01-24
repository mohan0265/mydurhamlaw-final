'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Check, X, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';

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
  const { user } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingPeriod>(showAnnualPricing ? 'annual' : 'monthly');
  const [parentAddOn, setParentAddOn] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSelect = async (plan: PlanId) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
      return;
    }

    // For non-authenticated users, route through eligibility gate
    if (!user) {
      const planParam = parentAddOn ? `${plan}&parent=true` : plan;
      router.push(`/eligibility?next=/signup&plan=${planParam}`);
      return;
    }

    // For authenticated users, handle free vs paid plans
    if (plan === 'free') {
      // Already logged in with free plan - redirect to dashboard
      router.push('/dashboard');
      return;
    }

    // Logged-in user selecting paid plan - trigger Stripe checkout
    try {
      setLoadingPlan(plan);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, parentAddOn }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned', data);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSelectPlan = (isAnnual: boolean) => {
    const plan = isAnnual ? 'full_access_annual' : 'full_access_monthly';
    handleSelect(plan as any);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 p-1.5 rounded-full flex gap-1 relative shadow-inner">
           <button
             onClick={() => setBilling('monthly')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
               billing === 'monthly' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Monthly
           </button>
           <button
             onClick={() => setBilling('annual')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
               billing === 'annual' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'
             }`}
           >
             Annual <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight">Save ~33%</span>
           </button>
        </div>
      </div>

      {/* SINGLE PLAN CARD */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border-2 border-indigo-600 shadow-2xl relative flex flex-col md:flex-row gap-8 items-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          <div className="absolute top-6 right-8 bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.1em]">
            One Plan. Full Access.
          </div>
          
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-3xl font-black text-gray-900 mb-2">Full Access</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Everything included. Same support for every student.</p>
            </div>

            <div className="flex items-baseline">
               <span className="text-5xl font-black text-gray-900">
                 {billing === 'monthly' ? '£24.99' : '£199'}
               </span>
               <span className="text-gray-400 ml-2 font-bold uppercase tracking-widest text-xs">
                 /{billing === 'monthly' ? 'mo' : 'yr'}
               </span>
            </div>

            <button
              onClick={() => handleSelectPlan(billing === 'annual')}
              disabled={loadingPlan !== null}
              className="w-full py-4 px-8 bg-indigo-600 text-white rounded-2xl text-lg font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group"
            >
              {loadingPlan ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start Free Trial'}
              <Shield className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              No commitment. Continue after trial for £24.99/mo, or save with annual.
            </p>
          </div>

          <div className="w-full md:w-[320px] bg-gray-50 rounded-3xl p-6 border border-gray-100">
             <ul className="space-y-4">
                <Feature included text="Durmah Voice (Tutor-style coaching)" />
                <Feature included text="Durmah Text (Unlimited study chat)" />
                <Feature included text="Quiz Me (Speak Law practice)" />
                <Feature included text="Year-At-A-Glance (YAAG): Full + Deadlines" />
                <Feature included text="Assignment Assistant (Ethical guidance + structure)" />
                <Feature included text="Lecture Tools (Uploads + flash prompts)" />
                <Feature included text="Exam Prep Mode (Practice questions)" />
                <Feature included text="Updates included (New features)" />
             </ul>
          </div>
        </div>
      </div>

      {/* VOICE BOOST ADD-ON */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1 mb-6">
                 <Loader2 className="w-3 h-3 text-indigo-300" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Optional Add-On</span>
              </div>
              <h2 className="text-3xl font-black mb-3">Voice Boost</h2>
              <p className="text-indigo-200 font-bold mb-6 italic">Extra voice capacity for revision season & heavy practice.</p>
              <p className="text-gray-300 leading-relaxed font-light">
                 Most students never need Boost. If you love practising out loud for long sessions — especially near exams — Boost gives you extra voice headroom while keeping the base plan affordable for everyone.
              </p>
              
              <div className="mt-8 space-y-3">
                 <div className="flex items-center gap-3 text-sm text-gray-200">
                    <Check className="w-5 h-5 text-indigo-400" />
                    <span>More voice capacity during peak study weeks</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-gray-200">
                    <Check className="w-5 h-5 text-indigo-400" />
                    <span>Priority performance during high traffic times</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-gray-200">
                    <Check className="w-5 h-5 text-indigo-400" />
                    <span>Ideal for exam drills & long oral rehearsals</span>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 text-center">
              <p className="text-sm text-gray-400 mb-6 font-medium">
                 Boost does not change tutor quality. It simply adds capacity so heavy usage stays sustainable.
              </p>
              <button 
                 onClick={() => alert("Voice Boost will be available shortly. For early access, please contact support.")}
                 className="w-full py-4 px-6 bg-white text-indigo-900 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl shadow-black/20"
              >
                 Add Voice Boost
              </button>
              <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-indigo-400">Available from £9.99 / season</p>
           </div>
        </div>
      </div>

      <div className="mt-6 mb-12 text-center text-[12px] font-medium text-gray-400 max-w-xl mx-auto bg-gray-50 py-3 rounded-full border border-gray-100">
        Fair-use is designed to protect performance — not to restrict learning.
      </div>
    </div>
  );
};

function Feature({ included, text }: { included: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-4 ${included ? '' : 'text-gray-400'}`}>
      <div className="mt-0.5 shrink-0">
        <Check className="w-5 h-5 text-green-500" />
      </div>
      <span className="text-sm font-bold text-gray-700 leading-tight">{text}</span>
    </li>
  );
}
