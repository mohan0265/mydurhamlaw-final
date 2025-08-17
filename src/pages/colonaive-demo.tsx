'use client'

import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import TriageAssessment from '@/components/TriageAssessment'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Brain, Shield, Users, ArrowRight } from 'lucide-react'

const COLONAiVEDemoPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>COLONAiVE™ - AI-Powered Colorectal Health Platform</title>
        <meta name="description" content="Experience the future of colorectal health screening and management with COLONAiVE's AI-powered platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  COLONAiVE™
                </h1>
                <p className="text-gray-600 mt-2">AI-Powered Colorectal Health Platform</p>
              </div>
              <Link href="/admin/SuperAdminDashboard">
                <Button className="min-h-[44px]">
                  Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Advanced AI for
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Colorectal Health
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience cutting-edge AI technology that helps healthcare providers and patients 
                navigate colorectal health with precision, early detection, and personalized care.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Triage</h3>
                  <p className="text-gray-600 text-sm">Smart risk assessment using advanced algorithms</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Early Detection</h3>
                  <p className="text-gray-600 text-sm">Identify risks before symptoms appear</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Patient-Centered</h3>
                  <p className="text-gray-600 text-sm">Personalized care pathways for every individual</p>
                </div>
              </div>
            </div>
          </section>

          {/* Demo Sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-16">
            {/* Triage Assessment Demo */}
            <section>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  🧠 AI Health Triage Assessment
                </h3>
                <p className="text-gray-600">
                  Experience our intelligent risk assessment tool that analyzes symptoms, family history, 
                  and risk factors to provide personalized recommendations.
                </p>
              </div>
              <TriageAssessment />
            </section>

            {/* Contact Form Demo */}
            <section>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  📞 Professional Consultation
                </h3>
                <p className="text-gray-600">
                  Connect with our clinical team for partnerships, clinical trials, 
                  or specialized consultations. All inquiries are tracked in our CRM system.
                </p>
              </div>
              <ContactForm 
                title="Get in Touch"
                description="Connect with our clinical and business development team"
              />
            </section>
          </div>

          {/* Features Grid */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h3>
              <p className="text-xl text-gray-600">Comprehensive tools for modern colorectal healthcare</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>🔬 Clinical Decision Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    AI-powered recommendations for screening protocols, diagnostic pathways, and treatment planning.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Population Health Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Advanced analytics for identifying high-risk populations and optimizing screening programs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🤝 Care Coordination</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Seamless integration with existing healthcare systems for comprehensive patient management.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📱 Patient Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Interactive tools for patient education, screening reminders, and symptom tracking.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔐 HIPAA Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Enterprise-grade security with full HIPAA compliance and advanced data protection.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>⚡ Real-time Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Instant analysis and recommendations powered by the latest Hunyuan 7B AI technology.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl px-8 py-12 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Colorectal Care?</h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join leading healthcare organizations using COLONAiVE to improve patient outcomes 
              and streamline colorectal health management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/SuperAdminDashboard">
                <Button size="lg" variant="secondary" className="min-h-[48px] touch-manipulation">
                  View Admin Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white/10 min-h-[48px] touch-manipulation">
                Schedule Demo
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white px-4 sm:px-6 py-12 mt-16">
          <div className="max-w-7xl mx-auto text-center">
            <h4 className="text-2xl font-bold mb-4">COLONAiVE™</h4>
            <p className="text-gray-400 mb-6">
              Advancing colorectal health through artificial intelligence and clinical excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-gray-400">
              <span>&copy; 2024 COLONAiVE. All rights reserved.</span>
              <Link href="/legal/privacy-policy" className="hover:text-white transition-colors min-h-[44px] flex items-center">
                Privacy Policy
              </Link>
              <Link href="/legal/terms-of-use" className="hover:text-white transition-colors min-h-[44px] flex items-center">
                Terms of Use
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default COLONAiVEDemoPage