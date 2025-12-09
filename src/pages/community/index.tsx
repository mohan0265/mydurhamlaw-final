// src/pages/community/index.tsx
import React from 'react';
import Head from 'next/head';

// Use RELATIVE imports so TS doesn't depend on alias config
// All of these components exist in src/components/community/*
import {
  HeroSection,
  CategoryTabs,
  EventsCarousel,
  HealthcareSection,
  DiningSection,
  TransportSection,
  SafetyTipsSection,
  EmergencyEssentialsSection,
  ParentEssentials,
  PostAndGovSection,
  MapSection,
  StudentSocialCard,
} from '../../components/community';

// Status controls live under community-network in this repo
import StatusControls from '../../components/community-network/StatusControls';

export default function CommunityHubPage() {
  return (
    <>
      <Head>
        <title>Community Hub • MyDurhamLaw</title>
        <meta name="description" content="Community resources, status controls, events, safety, transport, healthcare and more for Durham Law students and families." />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
          <HeroSection />

          {/* quick toggles (presence / DM) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
             <StatusControls />
          </div>

          {/* categories and carousels */}
          <div className="space-y-6">
            <CategoryTabs />
            <EventsCarousel />
          </div>

          {/* resource sections grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <HealthcareSection />
              <DiningSection />
              <TransportSection />
            </div>
            <div className="space-y-8">
              <SafetyTipsSection />
              <EmergencyEssentialsSection />
              <ParentEssentials />
            </div>
          </div>

          {/* Full width sections */}
          <div className="space-y-8">
            <PostAndGovSection />
            <MapSection />
          </div>

          {/* social / cards */}
          <div className="pt-8 border-t border-gray-200">
            <StudentSocialCard />
          </div>
        </div>
      </main>
    </>
  );
}
