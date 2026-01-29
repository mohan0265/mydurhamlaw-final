import React from "react";
import Head from "next/head";
import {
  Award,
  Users,
  Globe,
  Heart,
  BookOpen,
  Star,
  ExternalLink,
} from "lucide-react";

const CSRShowcase = () => {
  return (
    <>
      <Head>
        <title>CSR Showcase - Caseway</title>
        // ... (skipping description lines if not targeted, but let's check grep
        again) // Grep matched line 39 for body content: "At Caseway, we
        believe..." // I will target line 39 separately in next call or just use
        single replacement if lines are far apart. // Grep said line 9 for
        title.
        <title>CSR Showcase - Caseway</title>
        <meta
          name="description"
          content="Discover our Corporate Social Responsibility initiatives and community impact at Durham University Law"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-green-600 to-emerald-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                CSR Showcase
              </h1>
              <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto">
                Making a Positive Impact Through Technology, Education, and
                Community Engagement
              </p>
              <div className="flex items-center justify-center gap-2 text-green-200">
                <Heart className="h-5 w-5" />
                <span className="text-lg">
                  Building a Better Future for Legal Education
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our CSR Commitment
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              At Caseway, we believe that education technology should serve not
              just individual success, but collective progress. Our Corporate
              Social Responsibility initiatives focus on democratizing access to
              quality legal education, supporting student wellbeing, and
              fostering positive change in our communities.
            </p>
          </div>
        </section>

        {/* Key Initiatives */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Our Key Initiatives
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Educational Access */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border border-blue-200">
                <div className="bg-blue-600 rounded-lg p-3 w-fit mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Educational Access Initiative
                </h3>
                <p className="text-gray-700 mb-4">
                  Providing free access to our AI tutoring platform for students
                  from underrepresented backgrounds and developing communities.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• 500+ scholarships annually for platform access</li>
                  <li>• Partnership with 50+ schools in underserved areas</li>
                  <li>• Multilingual support for diverse communities</li>
                  <li>• Free training workshops for educators</li>
                </ul>
              </div>

              {/* Mental Health Support */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-8 border border-pink-200">
                <div className="bg-pink-600 rounded-lg p-3 w-fit mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Student Wellbeing Program
                </h3>
                <p className="text-gray-700 mb-4">
                  Comprehensive mental health and wellbeing support through
                  technology and community partnerships.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• 24/7 AI-powered wellbeing companion</li>
                  <li>• Free counseling sessions for all users</li>
                  <li>• Stress management and mindfulness tools</li>
                  <li>• Peer support network facilitation</li>
                </ul>
              </div>

              {/* Community Outreach */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 border border-green-200">
                <div className="bg-green-600 rounded-lg p-3 w-fit mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Community Legal Aid
                </h3>
                <p className="text-gray-700 mb-4">
                  Connecting students with pro bono opportunities and community
                  legal aid organizations to provide real-world impact.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• 1000+ hours of community legal aid annually</li>
                  <li>• Free legal clinic management platform</li>
                  <li>• Student volunteer matching system</li>
                  <li>• Legal literacy programs for communities</li>
                </ul>
              </div>

              {/* Environmental Responsibility */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-8 border border-yellow-200">
                <div className="bg-yellow-600 rounded-lg p-3 w-fit mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Green Technology Initiative
                </h3>
                <p className="text-gray-700 mb-4">
                  Committed to reducing environmental impact through sustainable
                  technology practices and carbon-neutral operations.
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li>• 100% renewable energy for all servers</li>
                  <li>• Carbon-neutral platform operations by 2025</li>
                  <li>• Paperless education initiative support</li>
                  <li>• Environmental law research funding</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Statistics */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Our Impact in Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  2,500+
                </div>
                <div className="text-gray-700 font-medium">
                  Students Supported
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Through scholarship programs
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">75</div>
                <div className="text-gray-700 font-medium">
                  Partner Organizations
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Community and educational
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  10,000+
                </div>
                <div className="text-gray-700 font-medium">Service Hours</div>
                <div className="text-sm text-gray-500 mt-1">
                  Community legal aid provided
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  100%
                </div>
                <div className="text-gray-700 font-medium">Carbon Neutral</div>
                <div className="text-sm text-gray-500 mt-1">
                  Platform operations
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Organizations */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Our Partners
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Durham Law School */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-blue-600 rounded-full p-4 w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Durham Law School
                </h3>
                <p className="text-gray-600 text-sm">
                  Primary academic partner providing curriculum guidance and
                  student support
                </p>
              </div>

              {/* Citizens Advice */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-green-600 rounded-full p-4 w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Citizens Advice Durham
                </h3>
                <p className="text-gray-600 text-sm">
                  Community legal aid partnership providing real-world
                  experience for students
                </p>
              </div>

              {/* Mind Durham */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="bg-pink-600 rounded-full p-4 w-fit mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mind Durham
                </h3>
                <p className="text-gray-600 text-sm">
                  Mental health support partnership ensuring comprehensive
                  student wellbeing
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Student Testimonials */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Student Impact Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-700 italic mb-4">
                  "The scholarship program made it possible for me to access
                  world-class AI tutoring. It's completely transformed my
                  understanding of constitutional law and given me confidence I
                  never had before."
                </p>
                <div className="text-gray-900 font-semibold">Sarah M.</div>
                <div className="text-gray-600 text-sm">
                  Year 2 Student, Scholarship Recipient
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-700 italic mb-4">
                  "Volunteering through the community legal aid program has been
                  incredibly rewarding. I've helped real people with real
                  problems while developing practical skills that complement my
                  academic studies."
                </p>
                <div className="text-gray-900 font-semibold">James L.</div>
                <div className="text-gray-600 text-sm">
                  Year 3 Student, Volunteer Coordinator
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get Involved
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join us in making a positive impact on legal education and
              communities worldwide.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <a
                href="/signup"
                className="bg-white text-green-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Apply for Scholarship
              </a>
              <a
                href="/volunteer"
                className="border border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors"
              >
                Volunteer Opportunities
              </a>
              <a
                href="/partnership"
                className="border border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors"
              >
                Partner with Us
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CSRShowcase;
