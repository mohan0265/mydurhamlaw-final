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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <HeroSection />

        {/* quick toggles (presence / DM) */}
        <StatusControls />

        {/* categories and carousels */}
        <CategoryTabs />
        <EventsCarousel />

        {/* resource sections */}
        <HealthcareSection />
        <DiningSection />
        <TransportSection />
        <SafetyTipsSection />
        <EmergencyEssentialsSection />
        <ParentEssentials />
        <PostAndGovSection />
        <MapSection />

        {/* social / cards */}
        <StudentSocialCard />
      </main>
    </>
  );
}
