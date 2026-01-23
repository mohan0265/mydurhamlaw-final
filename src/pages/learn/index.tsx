import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Shield, 
  Zap, 
  Star, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

const articles = [
  {
    icon: Brain,
    title: 'Durham Law AI Study Assistant: Complete Setup Guide',
    description: 'Master Durmah\'s features for ethical, effective legal study. Case research, IRAC issue spotting, and exam prep.',
    slug: 'durham-law-ai-study-assistant',
    category: 'Study Skills',
    readTime: '12 min read'
  },
  {
    icon: Shield,
    title: 'Durham Law Academic Integrity & AI Use',
    description: 'Understand Durham\'s AI policy. What\'s permitted, prohibited, and how to use AI ethically in legal education.',
    slug: 'durham-law-academic-integrity-ai',
    category: 'Ethics',
    readTime: '10 min read'
  },
  {
    icon: MessageSquare,
    title: 'How to Ask Better Legal Questions',
    description: 'Frame precise analytical questions for tutorials, Durmah, and research. The 4-layer questioning framework.',
    slug: 'how-to-ask-better-legal-questions',
    category: 'Workflow',
    readTime: '8 min read'
  },
  {
    icon: Users,
    title: 'Durham Law Study Groups: Collaboration Guide',
    description: 'Build effective, compliant study groups. Optimal size, meeting structure, and ethical AI use for collaborative learning.',
    slug: 'durham-law-study-groups',
    category: 'Community',
    readTime: '9 min read'
  },
  {
    icon: Star,
    title: 'Durham Law Wellbeing Routine',
    description: 'Balance intensive study with sustainable habits. Sleep, movement, nutrition, and connection strategies for law students.',
    slug: 'durham-law-wellbeing-routine',
    category: 'Wellbeing',
    readTime: '7 min read'
  },
  {
    icon: Zap,
    title: 'Durham Law Exam Technique: First-Class Strategy',
    description: 'Master problem questions with IRAC, structure essays, manage time, and use AI ethically for exam prep.',
    slug: 'durham-law-exam-technique',
    category: 'Performance',
    readTime: '11 min read'
  }
];

export default function LearnHub() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Head>
        <title>Learn Hub - Study & Progress Guides for Durham Law Students</title>
        <meta 
          name="description" 
          content="Explore comprehensive guides on AI-assisted legal study, academic integrity, and student wellbeing at MyDurhamLaw." 
        />
        <link rel="canonical" href="https://mydurhamlaw.com/learn" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Learn Hub - Study & Progress Guides for Durham Law Students" />
        <meta property="og:description" content="Explore comprehensive guides on AI-assisted legal study, academic integrity, and student wellbeing at MyDurhamLaw." />
        <meta property="og:url" content="https://mydurhamlaw.com/learn" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mydurhamlaw.com/og/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MyDurhamLaw" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn Hub - MyDurhamLaw" />
        <meta name="twitter:description" content="Explore comprehensive guides on AI-assisted legal study, academic integrity, and student wellbeing." />
        <meta name="twitter:image" content="https://mydurhamlaw.com/og/og-default.png" />
      </Head>

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gray-50 border-b border-gray-100 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
              <BookOpen className="w-3.5 h-3.5" />
              Educational Resources
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Learn: <span className="text-blue-600">UK Law Study Skills, Wellbeing, and Exam Strategy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Step-by-step guides helping you master legal study, maintain integrity, 
              and thrive throughout your degree.
            </p>
          </div>
        </div>

        {/* Article Grid */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => {
                const Icon = article.icon;
                return (
                  <Link key={article.slug} href={`/learn/${article.slug}`}>
                    <Card className="p-8 h-full hover:shadow-xl transition-all hover:border-blue-300 group cursor-pointer flex flex-col border border-gray-200">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-blue-600 text-xs font-bold uppercase mb-2">
                        {article.category}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 flex-1 text-sm leading-relaxed">
                        {article.description}
                      </p>
                      {article.readTime && (
                        <p className="text-gray-400 text-xs mb-3">{article.readTime}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                        Read Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Support Section */}
        <div className="bg-gray-50 py-16 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to apply these methods?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/eligibility?next=/signup&plan=free">
                <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/pricing">
                <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition">
                  View Plans & Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
