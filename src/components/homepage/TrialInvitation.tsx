'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Gift, Clock, Eye, ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

export const TrialInvitation: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main trial offer */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Gift className="w-12 h-12 text-yellow-300 mr-4" />
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Explore Everything Free for 30 Days
            </h2>
          </div>
          <p className="text-xl text-pink-100 max-w-4xl mx-auto leading-relaxed mb-8">
            During your trial, preview ALL year dashboards and features. Perfect for parents to see 
            the full value and students to find their perfect fit.
          </p>
          
          {/* Trial benefits grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Clock className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Full 30 Days</h3>
              <p className="text-pink-100">Complete access to all features, no restrictions, no rush to decide</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Eye className="w-10 h-10 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Year Switcher</h3>
              <p className="text-pink-100">Preview Foundation, Year 1, 2, and 3 dashboards to see your academic journey</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Sparkles className="w-10 h-10 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">No Commitment</h3>
              <p className="text-pink-100">No credit card required, cancel anytime, keep what you&apos;ve learned</p>
            </div>
          </div>
        </div>

        {/* Year preview explanation */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-12">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-2xl font-bold text-white">How the Year-Switcher Preview Works</h3>
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-white" />
            ) : (
              <ChevronDown className="w-6 h-6 text-white" />
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-6 space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-400/30">
                  <h4 className="text-lg font-bold text-white mb-3">Foundation Year</h4>
                  <ul className="space-y-2 text-blue-100 text-sm">
                    <li>• Study skills development</li>
                    <li>• Basic legal concepts</li>
                    <li>• Transition support tools</li>
                    <li>• Academic writing basics</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
                  <h4 className="text-lg font-bold text-white mb-3">Year 1</h4>
                  <ul className="space-y-2 text-green-100 text-sm">
                    <li>• Core law modules</li>
                    <li>• Essay writing mastery</li>
                    <li>• Legal research methods</li>
                    <li>• Exam preparation</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-400/30">
                  <h4 className="text-lg font-bold text-white mb-3">Year 2</h4>
                  <ul className="space-y-2 text-orange-100 text-sm">
                    <li>• Advanced legal analysis</li>
                    <li>• Specialization guidance</li>
                    <li>• Career path planning</li>
                    <li>• Dissertation prep</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
                  <h4 className="text-lg font-bold text-white mb-3">Year 3</h4>
                  <ul className="space-y-2 text-purple-100 text-sm">
                    <li>• Dissertation support</li>
                    <li>• Career preparation</li>
                    <li>• Bar/Solicitor guidance</li>
                    <li>• Alumni networking</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <Gift className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-yellow-300 mb-2">Perfect for Parents</h5>
                    <p className="text-yellow-100 text-sm">
                      Parents can see exactly how MyDurhamLaw supports their child&apos;s entire legal education journey, 
                      from foundation concepts through to career preparation. The preview shows the long-term value 
                      and progression built into every subscription.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trial vs Paid comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Trial column */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-3xl p-8 border border-green-400/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">During Your 30-Day Trial</h3>
              <p className="text-green-200">Everything included, no limitations</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Access to ALL six core features</span>
              </li>
              <li className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Preview dashboards for all academic years</span>
              </li>
              <li className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Full AI conversation history</span>
              </li>
              <li className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Unlimited wellbeing coach sessions</span>
              </li>
              <li className="flex items-center space-x-3 text-green-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Complete ethics and integrity system</span>
              </li>
            </ul>
          </div>

          {/* After trial column */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">After Trial (If You Choose to Stay)</h3>
              <p className="text-blue-200">Locked to your primary year with full features</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Access to your specific year dashboard</span>
              </li>
              <li className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Year-specific module and career guidance</span>
              </li>
              <li className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Personalized study progression tracking</span>
              </li>
              <li className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Advanced academic calendar integration</span>
              </li>
              <li className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Just £39/month (cancel anytime)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/signup">
            <button className="group bg-white hover:bg-gray-100 text-purple-600 font-bold py-4 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-3 mx-auto">
              <span>Start Your Free 30-Day Trial</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>
          <p className="text-pink-100 mt-4 text-sm">
            No credit card required • Cancel anytime • Full access from day one
          </p>
        </div>
      </div>
    </section>
  )
}

export default TrialInvitation