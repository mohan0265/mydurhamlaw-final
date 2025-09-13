import React from 'react';
import Head from 'next/head';
import { Calendar, Target, Users, Globe, BookOpen, Award } from 'lucide-react';

const Vision2035 = () => {
  return (
    <>
      <Head>
        <title>Vision 2035 - MyDurhamLaw</title>
        <meta name="description" content="Our vision for transforming legal education at Durham University by 2035" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Vision 2035
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto">
                Transforming Legal Education Through Innovation, Technology, and Human-Centered Learning
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-200">
                <Calendar className="h-5 w-5" />
                <span className="text-lg">A Decade-Long Journey: 2025-2035</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              By 2035, MyDurhamLaw will establish Durham University as the global leader in 
              technology-enhanced legal education, where every law student has access to 
              personalized AI companions, comprehensive wellbeing support, and innovative 
              learning experiences that prepare them for the future of law.
            </p>
          </div>
        </section>

        {/* Key Pillars */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Strategic Pillars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* AI-Enhanced Learning */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 border border-purple-200">
                <div className="bg-purple-600 rounded-lg p-3 w-fit mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI-Enhanced Learning
                </h3>
                <p className="text-gray-700">
                  Revolutionary AI companions that adapt to each student's learning style, 
                  providing personalized tutoring, case analysis, and academic support 24/7.
                </p>
              </div>

              {/* Student Wellbeing */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-6 border border-pink-200">
                <div className="bg-pink-600 rounded-lg p-3 w-fit mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Holistic Wellbeing
                </h3>
                <p className="text-gray-700">
                  Comprehensive mental health and wellbeing ecosystem that supports students 
                  through their academic journey with proactive care and intervention.
                </p>
              </div>

              {/* Global Impact */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <div className="bg-green-600 rounded-lg p-3 w-fit mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Global Leadership
                </h3>
                <p className="text-gray-700">
                  Position Durham as the world's premier destination for legal education, 
                  attracting top talent and setting new standards for the industry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Roadmap to 2035
            </h2>
            <div className="space-y-8">
              {/* Phase 1: Foundation (2025-2027) */}
              <div className="flex items-start gap-6">
                <div className="bg-blue-600 rounded-full p-2 mt-1">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Phase 1: Foundation (2025-2027)
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Launch MyDurhamLaw platform with core AI tutoring, voice companions, 
                    and wellbeing support for all Durham law students.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Deploy Durmah Voice MVP across all year groups</li>
                    <li>• Implement comprehensive academic planning tools</li>
                    <li>• Establish baseline wellbeing monitoring</li>
                  </ul>
                </div>
              </div>

              {/* Phase 2: Expansion (2027-2030) */}
              <div className="flex items-start gap-6">
                <div className="bg-purple-600 rounded-full p-2 mt-1">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Phase 2: Expansion (2027-2030)
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Scale platform capabilities with advanced AI, multi-language support, 
                    and integration with global legal databases.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Advanced case law analysis and prediction</li>
                    <li>• International student support systems</li>
                    <li>• Partnership with global law schools</li>
                  </ul>
                </div>
              </div>

              {/* Phase 3: Innovation (2030-2033) */}
              <div className="flex items-start gap-6">
                <div className="bg-green-600 rounded-full p-2 mt-1">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Phase 3: Innovation (2030-2033)
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Pioneer next-generation legal education with VR courtrooms, 
                    AI-powered mock trials, and immersive learning experiences.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Virtual reality legal simulations</li>
                    <li>• AI-powered career guidance and placement</li>
                    <li>• Industry-leading research capabilities</li>
                  </ul>
                </div>
              </div>

              {/* Phase 4: Leadership (2033-2035) */}
              <div className="flex items-start gap-6">
                <div className="bg-indigo-600 rounded-full p-2 mt-1">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Phase 4: Global Leadership (2033-2035)
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Establish Durham as the undisputed global leader in legal education 
                    innovation, with our platform used by law schools worldwide.
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Global platform licensing and partnerships</li>
                    <li>• International legal education standards</li>
                    <li>• Next-generation legal professionals pipeline</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Expected Impact by 2035
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-gray-700">of Durham law students using AI support</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">50%</div>
                <div className="text-gray-700">improvement in student wellbeing scores</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
                <div className="text-gray-700">partner law schools globally</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">#1</div>
                <div className="text-gray-700">ranked law school for innovation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join Us on This Journey
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Be part of the transformation that will shape the future of legal education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Today
              </a>
              <a
                href="/movement-pillars"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Learn About Our Movement
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Vision2035;