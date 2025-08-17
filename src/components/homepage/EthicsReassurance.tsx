'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Eye, BookOpen, Users, CheckCircle, Award, AlertTriangle } from 'lucide-react'

export const EthicsReassurance: React.FC = () => {
  return (
    <section id="parent-peace-of-mind" className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-green-400 mr-4" />
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Academic Integrity First
            </h2>
          </div>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Built from day one with ethical AI principles. We don&apos;t just prevent plagiarism – 
            we actively teach responsible AI use and transparent academic practices.
          </p>
        </div>

        {/* Main ethics pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Transparency */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Complete Transparency</h3>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Every AI interaction is logged and auditable</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Optional disclosure banners for assignments</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Clear usage reports for parents and students</span>
              </li>
            </ul>
          </div>

          {/* Skill Building */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Skill Development Focus</h3>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Three assistance levels: Hints, Outlines, Examples</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Requires paraphrasing and original thinking</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>OSCOLA citation training and assistance</span>
              </li>
            </ul>
          </div>

          {/* Prevention */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Plagiarism Prevention</h3>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Built-in integrity pledge before tool access</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Pre-submission improvement suggestions</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Active coaching on responsible AI use</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Parent testimonial section */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-3xl p-8 border border-green-400/30 mb-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-green-400 mr-3" />
              <h3 className="text-2xl font-bold text-white">Parents&apos; Peace of Mind</h3>
            </div>
            <blockquote className="text-xl text-green-100 italic mb-6 max-w-4xl mx-auto">
              &quot;I saw the preview of the App and it looks impressive. I am waiting for it to launch officially soon. 
              I think it will help my daughter who is going to start her Foundation Year at Durham. The ethics 
              guardrails give me confidence that she&apos;ll use AI responsibly.&quot;
            </blockquote>
            <cite className="text-green-300 font-semibold">- Mark D., Parent of 2025 Foundation Student</cite>
          </div>
        </div>

        {/* How it works process */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-white text-center mb-12">How Our Ethics System Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">1</div>
              <h4 className="text-lg font-semibold text-white mb-2">Integrity Pledge</h4>
              <p className="text-blue-100 text-sm">Students must acknowledge academic honesty before accessing tools</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">2</div>
              <h4 className="text-lg font-semibold text-white mb-2">Guided Assistance</h4>
              <p className="text-blue-100 text-sm">AI provides structured help that requires student thinking and input</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">3</div>
              <h4 className="text-lg font-semibold text-white mb-2">Transparent Logging</h4>
              <p className="text-blue-100 text-sm">All interactions recorded with optional disclosure for assignments</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">4</div>
              <h4 className="text-lg font-semibold text-white mb-2">Skill Development</h4>
              <p className="text-blue-100 text-sm">Focus remains on building genuine legal knowledge and writing skills</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/legal/ethics">
            <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl mr-4">
              Read Our Ethics Policy
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-300">
              Start Your Ethical AI Journey
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default EthicsReassurance