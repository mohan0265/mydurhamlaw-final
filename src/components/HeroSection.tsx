"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Heart,
  Brain,
  Shield,
  BookOpen,
  Clock,
} from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')",
      }}
    >
      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Hero content */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12"
        data-tour="landing-hero"
      >
        <div className="animate-fadeIn">
          {/* Main title */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Caseway
            </span>
          </h1>

          {/* Emotive tagline */}
          <div
            className="mb-4 sm:mb-6 animate-slideUp"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-lg sm:text-2xl lg:text-3xl font-medium text-pink-200 leading-relaxed">
              <Heart className="inline-block w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-pink-400 mr-2 mb-1" />
              Built with heart, exclusively for Durham University Law Foundation
              and Undergraduate Students.
            </p>
          </div>

          {/* Sub-title */}
          <div
            className="mb-6 sm:mb-8 animate-slideUp"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-200 leading-relaxed">
              Your 24/7 AI Study Partner, Voice Buddy & Legal Mentor at Durham
            </h2>
          </div>

          {/* Key benefits */}
          <div
            className="mb-8 sm:mb-10 animate-slideUp"
            style={{ animationDelay: "0.6s" }}
            data-tour="landing-features"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
              {/* AI Academic Support */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center">
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      AI-Powered Academic Support
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Tailored to your year with intelligent study guidance
                    </p>
                  </div>
                </div>
              </div>

              {/* Voice Mode */}
              <div
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center"
                data-tour="landing-durmah"
              >
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      Voice Mode with Memory
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Like a human study companion who remembers you
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Assignment Guidance */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center">
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      Legal Assignment Drafting
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Guidance with built-in ethics guardrails
                    </p>
                  </div>
                </div>
              </div>

              {/* Mental Wellness */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center">
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      Mental Wellness Support
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Journaling and reflection assistant
                    </p>
                  </div>
                </div>
              </div>

              {/* Case Law References */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center">
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      Case Law References
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Comprehensive legal research in one place
                    </p>
                  </div>
                </div>
              </div>

              {/* Timetables & Deadlines */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 min-h-[80px] flex items-center">
                <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mt-1 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">
                      Timetables & Deadlines
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      All your academic schedule in one place
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 animate-slideUp"
            style={{ animationDelay: "0.8s" }}
            data-tour="landing-cta"
          >
            {/* Primary CTA */}
            <Link href="/signup">
              <button className="group bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2 min-h-[48px] w-full sm:w-auto justify-center max-w-xs">
                <span>Start Exploring Now</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </Link>

            {/* Secondary CTA */}
            <Link href="/tour">
              <button className="group bg-white bg-opacity-10 backdrop-blur-sm border-2 border-white border-opacity-30 text-white font-semibold py-3 px-6 rounded-full text-base sm:text-lg hover:bg-opacity-20 transition-all duration-300 flex items-center space-x-2 min-h-[48px] w-full sm:w-auto justify-center max-w-xs">
                <Play className="w-4 h-4" />
                <span>See How It Works</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white border-opacity-50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white bg-opacity-50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
