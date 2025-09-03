import dynamic from 'next/dynamic'
import React from 'react'

// Dynamic import to prevent serialization issues
const ModernSidebar = dynamic(() => import('@/components/layout/ModernSidebar'), { ssr: false })
const Card = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.Card })), { ssr: false })
const CardContent = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.CardContent })), { ssr: false })

// Icons as simple components to avoid serialization issues
const Shield = () => <div>🛡️</div>
const AlertTriangle = () => <div>⚠️</div>
const BookOpen = () => <div>📚</div>
const Users = () => <div>👥</div>
const Heart = () => <div>❤️</div>
const CheckCircle = () => <div>✅</div>

export default function EthicsPage() {
  return (
    <ModernSidebar>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield />
            <h1 className="text-3xl font-bold text-gray-900">Academic Ethics & AI Integrity</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            MyDurhamLaw is committed to upholding the highest standards of academic integrity, 
            transparency, and ethical AI assistance for Durham University Law students.
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Important Notice</h3>
                <p className="text-orange-800">
                  <strong>MyDurhamLaw is not affiliated with Durham University.</strong> This platform 
                  provides AI-powered academic assistance for educational enrichment only. All AI responses 
                  are for academic guidance and should never be considered as legal advice or official 
                  university guidance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Principles */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <Heart />
            Our Core Principles
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* AI as Assistant, Not Authority */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <BookOpen />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">AI as Assistant, Not Authority</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• AI provides academic guidance, not definitive legal analysis</li>
                      <li>• No AI response should replace official course materials</li>
                      <li>• Always consult your lecturer for authoritative guidance</li>
                      <li>• AI suggestions are starting points for further research</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transparency & Honesty */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Shield />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Transparency & Honesty</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Every AI response includes clear disclaimers</li>
                      <li>• We&apos;re transparent about AI limitations and uncertainties</li>
                      <li>• Source citations provided where applicable</li>
                      <li>• Clear distinction between AI guidance and official sources</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Empowerment */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Users />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Student Empowerment</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Students can flag inaccurate or confusing AI responses</li>
                      <li>• Feedback helps improve AI accuracy over time</li>
                      <li>• Year-specific guidance tailored to your academic level</li>
                      <li>• Supporting your learning journey, not replacing it</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Integrity */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Academic Integrity</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• Promotes understanding, not academic shortcuts</li>
                      <li>• Encourages critical thinking and independent research</li>
                      <li>• Supports Durham University&apos;s academic standards</li>
                      <li>• Guides toward original thought and proper citation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* AI Limitations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Understanding AI Limitations</h2>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-4">What Our AI Can Do:</h3>
              <ul className="space-y-2 text-blue-800">
                <li>✅ Explain complex legal concepts in accessible language</li>
                <li>✅ Suggest research directions and case law to explore</li>
                <li>✅ Help organize thoughts for essays and assignments</li>
                <li>✅ Provide study strategies and exam preparation guidance</li>
                <li>✅ Offer emotional support and wellbeing advice</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-red-900 mb-4">What Our AI Cannot Do:</h3>
              <ul className="space-y-2 text-red-800">
                <li>❌ Provide legal advice or professional legal opinions</li>
                <li>❌ Replace official Durham University course materials</li>
                <li>❌ Guarantee accuracy of legal interpretations</li>
                <li>❌ Complete assignments or exams on your behalf</li>
                <li>❌ Make authoritative statements about current law</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Student Responsibilities */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Responsibilities as a Student</h2>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Academic Integrity</h4>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Use AI assistance as a learning tool, not a shortcut</li>
                    <li>• Always cite sources and acknowledge AI assistance where required</li>
                    <li>• Ensure your work reflects your own understanding</li>
                    <li>• Follow Durham University&apos;s academic integrity policies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Critical Thinking</h4>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Verify AI suggestions against official sources</li>
                    <li>• Question and analyze AI responses critically</li>
                    <li>• Seek multiple perspectives on complex legal issues</li>
                    <li>• Develop your own legal reasoning skills</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback & Improvement */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Help Us Improve</h2>
          
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-green-900 mb-3">🛡️ Report Inaccurate Content</h3>
              <p className="text-green-800 mb-4">
                Found an AI response that seems incorrect, misleading, or confusing? Your feedback 
                helps us maintain high academic standards and improve our AI systems.
              </p>
              <ul className="space-y-2 text-green-700 text-sm">
                <li>• Use the &ldquo;🛡️ Flag Inaccurate / Confusing&rdquo; button on any AI response</li>
                <li>• Provide specific details about what seems incorrect</li>
                <li>• Suggest improvements or corrections where possible</li>
                <li>• Your feedback is reviewed by our academic team</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Support */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Contact & Support</h2>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                Questions about our ethics framework or concerns about AI responses? 
                We&apos;re here to help maintain the highest standards of academic integrity.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Academic Integrity Concerns:</strong> Use the feedback system on any AI response</p>
                <p><strong>Technical Issues:</strong> Contact support through the app settings</p>
                <p><strong>Ethics Questions:</strong> Refer to this page and our Terms of Use</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Notice */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This ethics framework is regularly reviewed and updated to ensure the highest standards 
            of academic integrity and AI transparency for Durham Law students.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

      </div>
    </ModernSidebar>
  )
}