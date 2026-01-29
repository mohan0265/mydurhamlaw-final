import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Zap, Clock, Shield } from "lucide-react";
import { guides } from "@/content/articlesIndex";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";

export default function DemosHub() {
  const demos = guides.filter((g) => g.type === "demo");

  return (
    <div className="bg-white min-h-screen">
      <Head>
        <title>Product Demos | MyDurhamLaw</title>
        <meta
          name="description"
          content="Explore the powerful features of MyDurhamLaw. From AI voice buddies to visual academic roadmaps."
        />
        <link rel="canonical" href="https://casewaylaw.ai/demos" />
      </Head>

      <GlobalHeader />

      <main className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
            <div className="max-w-2xl">
              <Link
                href="/"
                prefetch={false}
                className="inline-flex items-center gap-2 text-sm text-indigo-600 font-bold mb-6 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">
                Product <span className="text-indigo-600">Demos</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">
                Try before you join. Experience how Caseway transforms the legal
                study experience.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demos.map((demo) => (
              <Link
                key={demo.slug}
                href={demo.href}
                prefetch={false}
                className="group relative flex flex-col h-full bg-white rounded-[2rem] border border-gray-100 p-8 hover:border-indigo-200 hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap className="w-24 h-24 text-indigo-600" />
                </div>

                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    <Play className="w-3 h-3 fill-indigo-600" /> Demo
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  {demo.title}
                </h2>

                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
                  {demo.description}
                </p>

                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {demo.readTime}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Trust Block */}
          <div className="mt-32 p-12 bg-gray-950 rounded-[3rem] text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 tracking-tight">
                Ready for the full experience?
              </h2>
              <p className="text-indigo-200 mb-10 max-w-xl mx-auto opacity-80">
                Get unlimited access to case research, IRAC assistants, and your
                personalized academic roadmap.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" prefetch={false}>
                  <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-900/40">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/pricing" prefetch={false}>
                  <button className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition backdrop-blur-sm border border-white/10">
                    View Pricing
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
