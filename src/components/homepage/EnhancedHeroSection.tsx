"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Heart,
  Users,
  Award,
  CheckCircle,
} from "lucide-react";

export const EnhancedHeroSection: React.FC = () => {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{
        backgroundImage: "url('/assets/images/hero-supreme-court-uk.webp')",
      }}
    >
      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-purple-900/75 to-blue-900/80"></div>

      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12">
        <div className="animate-fadeIn">
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-6 sm:mb-8 animate-slideUp">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Shield className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-sm text-white font-medium">
                Academic Integrity First
              </span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Users className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm text-white font-medium">
                500+ Durham Students
              </span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Award className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm text-white font-medium">
                Ethical AI Certified
              </span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Durham Law Journey
            </span>
          </h1>

          {/* Emotional subheading */}
          <div
            className="mb-8 animate-slideUp"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-xl sm:text-2xl lg:text-3xl text-blue-100 leading-relaxed max-w-4xl mx-auto">
              The world&apos;s first AI study companion built exclusively for
              Durham University Law students.
              <br className="hidden sm:block" />
              <span className="text-pink-300 font-medium">
                Ethical, intelligent, and designed to make your parents proud.
              </span>
            </p>
          </div>

          {/* Value propositions */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10 animate-slideUp"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">
                Never Risk Your Integrity
              </h3>
              <p className="text-sm text-blue-100">
                Built-in ethics guardrails prevent plagiarism and ensure
                transparent AI use
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Heart className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">
                Your Mental Wellbeing Matters
              </h3>
              <p className="text-sm text-blue-100">
                24/7 AI companion that understands law student stress and
                provides support
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-bold text-white mb-2">Tailored Excellence</h3>
              <p className="text-sm text-blue-100">
                Tailored to Durham Law curriculum, assignments, and academic
                calendar
              </p>
            </div>
          </div>

          {/* 30-day trial highlight */}
          <div
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 mb-8 max-w-3xl mx-auto animate-slideUp"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">
                Free 30-Day Trial
              </h2>
            </div>
            <p className="text-green-100 text-lg mb-4">
              Explore ALL year dashboards during your trial. Perfect for parents
              and students to see the full value.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                ✓ Foundation Year Preview
              </span>
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                ✓ Year 1-3 Features
              </span>
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                ✓ No Credit Card Required
              </span>
            </div>
          </div>

          {/* Call to Action */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slideUp"
            style={{ animationDelay: "0.8s" }}
          >
            {/* Primary CTA */}
            <Link href="/signup">
              <button className="group bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2 min-h-[56px] w-full sm:w-auto justify-center">
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </Link>

            {/* Parent-focused secondary CTA */}
            <Link href="#parent-peace-of-mind">
              <button className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/20 transition-all duration-300 flex items-center space-x-2 min-h-[56px] w-full sm:w-auto justify-center">
                <span>Why Parents Choose Us</span>
              </button>
            </Link>
          </div>

          {/* Social proof hint */}
          <p
            className="text-blue-200 mt-6 text-sm animate-slideUp"
            style={{ animationDelay: "1s" }}
          >
            Trusted by Durham Law students and recommended by parents
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHeroSection;
