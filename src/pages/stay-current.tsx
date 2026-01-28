import React from "react";
import Head from "next/head";
import Link from "next/link";
import { TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import RelatedGuides from "@/components/seo/RelatedGuides";

export default function StayCurrentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>
          Stay Current - Legal News & Commercial Awareness | Caseway
        </title>
        <meta
          name="description"
          content="Build commercial awareness with our live legal news feed, tailored for Durham Law students."
        />
        <link rel="canonical" href="https://casewaylaw.ai/stay-current" />
      </Head>

      <div className="py-20 lg:py-32 bg-gray-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-6 border border-red-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            Core Pillar: Awareness
          </span>
          <h1 className="text-5xl lg:text-7xl font-black mb-8 tracking-tight">
            Stay Current.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Law does not happen in a vacuum. Connect your studies to the real
            world with our live legal news feed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/legal/tools/legal-news-feed" prefetch={false}>
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg shadow-red-900/50 flex items-center gap-2 mx-auto sm:mx-0">
                Open News Feed <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-24 max-w-4xl mx-auto px-6">
        <Link
          href="/guides"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm text-red-600 font-medium mb-12 hover:underline"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Guides Hub
        </Link>
        <div className="grid sm:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Why Commercial Awareness Matters
            </h3>
            <ul className="space-y-4">
              {[
                "Link case law to current events",
                "Impress in vacation scheme interviews",
                "Understand the business of law",
                "Develop a holistic legal mindset",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-1 shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Latest Headlines
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Our feed aggregates top legal news sources, filtered for relevance
              to UK law students.
            </p>
            <Link
              href="/legal/tools/legal-news-feed"
              prefetch={false}
              className="text-red-600 font-bold text-sm hover:underline"
            >
              View Full Feed &rarr;
            </Link>
          </div>
        </div>
        <RelatedGuides currentSlug="stay-current" categories={["News"]} />
      </div>
    </div>
  );
}
