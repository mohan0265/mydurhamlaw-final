import React from "react";
import Head from "next/head";
import DemoLayout from "@/components/demo/DemoLayout";
import DemoUpcomingDeadlines from "@/components/demo/widgets/DemoUpcomingDeadlines";
import DemoTodaysTasks from "@/components/demo/widgets/DemoTodaysTasks";
import { Video } from "lucide-react";

export default function DemoDashboardPage() {
  return (
    <DemoLayout activePage="dashboard">
      <Head>
        <title>Demo Dashboard | Caseway</title>
      </Head>

      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-black mb-2">
              Good afternoon, Student
            </h1>
            <p className="text-purple-100 text-lg mb-6">
              You have 2 upcoming deadlines this week. Ready to make progress?
            </p>
            <div className="flex gap-3">
              <button className="bg-white text-purple-700 px-6 py-2.5 rounded-lg font-bold hover:bg-purple-50 transition-colors">
                Continue "Contract Law Remedies"
              </button>
              <button className="bg-purple-600/50 hover:bg-purple-600/70 text-white px-6 py-2.5 rounded-lg font-bold transition-colors backdrop-blur-sm border border-white/20">
                Ask Durmah for Help
              </button>
            </div>
          </div>

          {/* Decorative BG */}
          <div className="absolute top-0 right-0 bottom-0 w-1/3 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DemoUpcomingDeadlines />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Video size={20} />
                </div>
                <h3 className="font-bold text-gray-900">
                  Latest Lecture Notes
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Contract Law • 2 hours ago
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="font-bold text-lg">A-</span>
                </div>
                <h3 className="font-bold text-gray-900">Latest Grade</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Public Law Essay • Great work!
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 h-full">
            <DemoTodaysTasks />
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
