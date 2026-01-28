// /src/pages/legal/privacy-policy.tsx
import React from "react";
import BackNavigation from "@/components/BackNavigation";
import { Accordion, AccordionGroup } from "@/components/ui/Accordion";
import { Database, Shield, Lock, UserCheck, RefreshCw } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-gray-800">
      <BackNavigation className="mb-8" />
      <h1 className="text-4xl font-bold mb-6 text-purple-700">
        Privacy Policy
      </h1>

      <p className="mb-4">
        This Privacy Policy describes how <strong>Caseway</strong> collects,
        uses, and protects your personal information. We are committed to
        safeguarding your data and respecting your rights.
      </p>

      <div className="my-8">
        <AccordionGroup className="space-y-4" allowMultiple={true}>
          <Accordion
            title="1. Information We Collect"
            icon={<Database className="w-5 h-5 text-blue-600" />}
            defaultOpen={true}
            variant="bordered"
          >
            <div className="space-y-3">
              <p className="text-gray-700 font-medium">
                We collect the following types of information:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-gray-700">
                <li>
                  Email address, name, and year of study during registration
                </li>
                <li>
                  Study tasks, assignments, journal entries, and uploaded files
                </li>
                <li>Chat and voice interactions for personalization</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-blue-800 text-sm">
                  All data collection is limited to what&apos;s necessary for
                  providing our educational services.
                </p>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="2. How We Use Your Data"
            icon={<UserCheck className="w-5 h-5 text-green-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                Your data is used solely to personalize your learning
                experience, store your progress, and enhance the platform. We do
                not sell or share your information with third parties.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm font-medium">
                  ✓ Educational personalization only
                  <br />
                  ✓ Progress tracking
                  <br />✓ No data selling or sharing
                </p>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="3. Data Security"
            icon={<Lock className="w-5 h-5 text-purple-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                All data is stored securely using Supabase with strict access
                control and role-level permissions. Communication with AI
                services is encrypted and follows strict ethical and privacy
                guidelines.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-purple-800 text-sm">
                  <strong>Security measures:</strong> Encrypted storage, access
                  controls, secure API communications, and regular security
                  audits.
                </p>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="4. Your Rights"
            icon={<Shield className="w-5 h-5 text-orange-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                You may request to access, update, or delete your data at any
                time. Just contact our support team via the Help section in your
                dashboard.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 text-sm">
                  <strong>Your rights include:</strong> Data access, correction,
                  deletion, and portability. We respond to requests within 30
                  days.
                </p>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="5. Changes to This Policy"
            icon={<RefreshCw className="w-5 h-5 text-gray-600" />}
            defaultOpen={false}
            variant="bordered"
          >
            <p className="text-gray-700 leading-relaxed">
              We may occasionally update this Privacy Policy. Any changes will
              be communicated clearly through the app or by email.
            </p>
          </Accordion>
        </AccordionGroup>
      </div>

      <hr className="my-6 border-gray-300" />
      <p className="text-sm text-gray-600">Last updated: July 2025</p>
    </main>
  );
};

export default PrivacyPolicyPage;
