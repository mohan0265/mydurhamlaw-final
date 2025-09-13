
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

  const testimonials = [
    {
      name: 'Sarah Johnson',
      year: 'Year 2 LLB',
      quote: 'MyDurhamLaw has transformed how I study. The AI assistant helps me understand complex legal concepts, and AWY keeps me connected with my family.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      year: 'Year 3 LLB',
      quote: 'The academic integrity features give me confidence that I\'m learning properly. It\'s like having a personal tutor available 24/7.',
      rating: 5
    },
    {
      name: 'Emma Williams',
      year: 'Year 1 LLB',
      quote: 'Starting law school was overwhelming, but MyDurhamLaw made the transition so much easier. The study planning features are incredible.',
      rating: 5
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

        {/* Testimonials */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Loved by Durham Law Students
              </h2>
              <p className="text-xl text-gray-600">
                See what your fellow students are saying about MyDurhamLaw
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.year}
                    </div>
                  </div>
                </Card>
              ))}
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
