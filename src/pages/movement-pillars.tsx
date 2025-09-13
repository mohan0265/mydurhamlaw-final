import React from 'react';
import Head from 'next/head';
import { Heart, Brain, Shield, Users, Globe, BookOpen, Target, Zap } from 'lucide-react';

const MovementPillars = () => {
  return (
    <>
      <Head>
        <title>Movement Pillars - MyDurhamLaw</title>
        <meta name="description" content="The core principles and values that drive the MyDurhamLaw movement in transforming legal education" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-pink-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Movement Pillars
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-4xl mx-auto">
                The Fundamental Principles Driving the Future of Legal Education at Durham
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <Heart className="h-5 w-5" />
                <span className="text-lg">Built on Values, Driven by Purpose</span>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Movement
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              MyDurhamLaw is more than a platform-it's a movement to revolutionize legal education. 
              Our pillars represent the core values and principles that guide every decision, 
              every feature, and every interaction. Together, they form the foundation of 
              a new era in legal education that puts students first.
            </p>
          </div>
        </section>

        {/* The Eight Pillars */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              The Eight Pillars
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {/* Pillar 1: Human-Centered Technology */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border border-blue-200">
                <div className="bg-blue-600 rounded-lg p-3 w-fit mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Human-Centered Technology
                </h3>
                <p className="text-gray-700 mb-4">
                  Technology should enhance human potential, not replace human connection. 
                  Every feature we build prioritizes the student experience and maintains 
                  the warmth of human interaction.
                </p>
                <div className="bg-blue-600/10 rounded-lg p-4">
                  <p className="text-blue-800 font-medium italic">
                    "We believe AI should feel like a wise friend, not a cold machine."
                  </p>
                </div>
              </div>

              {/* Pillar 2: Inclusive Excellence */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 border border-green-200">
                <div className="bg-green-600 rounded-lg p-3 w-fit mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Inclusive Excellence
                </h3>
                <p className="text-gray-700 mb-4">
                  Legal education should be accessible to all, regardless of background, 
                  financial situation, or learning style. We create opportunities, 
                  not barriers.
                </p>
                <div className="bg-green-600/10 rounded-lg p-4">
                  <p className="text-green-800 font-medium italic">
                    "Excellence is achieved when everyone has the opportunity to succeed."
                  </p>
                </div>
              </div>

              {/* Pillar 3: Wellbeing First */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-8 border border-pink-200">
                <div className="bg-pink-600 rounded-lg p-3 w-fit mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. Wellbeing First
                </h3>
                <p className="text-gray-700 mb-4">
                  Academic success means nothing without mental and emotional health. 
                  We integrate wellbeing support into every aspect of the learning journey, 
                  making it as important as academic achievement.
                </p>
                <div className="bg-pink-600/10 rounded-lg p-4">
                  <p className="text-pink-800 font-medium italic">
                    "A healthy mind is the foundation of all learning."
                  </p>
                </div>
              </div>

              {/* Pillar 4: Intelligent Personalization */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-8 border border-purple-200">
                <div className="bg-purple-600 rounded-lg p-3 w-fit mb-6">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Intelligent Personalization
                </h3>
                <p className="text-gray-700 mb-4">
                  Every student learns differently. Our AI adapts to individual learning styles, 
                  pace, and preferences, creating a truly personalized educational experience 
                  that evolves with each student.
                </p>
                <div className="bg-purple-600/10 rounded-lg p-4">
                  <p className="text-purple-800 font-medium italic">
                    "One size fits none. Personalization is the key to unlocking potential."
                  </p>
                </div>
              </div>

              {/* Pillar 5: Ethical Innovation */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-8 border border-orange-200">
                <div className="bg-orange-600 rounded-lg p-3 w-fit mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Ethical Innovation
                </h3>
                <p className="text-gray-700 mb-4">
                  We innovate responsibly, with built-in ethical guardrails and academic integrity 
                  at the core. Our technology enhances learning while teaching the importance 
                  of ethical practice in law.
                </p>
                <div className="bg-orange-600/10 rounded-lg p-4">
                  <p className="text-orange-800 font-medium italic">
                    "Innovation without ethics is progress without purpose."
                  </p>
                </div>
              </div>

              {/* Pillar 6: Community Building */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl p-8 border border-teal-200">
                <div className="bg-teal-600 rounded-lg p-3 w-fit mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Community Building
                </h3>
                <p className="text-gray-700 mb-4">
                  Learning is enhanced through connection. We foster communities where students 
                  support each other, share knowledge, and build lasting professional relationships 
                  that extend beyond graduation.
                </p>
                <div className="bg-teal-600/10 rounded-lg p-4">
                  <p className="text-teal-800 font-medium italic">
                    "Together we learn, together we grow, together we succeed."
                  </p>
                </div>
              </div>

              {/* Pillar 7: Continuous Evolution */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl p-8 border border-indigo-200">
                <div className="bg-indigo-600 rounded-lg p-3 w-fit mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Continuous Evolution
                </h3>
                <p className="text-gray-700 mb-4">
                  The legal landscape evolves rapidly, and so must legal education. 
                  We continuously adapt our platform based on student feedback, 
                  industry changes, and educational research.
                </p>
                <div className="bg-indigo-600/10 rounded-lg p-4">
                  <p className="text-indigo-800 font-medium italic">
                    "Standing still is moving backward in a world of constant change."
                  </p>
                </div>
              </div>

              {/* Pillar 8: Real-World Impact */}
              <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-8 border border-red-200">
                <div className="bg-red-600 rounded-lg p-3 w-fit mb-6">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Real-World Impact
                </h3>
                <p className="text-gray-700 mb-4">
                  Education should prepare students for real-world challenges. 
                  We connect academic learning with practical applications, 
                  community service, and meaningful career preparation.
                </p>
                <div className="bg-red-600/10 rounded-lg p-4">
                  <p className="text-red-800 font-medium italic">
                    "True education transforms not just the student, but society."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Pillars Guide Development */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Pillars in Action
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Development */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Product Development
                </h3>
                <p className="text-gray-700 mb-4">
                  Every feature we build is evaluated against our eight pillars. 
                  If it doesn't align with our values, it doesn't make it into the platform.
                </p>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>• User experience review against human-centered design</li>
                  <li>• Accessibility audit for inclusive excellence</li>
                  <li>• Wellbeing impact assessment</li>
                  <li>• Ethical implications review</li>
                </ul>
              </div>

              {/* Community Engagement */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Community Engagement
                </h3>
                <p className="text-gray-700 mb-4">
                  Our pillars guide how we interact with students, faculty, and the 
                  broader legal education community.
                </p>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>• Regular student feedback sessions</li>
                  <li>• Collaborative partnerships with institutions</li>
                  <li>• Transparent communication about changes</li>
                  <li>• Community-driven feature development</li>
                </ul>
              </div>

              {/* Social Responsibility */}
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Social Responsibility
                </h3>
                <p className="text-gray-700 mb-4">
                  Our CSR initiatives directly reflect our commitment to the movement pillars, 
                  especially inclusive excellence and real-world impact.
                </p>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li>• Scholarship programs for underrepresented students</li>
                  <li>• Free platform access for developing communities</li>
                  <li>• Environmental sustainability measures</li>
                  <li>• Legal aid and community service programs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Student Voices */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Student Voices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-8">
                <p className="text-gray-700 italic mb-4 text-lg">
                  "I can feel that this platform was built with genuine care for students. 
                  The way it adapts to my learning style and checks in on my wellbeing 
                  shows that the developers truly understand what we need."
                </p>
                <div className="text-gray-900 font-semibold">Alex Chen</div>
                <div className="text-gray-600 text-sm">Year 2 Student</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8">
                <p className="text-gray-700 italic mb-4 text-lg">
                  "The pillars aren't just words on a page-you can see them in action 
                  every day. When I struggled with anxiety, the platform noticed and 
                  connected me with support resources immediately."
                </p>
                <div className="text-gray-900 font-semibold">Emma Rodriguez</div>
                <div className="text-gray-600 text-sm">Year 3 Student</div>
              </div>
            </div>
          </div>
        </section>

        {/* Join the Movement */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join the Movement
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Be part of a community that's revolutionizing legal education through values-driven innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Your Journey
              </a>
              <a
                href="/vision-2035"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Explore Our Vision
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default MovementPillars;