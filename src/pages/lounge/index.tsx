// src/pages/lounge/index.tsx
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AuthContext } from "@/lib/supabase/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoungeFeed from "@/components/lounge/LoungeFeed";
import LoungeComposer from "@/components/lounge/LoungeComposer";
import { LoungePost } from "@/components/lounge/LoungePostCard";

export default function LoungePage() {
  const { user, isLoading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [refreshFeed, setRefreshFeed] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  function handleNewPost(post: LoungePost) {
    // Trigger feed refresh to show new post
    setRefreshFeed(prev => prev + 1);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Premier Student Lounge - MyDurhamLaw</title>
        <meta 
          name="description" 
          content="Connect with fellow Durham Law students, share wins, get study tips, and build lasting friendships in our supportive community space." 
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Header />
        
        <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
          {/* Welcome Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-3 sm:mb-4">
              <span className="text-lg sm:text-2xl">🏛️</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Premier Student Lounge
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
              Where brilliant minds connect. Share your victories, seek wisdom from peers, 
              and build the friendships that will support your legal career for decades to come.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Post Composer */}
              <LoungeComposer onPosted={handleNewPost} />
              
              {/* Feed */}
              <LoungeFeed refreshKey={refreshFeed} />
            </div>

            {/* Sidebar - Mobile/Desktop optimized */}
            <div className="lg:space-y-6">
              {/* Mobile: Collapsible sections */}
              <div className="lg:hidden space-y-4">
                {/* Community Guidelines - Mobile Compact */}
                <details className="rounded-2xl border bg-white/70 shadow-sm">
                  <summary className="p-4 cursor-pointer hover:bg-gray-50 rounded-t-2xl flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      <span>✨</span>
                      Community Spirit
                    </span>
                    <span className="text-gray-400">▼</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <ul className="space-y-2 text-xs text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>Celebrate wins & share encouragement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>Share study tips & ask questions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>Keep conversations respectful</span>
                      </li>
                    </ul>
                  </div>
                </details>

                {/* Quick Start - Mobile Horizontal Scroll */}
                <div className="rounded-2xl border bg-white/70 shadow-sm p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <span>🚀</span>
                    Quick Ideas
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button className="flex-shrink-0 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-xs whitespace-nowrap">
                      📚 Study tip
                    </button>
                    <button className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-xs whitespace-nowrap">
                      🎉 Achievement
                    </button>
                    <button className="flex-shrink-0 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-xs whitespace-nowrap">
                      🤝 Offer help
                    </button>
                    <button className="flex-shrink-0 px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-xs whitespace-nowrap">
                      💡 Ask advice
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop: Full sidebar */}
              <div className="hidden lg:block space-y-6">
                {/* Community Guidelines */}
                <div className="rounded-2xl border bg-white/70 shadow-sm p-6 sticky top-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>⚖️</span>
                    Our Legal Community Values
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Celebrate every academic milestone together</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Share case insights and study breakthroughs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Support each other through tough assignments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Ask bold questions that spark legal thinking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>Foster the collegiality our profession demands</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border bg-white/70 shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>💡</span>
                    Post Inspiration
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-sm">
                      📚 Share your breakthrough study method
                    </button>
                    <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-sm">
                      🎯 Celebrate mastering a difficult concept
                    </button>
                    <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-sm">
                      🤝 Guide a peer through legal research
                    </button>
                    <button className="w-full text-left p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-sm">
                      💭 Ask for perspectives on case law
                    </button>
                  </div>
                </div>

                {/* Community Impact */}
                <div className="rounded-2xl border bg-white/70 shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🏛️</span>
                    Building Legal Excellence
                  </h3>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      Shaping Tomorrow&apos;s Lawyers
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Every insight shared, every question answered, and every connection made 
                      strengthens the future of our legal profession. Your contribution matters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}