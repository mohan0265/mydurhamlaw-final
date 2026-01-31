import React from "react";
import Head from "next/head";
import DemoLayout from "@/components/demo/DemoLayout";
import { Mic, FileText, Download, Share2, Play } from "lucide-react";

export default function DemoLectureToNotes() {
  return (
    <DemoLayout activePage="lectures">
      <Head>
        <title>Lecture to Notes Demo | Caseway</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Processed Successfully
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-500 text-xs">Today at 10:00 AM</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reliance Damages & Remoteness
            </h1>
            <p className="text-gray-500">Contract Law • Lecture 4</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
              <Download size={16} /> Export PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
              <Play size={16} /> Play Audio
            </button>
          </div>
        </div>

        {/* Notes Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex gap-4 text-sm font-medium">
            <button className="text-purple-600 border-b-2 border-purple-600 pb-4 -mb-4 px-1">
              Structured Notes
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-4 -mb-4 px-1">
              Transcript
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-4 -mb-4 px-1">
              Key Cases
            </button>
          </div>

          <div className="p-8 prose prose-slate max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <h4 className="text-blue-800 font-bold m-0 text-sm uppercase">
                Key Takeaway
              </h4>
              <p className="text-blue-700 m-0 text-sm mt-1">
                Reliance damages are designed to put the claimant in the
                position they would have been in had they never entered the
                contract (backward-looking), whereas expectation damages look
                forward.
              </p>
            </div>

            <h3>1. The Concept of Reliance Interest</h3>
            <p>
              In <em>Anglia Television v Reed</em> [1972], the court held that a
              claimant has an election: they can claim for loss of profits
              (expectation) OR for wasted expenditure (reliance). They cannot
              claim both if it results in double recovery.
            </p>
            <p>
              <strong>Lord Denning MR</strong> famously stated:
              <blockquote className="not-italic bg-gray-50 p-4 rounded-lg border-l-2 border-gray-300 text-gray-600 text-sm my-4">
                "If the plaintiff claims the wasted expenditure, he is not
                limited to the expenditure incurred after the contract was
                concluded. He can claim also the expenditure incurred before the
                contract..."
              </blockquote>
            </p>

            <h3>2. The "Bad Bargain" Exception</h3>
            <p>
              The reliance measure cannot be used to escape a bad bargain. If
              the defendant can prove that the claimant would not have recouped
              their expenditure even if the contract had been performed, the
              claim will be capped at the expectation measure (
              <em>C & P Haulage v Middleton</em>).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
              <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-xl">
                <h5 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                  ⚠️ Exam Tip: Check for bad bargains
                </h5>
                <p className="text-xs text-yellow-700">
                  Always ask: "Would they have made a loss anyway?" If yes,
                  reduce damages.
                </p>
              </div>
            </div>

            <h3>3. Remoteness of Damage</h3>
            <p>
              The rule in <em>Hadley v Baxendale</em> applies equally here. The
              loss must be:
            </p>
            <ul>
              <li>Naturally arising (Limb 1)</li>
              <li>In the mutual contemplation of parties (Limb 2)</li>
            </ul>
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
