import React from "react";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { GraduationCap } from "lucide-react";

export default function UKLawDegreeHelp() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      <GlobalHeader />

      <main className="flex-grow pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap size={32} />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              UK Law Degree Help
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Expert advice on navigating the LLB, securing training contracts,
              and understanding the SQE transition.
            </p>

            <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold uppercase tracking-widest">
              Coming Soon
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
