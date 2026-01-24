
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
import { useAuth } from '@/lib/supabase/AuthContext';

export default function PricingPage() {
  const { user, loading } = useAuth();
  const [showAnnualPricing, setShowAnnualPricing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      // Route visitors through eligibility gate
      window.location.href = `/eligibility?next=/signup&plan=${planId}`;
    } else {
      // Logic handled within PricingPlans for members
      // (Includes admin exception and Stripe checkout)
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Study Assistant',
      description: 'Get personalized help with legal concepts, case analysis, and essay writing',
      link: '/learn/ai-study-assistant'
    },
    {
      icon: Users,
      title: 'Always With You (AWY)',
      description: 'Stay connected with family and friends through our unique presence system',
      link: '/learn/always-with-you'
    },
    {
      icon: MessageSquare,
      title: 'Smart Chat Interface',
      description: 'Natural language conversations with context-aware responses',
      link: '/learn/smart-chat-interface'
    },
    {
      icon: Shield,
      title: 'Academic Integrity',
      description: 'Built-in safeguards to maintain academic honesty and transparency',
      link: '/learn/academic-integrity'
    },
    {
      icon: Zap,
      title: 'Real-time Collaboration',
      description: 'Work together with classmates and study groups seamlessly',
      link: '/learn/real-time-collaboration'
    },
    {
      icon: Star,
      title: 'Premium Support',
      description: 'Priority customer support and exclusive study resources',
      link: '/learn/premium-support'
    }
  ];

  const upcomingReviews = [
    {
      title: 'Early Feedback',
      icon: MessageSquare,
      text: '"This app looks like a very useful AI assisted tool, which we couldn\'t even imagine during undergraduate days. Students nowadays are so much more privileged with these kind of tools available."',
      author: 'Ex-UK Law Graduate',
      cta: 'Read More',
      link: '/learn'
    },
    {
      title: 'Your Voice Matters',
      icon: Users,
      text: 'Have you tried MyDurhamLaw? We want to hear from you. Help us shape the future of legal education @ Durham.',
      cta: 'Submit Review',
      link: '/community'
    },
    {
      title: 'Integrity Promise',
      icon: Shield,
      text: 'We believe in authentic growth. We will never post fake reviews or paid testimonials. Your trust is our priority.',
      cta: 'Our Ethics',
      link: '/learn/academic-integrity'
    }
  ];

  return (
    <>
      <Head>
        <title>Pricing & Plans | MyDurhamLaw AI Study Assistant</title>
        <meta 
          name="description" 
          content="Transform your legal education at Durham with ethical AI. 14-day free trial on all plans. Core and Pro options available for focused law students." 
        />
        <link rel="canonical" href="https://mydurhamlaw.com/pricing" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Pricing & Plans | MyDurhamLaw AI Study Assistant" />
        <meta property="og:description" content="Choose the perfect AI study plan. 14-day free trial. No credit card required." />
        <meta property="og:url" content="https://mydurhamlaw.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mydurhamlaw.com/og/og-pricing.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing Plans - MyDurhamLaw" />
        <meta name="twitter:description" content="Choose the perfect AI study plan for your law degree. 14-day free trial." />
        <meta name="twitter:image" content="https://mydurhamlaw.com/og/og-pricing.png" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-white pt-16 pb-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-8 shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
               Everything Included
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              One Plan. <span className="text-indigo-600">Full Access.</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your tutor-like Durham Law companion — on standby 24/7.
            </p>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
               Study smarter with voice + text support, year planning (YAAG), deadlines, assignments and exam practice — built for Durham Law students.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <button 
                 onClick={() => window.location.href='/signup'}
                 className="w-full sm:w-auto bg-gray-900 text-white font-black py-4 px-10 rounded-2xl text-lg hover:bg-black transition-all shadow-xl shadow-gray-200"
               >
                 Start Free Trial
               </button>
               <Link href="#fair-use" className="text-indigo-600 font-bold hover:underline">
                 See Fair-Use Promise
               </Link>
            </div>
            <p className="mt-6 text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              14 days full access. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PricingPlans 
              onSelectPlan={handleSelectPlan}
              showAnnualPricing={showAnnualPricing}
            />
          </div>
        </div>

        {/* Fair-Use & Trial Explanation */}
        <div id="fair-use" className="py-20 bg-gray-50 border-y border-gray-100">
           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {/* Fair Use Promise */}
                 <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                       <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Our Fair-Use Promise</h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Protecting Performance for Everyone</p>
                    <div className="space-y-4 text-gray-600 leading-relaxed text-sm flex-1">
                       <p>We treat all students equally — Full Access unlocks the same features for everyone.</p>
                       <p>To keep the service fast, stable, and affordable, we apply fair-use on high-cost resources like realtime voice. Normal study use is always fine.</p>
                       <p className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 font-medium italic">
                          If someone uses voice for hours every day (like a call-centre), we’ll gently prompt them to add Voice Boost so performance stays great for everyone.
                       </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100">
                       <Link href="/legal/voice-efficiency-tips" className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
                          See Voice Boost options & efficiency tips <ArrowRight className="w-4 h-4" />
                       </Link>
                    </div>
                 </div>

                 {/* Trial Explanation */}
                 <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                       <Star className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">What&apos;s included in the Free Trial?</h2>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Experience the Real Workflow</p>
                    <div className="space-y-4 text-gray-600 leading-relaxed text-sm flex-1">
                       <p>Your 14-day trial includes <strong>Full Access</strong> so you can experience the real Durham study workflow.</p>
                       <p>Voice and uploads are generous during trial, with fair-use protections to prevent abuse and keep the platform smooth for everyone.</p>
                       <ul className="space-y-2 pt-4">
                          {[
                             "Full Year-at-a-Glance access",
                             "Unlimited Text study chat",
                             "Voice coaching sessions",
                             "All lecture & assignment tools"
                          ].map(b => (
                             <li key={b} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="font-bold text-gray-700">{b}</span>
                             </li>
                          ))}
                       </ul>
                    </div>
                    <button 
                       onClick={() => window.location.href='/signup'}
                       className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all"
                    >
                       Start your 14-day trial
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Community & Trust (repositioned/updated) */}
        <div className="py-20">

        {/* Upcoming Reviews & Integrity */}
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Community & Trust
              </h2>
              <p className="text-lg text-gray-600">
                A platform built on honesty. No fake reviews, just real student experiences coming soon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingReviews.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={index} href={item.link}>
                    <Card className="p-8 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group h-full flex flex-col">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 mx-auto text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-center mb-6 leading-relaxed text-sm flex-1">
                        {item.text}
                      </p>
                      <div className="text-center mt-auto">
                        <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                          {item.cta} &rarr;
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-10 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to Transform Your Law Studies?
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Join hundreds of Durham Law students who are already using MyDurhamLaw 
              to excel in their studies and stay connected with loved ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg w-full sm:w-auto">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/eligibility?next=/signup&plan=free">
                    <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/learn">
                    <Button
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg w-full sm:w-auto"
                    >
                      Learn More
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-blue-100 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
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
