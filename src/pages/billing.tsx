// src/pages/billing.tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';
import { PricingPlans } from '@/components/billing/PricingPlans';
import { TrialBanner } from '@/components/billing/TrialBanner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  Download, 
  FileText, 
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';

interface BillingPageProps {
  user: {
    id: string;
    email: string;
    display_name?: string;
    stripe_customer_id?: string | null;
  };
}

export default function BillingPage({ user }: BillingPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'usage' | 'billing'>('overview');

  const startCheckout = async (plan: 'monthly' | 'annual') => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      alert('Could not start checkout. Please try again.');
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  };

  const openPortal = async () => {
    if (!user?.stripe_customer_id) {
      alert('No Stripe customer found on your account yet.');
      return;
    }
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: user.stripe_customer_id }),
    });
    if (!res.ok) {
      alert('Could not open billing portal.');
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <>
      <Head>
        <title>Billing & Subscription - MyDurhamLaw</title>
        <meta name="description" content="Manage your MyDurhamLaw subscription and billing" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your subscription, view usage, and update billing information</p>
          </div>

          {/* Trial Banner */}
          <TrialBanner userId={user.id} onUpgrade={() => setActiveTab('plans')} />

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'plans', label: 'Plans & Pricing', icon: CreditCard },
                { id: 'usage', label: 'Usage', icon: Clock },
                { id: 'billing', label: 'Billing History', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <SubscriptionStatus userId={user.id} onUpgrade={() => setActiveTab('plans')} />
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button onClick={() => setActiveTab('plans')} className="w-full justify-start" variant="outline">
                        <CreditCard className="w-4 h-4 mr-2" />
                        View Plans & Pricing
                      </Button>
                      <Button onClick={() => setActiveTab('usage')} className="w-full justify-start" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Check Usage
                      </Button>
                      <Button onClick={openPortal} className="w-full justify-start" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Manage Billing (Stripe)
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
                  <p className="text-gray-600">Select the perfect plan for your studies</p>
                </div>
                <PricingPlans
                  onSelectPlan={startCheckout}
                  showAnnualPricing={false}
                />
              </div>
            )}

            {activeTab === 'usage' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Overview</h2>
                <UsageOverview userId={user.id} />
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing History</h2>
                <BillingHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Usage Overview Component (unchanged from your version)
const UsageOverview: React.FC<{ userId: string }> = ({ userId }) => {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [userId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/billing/usage');
      const data = await response.json();
      setUsage(data.usage || []);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const usageByType = usage.reduce((acc, item) => {
    acc[item.feature_type] = (acc[item.feature_type] || 0) + item.usage_count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">AI Chat Messages</h3>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{usageByType.ai_chat || 0}</div>
        <p className="text-sm text-gray-500 mt-1">This month</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">AWY Connections</h3>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{usageByType.awy_connection || 0}</div>
        <p className="text-sm text-gray-500 mt-1">Active connections</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Voice Minutes</h3>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{usageByType.voice_minutes || 0}</div>
        <p className="text-sm text-gray-500 mt-1">This month</p>
      </Card>
    </div>
  );
};

// Billing History placeholder (unchanged)
const BillingHistory: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Billing History Yet</h3>
        <p className="text-gray-600 mb-4">
          Your billing history will appear here once you have an active subscription.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </Card>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: { destination: '/login?redirect=/billing', permanent: false },
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, stripe_customer_id')
    .eq('id', user.id)
    .single();

  return {
    props: {
      user: {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name || null,
        stripe_customer_id: profile?.stripe_customer_id || null,
      },
    },
  };
};
