import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function WriteLawPage() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>
          Write Law - Structured Legal Writing & Integrity | Caseway
        </title>
        <meta
          name="description"
          content="Master structured legal writing, IRAC methodology, and academic integrity with Caseway."
        />
      </Head>

      <div className="py-20 lg:py-32 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider mb-6 border border-orange-100">
            <FileText className="w-3.5 h-3.5" />
            Core Pillar: Writing
          </span>
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-8 tracking-tight">
            Write Law.
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Legal writing is not just about grammar—it's about structure. Learn
            to build arguments that survive scrutiny.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/learn/durham-law-academic-integrity-ai">
              <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg shadow-orange-200">
                Master Integrity & Writing
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-24 max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 border border-gray-100 rounded-2xl bg-white shadow-sm">
            <Shield className="w-10 h-10 text-orange-600 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Academic Integrity First
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              We don't write essays for you. We teach you how to plan,
              structure, and cite your own work to the highest Durham standards.
            </p>
            <Link
              href="/learn/durham-law-academic-integrity-ai"
              className="text-orange-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Read the Policy <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-8 border border-gray-100 rounded-2xl bg-white shadow-sm">
            <FileText className="w-10 h-10 text-purple-600 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Assessment Planning
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Break down complex assignment briefs into manageable research
              tasks and logical steps.
            </p>
            <Link
              href="/signup"
              className="text-purple-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Start Planning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
