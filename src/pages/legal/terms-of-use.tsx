// /src/pages/legal/terms-of-use.tsx
import React from 'react';
import Link from 'next/link';
import BackNavigation from '@/components/BackNavigation';
import { Accordion, AccordionGroup } from '@/components/ui/Accordion';
import { Shield, UserCheck, AlertTriangle, BookOpen, Heart, Gavel } from 'lucide-react';

const TermsOfUsePage = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <BackNavigation className="mb-8" />
      <h1 className="text-4xl font-bold mb-6 text-purple-700">Terms of Use</h1>

      <p className="mb-4">
        By accessing or using the <strong>MyDurhamLaw</strong> platform, you agree to be bound by the following terms and conditions. Please read them carefully.
      </p>

      <div className="my-8">
        <AccordionGroup className="space-y-4" allowMultiple={true}>
          <Accordion
            title="1. Eligibility"
            icon={<UserCheck className="w-5 h-5 text-blue-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <p className="text-gray-700 leading-relaxed">
              This platform is intended for use by students currently enrolled in law programs at Durham University or other authorized institutions.
            </p>
          </Accordion>

          <Accordion
            title="2. Account Responsibility"
            icon={<Shield className="w-5 h-5 text-green-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <p className="text-gray-700 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and for all activities that occur under your login.
            </p>
          </Accordion>

          <Accordion
            title="3. Acceptable Use"
            icon={<BookOpen className="w-5 h-5 text-purple-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <p className="text-gray-700 leading-relaxed">
              You agree not to use the platform for any unlawful purpose or to engage in academic misconduct using AI-generated content.
            </p>
          </Accordion>

          <Accordion
            title="4. University Affiliation Disclaimer"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            defaultOpen={true}
            variant="bordered"
            className="border-l-red-500 bg-red-50/30"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium leading-relaxed">
                <strong>IMPORTANT:</strong> MyDurhamLaw is NOT affiliated with, endorsed by, or officially connected to Durham University. 
                This platform is an independent academic support tool created for educational enrichment purposes only.
              </p>
            </div>
          </Accordion>

          <Accordion
            title="5. AI Assistant Limitations & Academic Integrity"
            icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
            defaultOpen={true}
            variant="bordered"
            className="border-l-indigo-500"
          >
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-medium mb-2">
                  <strong>5.1 Academic Guidance Only:</strong> All AI responses (including Durmah, news analysis, and other AI features) 
                  provide academic guidance only and must NOT be considered as:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>Legal advice or professional legal opinions</li>
                  <li>Authoritative statements about current law</li>
                  <li>Official Durham University course guidance</li>
                  <li>Substitute for official course materials or lecturer guidance</li>
                  <li>Guaranteed accurate legal interpretations</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-2">
                  <strong>5.2 Student Responsibilities:</strong> You agree to:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>Always verify AI suggestions against official sources</li>
                  <li>Consult your lecturer or course materials for authoritative guidance</li>
                  <li>Use AI assistance as a learning tool, not an academic shortcut</li>
                  <li>Follow Durham University&apos;s academic integrity policies</li>
                  <li>Acknowledge AI assistance in your work where required by your institution</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  <strong>5.3 Accuracy Disclaimer:</strong> While we strive for accuracy, AI responses may contain errors, 
                  outdated information, or misinterpretations. We cannot guarantee the accuracy, completeness, or 
                  reliability of any AI-generated content.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>5.4 Feedback System:</strong> You can flag inaccurate or confusing AI responses using our 
                  feedback system. This helps maintain academic standards but does not create liability on our part 
                  for any inaccuracies.
                </p>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="6. Wellbeing Support Limitations"
            icon={<Heart className="w-5 h-5 text-pink-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>6.1 Not Professional Therapy:</strong> Our AI wellbeing features provide supportive guidance but are NOT 
                a substitute for professional mental health services, medical advice, or counseling.
              </p>
              <p>
                <strong>6.2 Crisis Support:</strong> For serious mental health concerns, please contact Durham University 
                Student Support services or appropriate professional help immediately.
              </p>
            </div>
          </Accordion>

          <Accordion
            title="7. Termination"
            icon={<Gavel className="w-5 h-5 text-gray-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate access to your account if you violate these terms or misuse the platform.
            </p>
          </Accordion>
        </AccordionGroup>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Related Documents:</strong> For more information about our commitment to academic integrity 
          and ethical AI use, please read our{' '}
          <Link href="/ethics" className="underline text-blue-600 hover:text-blue-800">
            Ethics & Academic Integrity Guidelines
          </Link>.
        </p>
      </div>

      <hr className="my-6 border-gray-300" />
      <p className="text-sm text-gray-600">
        Last updated: {new Date().toLocaleDateString('en-GB')}
      </p>
    </main>
  );
};

export default TermsOfUsePage;
