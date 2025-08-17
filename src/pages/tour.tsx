// /src/pages/tour.tsx

import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowRight, Play, Brain, Heart, Shield, BookOpen, Clock, MessageCircle } from 'lucide-react'

export default function TourPage() {
  return (
    <>
      <Head>
        <title>How It Works - MyDurhamLaw Tour</title>
        <meta name="description" content="Discover how MyDurhamLaw's AI-powered platform supports Durham University law students" />
      </Head>

      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fadeIn">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              See How <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">MyDurhamLaw</span> Works
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Discover how our AI-powered platform transforms the law school experience for Durham University students
            </p>
          </div>
        </div>
      </section>

      {/* Features Tour */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* AI Academic Support */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Brain className="w-8 h-8 text-purple-600 mr-3" />
                  <h2 className="text-3xl font-bold text-gray-900">AI-Powered Academic Support</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Get personalized help tailored to your specific year at Durham Law. From Foundation to Year 3, 
                  our AI understands your curriculum and provides relevant guidance.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Year-specific curriculum support (Foundation, Year 1-3)</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Instant answers to complex legal questions</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Study guidance based on Durham&apos;s teaching methods</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">🎓</div>
                <p className="text-gray-700 italic">&ldquo;Ask me about contract law formation principles...&rdquo;</p>
              </div>
            </div>
          </div>

          {/* Voice Mode */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">🎤</div>
                  <p className="text-gray-700 italic">&ldquo;Remember our conversation about negligence last week...&rdquo;</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center mb-4">
                  <Heart className="w-8 h-8 text-pink-600 mr-3" />
                  <h2 className="text-3xl font-bold text-gray-900">Voice Mode with Memory</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Experience conversations that feel natural and personal. Our AI remembers your learning style, 
                  preferences, and previous discussions to provide continuity in your studies.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Natural voice conversations about legal topics</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Remembers your learning progress and preferences</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Builds on previous conversations for deeper learning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legal Assignment Guidance */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-blue-600 mr-3" />
                  <h2 className="text-3xl font-bold text-gray-900">Ethical Assignment Guidance</h2>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  Get help with legal writing while maintaining academic integrity. Our built-in ethics guardrails 
                  ensure you learn proper legal reasoning without compromising your studies.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Structure and organize your legal arguments</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Research guidance and citation help</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Ethics guardrails to maintain academic integrity</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <p className="text-gray-700 italic">&ldquo;Help me structure my tort law essay while maintaining originality...&rdquo;</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need in One Place</h2>
            <p className="text-xl text-gray-600">Comprehensive support for your Durham Law journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Mental Wellness */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Mental Wellness</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Journaling and reflection tools to maintain balance during intense study periods.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Mood tracking and reflection</li>
                <li>• Stress management techniques</li>
                <li>• Study-life balance guidance</li>
              </ul>
            </div>

            {/* Case Law Research */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <BookOpen className="w-8 h-8 text-yellow-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Case Law Research</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Access comprehensive legal research tools and case law references in one place.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• UK case law database</li>
                <li>• Legal precedent analysis</li>
                <li>• Citation formatting help</li>
              </ul>
            </div>

            {/* Schedule Management */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Smart Scheduling</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your timetables, deadlines, and study sessions with intelligent planning.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Academic calendar integration</li>
                <li>• Deadline tracking</li>
                <li>• Study session planning</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Law Studies?</h2>
          <p className="text-xl text-pink-100 mb-8">
            Join fellow Durham Law students who are already using MyDurhamLaw to excel in their studies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/signup">
              <button className="group bg-white text-purple-600 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </Link>
            <Link href="/about">
              <button className="group bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-full text-lg hover:bg-white hover:text-purple-600 transition-all duration-300 flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Learn More</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}