
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PricingPlans } from '@/components/billing/PricingPlans';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  CheckCircle, 
  ArrowRight, 
  Star, 
  Users, 
  MessageSquare,
  Brain,
  Shield,
  Zap
} from 'lucide-react';

export default function PricingPage() {
  const [showAnnualPricing, setShowAnnualPricing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    // Redirect to signup or billing page
    window.location.href = `/signup?plan=${planId}`;
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Study Assistant',
      description: 'Get personalized help with legal concepts, case analysis, and essay writing'
    },
    {
      icon: Users,
      title: 'Always With You (AWY)',
      description: 'Stay connected with family and friends through our unique presence system'
    },
    {
      icon: MessageSquare,
      title: 'Smart Chat Interface',
      description: 'Natural language conversations with context-aware responses'
    },
    {
      icon: Shield,
      title: 'Academic Integrity',
      description: 'Built-in safeguards to maintain academic honesty and transparency'
    },
    {
      icon: Zap,
      title: 'Real-time Collaboration',
      description: 'Work together with classmates and study groups seamlessly'
    },
    {
      icon: Star,
      title: 'Premium Support',
      description: 'Priority customer support and exclusive study resources'
    }
  ];

  const upcomingReviews = [
    {
      title: 'Early Feedback',
      icon: MessageSquare,
      text: '"This app looks like a very useful AI assisted tool, which we couldn\'t even imagine during undergraduate days. Students nowadays are so much more privileged with these kind of tools available."',
      author: 'Ex-UK Law Graduate',
      cta: 'Read More'
    },
    {
      title: 'Your Voice Matters',
      icon: Users,
      text: 'Have you tried MyDurhamLaw? We want to hear from you. Help us shape the future of legal education @ Durham.',
      cta: 'Submit Review'
    },
    {
      title: 'Integrity Promise',
      icon: Shield,
      text: 'We believe in authentic growth. We will never post fake reviews or paid testimonials. Your trust is our priority.',
      cta: 'Our Ethics'
    }
  ];

  return (
    <>
      <Head>
        <title>Pricing - MyDurhamLaw AI Study Assistant</title>
        <meta 
          name="description" 
          content="Choose the perfect plan for your law studies at Durham University. Start with a free trial and upgrade to unlock premium features." 
        />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Perfect Study Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Start with a free 14-day trial and discover how MyDurhamLaw can transform 
              your legal education experience at Durham University.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PricingPlans 
              onSelectPlan={handleSelectPlan}
              showAnnualPricing={showAnnualPricing}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                MyDurhamLaw combines cutting-edge AI technology with thoughtful design 
                to support every aspect of your legal education journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 text-center">
                    <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Reviews & Integrity */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Community & Trust
              </h2>
              <p className="text-xl text-gray-600">
                A platform built on honesty. No fake reviews, just real student experiences coming soon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingReviews.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="p-8 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 mx-auto text-blue-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-center mb-6 leading-relaxed text-sm">
                      {item.text}
                    </p>
                    <div className="text-center">
                      <span className="text-blue-600 font-semibold text-sm hover:underline cursor-pointer">
                        {item.cta} &rarr;
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Law Studies?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of Durham Law students who are already using MyDurhamLaw 
              to excel in their studies and stay connected with loved ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleSelectPlan('trial')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
                >
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="text-sm text-blue-100 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens after my free trial ends?
                </h3>
                <p className="text-gray-600">
                  After your 14-day free trial, you can choose to upgrade to a paid plan 
                  or continue with limited features. You'll never be charged without your 
                  explicit consent.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will 
                  be reflected in your next billing cycle.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-600">
                  Absolutely. We use enterprise-grade security measures to protect your 
                  data and comply with all relevant privacy regulations including GDPR.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What is the Always With You (AWY) feature?
                </h3>
                <p className="text-gray-600">
                  AWY is our unique presence system that lets you stay connected with 
                  family and friends. They can see when you're online and studying, 
                  and you can share quick updates about your day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
