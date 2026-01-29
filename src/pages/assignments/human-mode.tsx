import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { withAuthProtection } from "@/lib/withAuthProtection";
import { useAuth } from "@/lib/supabase/AuthContext";
import ModernSidebar from "@/components/layout/ModernSidebar";
import IntegrityPledge from "@/components/integrity/IntegrityPledge";
import HumanModeDrafting from "@/components/integrity/HumanModeDrafting";
import DisclosureBanner from "@/components/integrity/DisclosureBanner";
import { type HelpLevel } from "@/lib/integrity/humanMode";
import { useDisclosureRequired } from "@/components/integrity/DisclosureBanner";

const HumanModePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [showPledge, setShowPledge] = useState(false);
  const [coachOutput, setCoachOutput] = useState("");
  const shouldShowDisclosure = useDisclosureRequired();

  // Show pledge if not acknowledged - temporarily disabled
  useEffect(() => {
    // if (user && !integrityAcknowledged) {
    //   setShowPledge(true);
    // }
  }, [user]);

  const handleAssistanceRequest = async (query: string, level: HelpLevel) => {
    if (!user) return;

    try {
      const response = await fetch("/api/assistant/human-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          assistanceLevel: level,
          userId: user.id,
          sources: [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCoachOutput(data.reply);
      } else {
        console.error("Error getting assistance:", data.error);
        setCoachOutput(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error requesting assistance:", error);
      setCoachOutput("Error: Failed to get assistance. Please try again.");
    }
  };

  const handlePledgeAcknowledged = () => {
    // AuthContext will automatically update from database
    // Component will re-render when integrity is acknowledged
  };

  return (
    <>
      <Head>
        <title>Human Mode Drafting™ - Caseway</title>
        <meta
          name="description"
          content="Academic integrity-compliant AI assistance for legal studies"
        />
      </Head>

      <div className="flex h-screen bg-gray-50">
        <ModernSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Disclosure Banner */}
          {shouldShowDisclosure && <DisclosureBanner />}

          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">HM</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Human Mode Drafting™
                    </h1>
                    <p className="text-gray-600">
                      Academic integrity-first AI assistance
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">
                          Academic Integrity First
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">
                          Cite-Ready Coaching
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">
                          Coach-Not-Ghost
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      We build independent legal thinkers
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <HumanModeDrafting
                onAssistanceRequest={handleAssistanceRequest}
              />

              {/* Ethics Notice */}
              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Our Commitment to Academic Integrity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <strong className="text-gray-900">
                      Never Ghost-Write:
                    </strong>{" "}
                    We provide guidance, outlines, and explanations - never
                    submission-ready content.
                  </div>
                  <div>
                    <strong className="text-gray-900">Always Cite:</strong> We
                    help you identify sources and format OSCOLA citations
                    correctly.
                  </div>
                  <div>
                    <strong className="text-gray-900">
                      Build Independence:
                    </strong>{" "}
                    Our goal is to develop your analytical skills, not replace
                    your thinking.
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <p>
                    All AI interactions are logged for transparency.
                    <Link
                      href="/ethics"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      View our Academic Integrity Pledge →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Integrity Pledge Modal */}
      <IntegrityPledge
        isOpen={showPledge}
        onClose={() => setShowPledge(false)}
        onAcknowledged={handlePledgeAcknowledged}
      />
    </>
  );
};

export default withAuthProtection(HumanModePage);

export async function getServerSideProps() {
  return { props: {} };
}
