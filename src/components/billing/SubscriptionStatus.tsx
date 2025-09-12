
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SubscriptionInfo } from '@/types/billing';

interface SubscriptionStatusProps {
  userId: string;
  onUpgrade?: () => void;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  userId, 
  onUpgrade 
}) => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, [userId]);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      const data = await response.json();
      
      if (data.subscription) {
        setSubscription(data.subscription);
        
        // Calculate trial days remaining
        if (data.subscription.status === 'trial' && data.subscription.trial_end_date) {
          const trialEnd = new Date(data.subscription.trial_end_date);
          const now = new Date();
          const diffTime = trialEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setTrialDaysRemaining(Math.max(0, diffDays));
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    const statusConfig = {
      trial: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Clock, 
        text: 'Free Trial' 
      },
      active: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        text: 'Active' 
      },
      cancelled: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertTriangle, 
        text: 'Cancelled' 
      },
      expired: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertTriangle, 
        text: 'Expired' 
      },
      past_due: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertTriangle, 
        text: 'Past Due' 
      }
    };

    const config = statusConfig[subscription.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (!subscription) return null;

    switch (subscription.status) {
      case 'trial':
        return (
          <div className="text-sm text-gray-600">
            {trialDaysRemaining > 0 ? (
              <>
                Your free trial expires in <strong>{trialDaysRemaining} days</strong>.
                Upgrade now to continue enjoying all features.
              </>
            ) : (
              <>
                Your free trial has expired. Upgrade to continue using MyDurhamLaw.
              </>
            )}
          </div>
        );
      case 'active':
        return (
          <div className="text-sm text-gray-600">
            Your subscription is active and will renew on{' '}
            <strong>
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </strong>.
          </div>
        );
      case 'cancelled':
        return (
          <div className="text-sm text-gray-600">
            Your subscription is cancelled and will end on{' '}
            <strong>
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </strong>.
          </div>
        );
      case 'expired':
        return (
          <div className="text-sm text-red-600">
            Your subscription has expired. Reactivate to continue using premium features.
          </div>
        );
      case 'past_due':
        return (
          <div className="text-sm text-red-600">
            Your payment is past due. Please update your payment method to continue.
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">
            Start your free trial to access all MyDurhamLaw features.
          </p>
          <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700">
            Start Free Trial
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">{subscription.plan_name}</h3>
            {getStatusBadge()}
          </div>
          {getStatusMessage()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div>
          <div className="text-sm text-gray-500">AWY Connections</div>
          <div className="font-semibold">
            {subscription.max_awy_connections === -1 
              ? 'Unlimited' 
              : subscription.max_awy_connections
            }
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">AI Chat</div>
          <div className="font-semibold">
            {subscription.ai_chat_limit === -1 
              ? 'Unlimited' 
              : `${subscription.ai_chat_limit} per month`
            }
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">Included Features:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {subscription.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {(subscription.status === 'trial' || subscription.status === 'expired') && (
        <div className="mt-4 pt-4 border-t">
          <Button 
            onClick={onUpgrade} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {subscription.status === 'trial' ? 'Upgrade Now' : 'Reactivate Subscription'}
          </Button>
        </div>
      )}
    </Card>
  );
};
