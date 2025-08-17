'use client'

import { useState } from 'react'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Heart, Shield, Mic, BookOpen, Users, Sparkles, Brain, Scale } from 'lucide-react'
import BackToHomeButton from '@/components/ui/BackToHomeButton'
import { BrandTitle } from '@/components/ui/BrandTitle'


export default function AboutPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <BackToHomeButton />
        
        <main className="p-6 space-y-8 max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About <BrandTitle variant="light" size="4xl" as="span" />
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your personal AI study companion, built with love for every Durham Law student. 
              From Foundation Year to Finals — we&apos;re here to support your academic journey and wellbeing.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
                <Heart className="w-7 h-7 text-red-500" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong>MyDurhamLaw</strong> exists to ensure no Durham law student faces their academic journey alone. 
                We believe that exceptional legal education requires both intellectual rigor and emotional support.
              </p>
              <p className="text-gray-600">
                This platform combines cutting-edge AI assistance with genuine care for student wellbeing, 
                creating a space where academic excellence and mental health go hand in hand.
              </p>
            </CardContent>
          </Card>

          {/* Meet Durmah Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800 flex items-center gap-3">
                <Mic className="w-7 h-7 text-blue-600" />
                Meet Durmah - Your AI Companion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-gray-700">
                <strong>Durmah</strong> is your personal voice companion, available 24/7 to help with studies, 
                provide emotional support, and offer guidance through the challenges of law school.
              </p>
              <div className="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800 italic">
                  <strong>Etymology:</strong> The name &quot;Durmah&quot; draws inspiration from the Sanskrit word &quot;Dharma&quot; — 
                  meaning law, truth, and righteous living. It embodies the principles of justice, balance, 
                  and ethical grounding that define the legal profession.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Academic Support</h4>
                    <p className="text-sm text-gray-600">Essay help, research guidance, and study planning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Wellbeing Companion</h4>
                    <p className="text-sm text-gray-600">Stress management, reflection, and emotional support</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Study Support</h3>
                <p className="text-sm text-gray-600">
                  AI-powered essay assistance, research tools, and assignment generators tailored for law students
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Mental Wellbeing</h3>
                <p className="text-sm text-gray-600">
                  Stress management tools, reflection journals, and emotional support through challenging times
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <Mic className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Voice Companion</h3>
                <p className="text-sm text-gray-600">
                  Natural voice conversations with Durmah for instant support and guidance
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-800 mb-2">Ethical AI</h3>
                <p className="text-sm text-gray-600">
                  Transparent, responsible AI that respects academic integrity and student privacy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Year-by-Year Support */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-emerald-800 flex items-center gap-3">
                <Users className="w-7 h-7 text-emerald-600" />
                Supporting Every Year of Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Foundation Year</h4>
                  <p className="text-sm text-gray-600">
                    Building strong foundations in legal thinking and academic skills
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">📚</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Year 1</h4>
                  <p className="text-sm text-gray-600">
                    Mastering core subjects like Constitutional and Contract Law
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">⚖️</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Year 2</h4>
                  <p className="text-sm text-gray-600">
                    Developing expertise in specialized areas of law
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">🎓</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Year 3</h4>
                  <p className="text-sm text-gray-600">
                    Final year excellence and career preparation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Durham Law */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-800 flex items-center gap-3">
                <Scale className="w-7 h-7 text-amber-600" />
                Built Specifically for Durham Law
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-gray-700">
                Durham Law School has a unique culture of academic excellence and collegiate support. 
                MyDurhamLaw reflects these values by combining rigorous academic assistance with genuine care for student wellbeing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Academic Excellence
                  </h4>
                  <p className="text-sm text-gray-600">
                    Tools designed around Durham&apos;s specific curriculum, assessment methods, and academic standards
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Collegiate Care
                  </h4>
                  <p className="text-sm text-gray-600">
                    Reflecting Durham&apos;s tradition of supporting the whole student, not just academic achievement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Origin Story */}
          <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-rose-800 flex items-center gap-3">
                <Heart className="w-7 h-7 text-rose-600" />
                A Gift That Became a Movement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-gray-700">
                MyDurhamLaw began as a parent&apos;s gift to their child — a personalized AI study companion to help navigate 
                the challenges of law school. What started as a private project has grown into something much larger.
              </p>
              <p className="text-gray-600">
                Recognizing that every Durham law student deserves this level of support, we&apos;ve opened MyDurhamLaw 
                to the entire student body. This is our contribution to the Durham Law community — built with love, 
                shared with purpose.
              </p>
              <div className="bg-rose-100 p-4 rounded-lg border-l-4 border-rose-500">
                <p className="text-sm text-rose-800 italic">
                  &quot;Every student deserves to feel supported, understood, and empowered to achieve their potential. 
                  MyDurhamLaw is our way of ensuring that no Durham law student has to struggle alone.&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ethical AI Commitment */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <Shield className="w-7 h-7 text-slate-600" />
                Our Commitment to Ethical AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Academic Integrity</h4>
                  <p className="text-sm text-gray-600">
                    Our AI helps you learn and understand, never replacing your own thinking and analysis
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Privacy First</h4>
                  <p className="text-sm text-gray-600">
                    Your conversations and data are protected with the highest security standards
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Transparent AI</h4>
                  <p className="text-sm text-gray-600">
                    We&apos;re open about how our AI works and committed to responsible development
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
              <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
                Whether you&apos;re just starting in Foundation Year or preparing for Finals, 
                MyDurhamLaw is here for you — one voice, one AI companion, one journey at a time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="text-lg font-semibold text-purple-200">
                  Start with your dashboard →
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Attribution */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600 mb-2">
              © {new Date().getFullYear()} MyDurhamLaw
            </p>
            <p className="text-sm text-gray-500">
              Built with ❤️ for the Durham Law community. Guided by justice, powered by care.
            </p>
          </div>
        </main>
        
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} };
}