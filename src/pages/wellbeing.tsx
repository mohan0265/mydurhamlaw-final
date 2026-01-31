"use client";

import Head from "next/head";
import { withAuthProtection } from "@/lib/withAuthProtection";
import { Heart, Moon, Battery, Shield } from "lucide-react";
import MoodQuickCheck from "@/components/wellbeing/MoodQuickCheck";
import WellbeingTrends from "@/components/wellbeing/WellbeingTrends";
import WellbeingChat from "@/components/WellbeingChat";

function WellbeingPage() {
  return (
    <>
      <Head>
        <title>Wellbeing - CASEWAY</title>
      </Head>

      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wellbeing</h1>
            <p className="mt-2 text-lg text-gray-600 max-w-3xl">
              Small resets that protect focus, sleep, and confidence —
              especially during heavy weeks.
            </p>
            <div className="mt-4 items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg inline-flex">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>
                Confidential. Durmah is an AI support tool, not a clinical
                service.
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              If you feel unsafe or need urgent help, contact your local
              emergency services or your university support line.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Tools */}
            <div className="lg:col-span-5 space-y-6">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Battery className="h-5 w-5 text-green-600" />
                  Daily Check-in
                </h2>
                <MoodQuickCheck />
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-600" />
                  Your Trends
                </h2>
                <WellbeingTrends />
              </section>

              {/* Resources (Static for now) */}
              <section className="pt-4 border-t border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Quick Resets
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-200 transition text-sm text-gray-700 font-medium text-center"
                  >
                    Study Fatigue
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-200 transition text-sm text-gray-700 font-medium text-center"
                  >
                    Sleep Reset
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-200 transition text-sm text-gray-700 font-medium text-center"
                  >
                    Exam Stress
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white border border-gray-200 hover:border-purple-200 transition text-sm text-gray-700 font-medium text-center"
                  >
                    Confidence
                  </a>
                </div>
              </section>
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <span className="font-semibold text-gray-900">
                    Wellbeing Coach
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* Allow chat without pledge on wellbeing page */}
                  <WellbeingChat
                    allowWithoutPledge={true}
                    assistanceLevel="L1"
                    pledgedAt={null}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default withAuthProtection(WellbeingPage);
