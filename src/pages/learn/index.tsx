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
    title: 'AI Study Assistant: Mastering Law with AI',
    description: 'Learn how to use AI for case analysis, IRAC issue spotting, and legal essay planning ethically.',
    slug: 'ai-study-assistant',
    category: 'Study Skills'
  },
  {
    icon: Shield,
    title: 'Academic Integrity & Ethical AI Use',
    description: 'A guide for Durham Law students on using AI as a tutor, not a ghostwriter, to stay compliant.',
    slug: 'academic-integrity',
    category: 'Ethics'
  },
  {
    icon: MessageSquare,
    title: 'Smart Chat: Effective Legal Prompting',
    description: 'How to communicate effectively with legal AI to get better insights from your lectures.',
    slug: 'smart-chat-interface',
    category: 'Workflow'
  },
  {
    icon: Users,
    title: 'Always With You: Student Wellbeing',
    description: 'Managing loneliness and staying connected with family during high-pressure exam seasons.',
    slug: 'always-with-you',
    category: 'Wellbeing'
  },
  {
    icon: Zap,
    title: 'Real-time Collaboration & Accountability',
    description: 'Setting up study groups and using MyDurhamLaw to stay accountable with your peers.',
    slug: 'real-time-collaboration',
    category: 'Community'
  },
  {
    icon: Star,
    title: 'Premium Support & Exam Excellence',
    description: 'Strategies for high-performers to manage burnout and structure revision during final terms.',
    slug: 'premium-support',
    category: 'Performance'
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
              Study & Progress <span className="text-blue-600">Guides</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about using AI ethically, mastering legal research, 
              and maintaining wellbeing throughout your degree.
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
                      <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed">
                        {article.description}
                      </p>
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
        <div className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can't find what you're looking for?</h2>
            <p className="text-gray-600 mb-8">
              We're constantly adding new resources. If you have a specific topic you'd like us to cover, 
              please let us know.
            </p>
            <Link href="/community">
              <span className="text-blue-600 font-bold hover:underline cursor-pointer">
                Visit the Community Hub &rarr;
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
