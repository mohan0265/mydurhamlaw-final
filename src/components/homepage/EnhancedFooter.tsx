"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Heart,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  BRAND_NAME,
  BRAND_SUPPORT_EMAIL,
  LEGAL_DISCLAIMER_LONG,
  LEGAL_DISCLAIMER_SHORT,
} from "@/lib/brand";

export const EnhancedFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {BRAND_NAME}
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The ethical AI study companion built exclusively for Durham
              University Law students. Transforming legal education with
              integrity, intelligence, and care.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Legal & Ethics column */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Legal & Ethics</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/ethics"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center group"
                >
                  <Shield className="w-4 h-4 mr-2 group-hover:text-green-400" />
                  Ethics Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-use"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookie-policy"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/academic-integrity"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Academic Integrity Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Student Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/tools/legal-news-feed"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Legal News Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/research"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Legal Research Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/wellbeing"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Durmah Wellbeing Coach
                </Link>
              </li>
              <li>
                <Link
                  href="/study-schedule"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Study Schedule
                </Link>
              </li>
              <li>
                <Link
                  href="/assignments"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Assignment Helper
                </Link>
              </li>
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support & Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${BRAND_SUPPORT_EMAIL}`}
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {BRAND_SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/getting-started"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Getting Started Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Send Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Student Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Durham University disclaimer */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20 mb-8">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-blue-300 mb-2">
                Independent Development Notice
              </h5>
              <p className="text-blue-100 text-sm leading-relaxed">
                {LEGAL_DISCLAIMER_LONG}
              </p>
            </div>
          </div>
        </div>

        {/* SEO-friendly links section */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <h5 className="text-sm font-semibold text-gray-400 mb-4">
            Popular Searches
          </h5>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href="/durham-law-study-guide"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              Durham Law Study Guide
            </Link>
            <Link
              href="/uk-law-degree-help"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              UK Law Degree Help
            </Link>
            <Link
              href="/legal-assignment-assistance"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              Legal Assignment Assistance
            </Link>
            <Link
              href="/wellbeing"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              Law Student Wellbeing
            </Link>
            <Link
              href="/legal-research-tools"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              Legal Research Tools
            </Link>
            <Link
              href="/uk-law-faculties"
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
            >
              UK Law Faculties
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} {BRAND_NAME}. Built with care for
            legal excellence. All rights reserved.
          </p>

          <div className="flex items-center space-x-6 text-sm">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full transition-all duration-300"
            >
              Start Free Trial
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/pricing"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              Pricing
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/about"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
