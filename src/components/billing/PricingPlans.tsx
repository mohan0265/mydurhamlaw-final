
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Crown, Zap, Star } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/billing';

interface PricingPlansProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
  showAnnualPricing?: boolean;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlanId,
  onSelectPlan,
  showAnnualPricing = false
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Trial')) return Crown;
    if (planName.includes('Basic')) return CheckCircle;
    if (planName.includes('Premium')) return Zap;
    if (planName.includes('Pro')) return Star;
    return CheckCircle;
  };

  const getPlanColor = (planName: string) => {
    if (planName.includes('Trial')) return 'border-blue-200 bg-blue-50';
    if (planName.includes('Basic')) return 'border-gray-200 bg-white';
    if (planName.includes('Premium')) return 'border-purple-200 bg-purple-50';
    if (planName.includes('Pro')) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0) return 'Free';
    
    const price = showAnnualPricing && plan.price_yearly 
      ? plan.price_yearly 
      : plan.price_monthly;
    
    const period = showAnnualPricing && plan.price_yearly ? 'year' : 'month';
    
    return `£${price.toFixed(2)}/${period}`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (!plan.price_yearly || plan.price_monthly === 0) return null;
    
    const monthlyTotal = plan.price_monthly * 12;
    const savings = monthlyTotal - plan.price_yearly;
    const savingsPercent = Math.round((savings / monthlyTotal) * 100);
    
    return savingsPercent > 0 ? `Save ${savingsPercent}%` : null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Annual/Monthly Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {/* Toggle monthly */}}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showAnnualPricing 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => {/* Toggle annual */}}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showAnnualPricing 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
              Save up to 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isCurrentPlan = currentPlanId === plan.id;
          const savings = getSavings(plan);
          
          return (
            <Card 
              key={plan.id} 
              className={`p-6 relative ${getPlanColor(plan.name)} ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.name.includes('Premium') && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                  Most Popular
                </Badge>
              )}
              
              {isCurrentPlan && (
                <Badge className="absolute -top-2 right-4 bg-blue-600 text-white">
                  Current Plan
                </Badge>
              )}

              <div className="text-center mb-6">
                <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-1">
                  {getPrice(plan)}
                </div>
                {savings && showAnnualPricing && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {savings}
                  </Badge>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 text-xs text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>AWY Connections:</span>
                  <span className="font-medium">
                    {plan.max_awy_connections === -1 ? 'Unlimited' : plan.max_awy_connections}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>AI Chat:</span>
                  <span className="font-medium">
                    {plan.ai_chat_limit === -1 ? 'Unlimited' : `${plan.ai_chat_limit}/month`}
                  </span>
                </div>
                {plan.priority_support && (
                  <div className="flex justify-between">
                    <span>Priority Support:</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>

              <Button
                onClick={() => onSelectPlan(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full ${
                  plan.name.includes('Premium')
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : plan.name.includes('Pro')
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${isCurrentPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCurrentPlan 
                  ? 'Current Plan' 
                  : plan.price_monthly === 0 
                  ? 'Start Free Trial' 
                  : 'Choose Plan'
                }
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
