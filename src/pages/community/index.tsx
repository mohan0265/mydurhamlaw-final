// src/pages/community/index.tsx
// Community Hub (canonical) — composes your existing section components

import React from 'react';
import Head from 'next/head';

// Import sections from the barrel file we just created
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
} from '@/components/community';

// Status controls live under community-network in your repo
import StatusControls from '@/components/community-network/StatusControls';

export default function CommunityHubPage() {
  return (
    <>
      <Head>
        <title>Community Hub • MyDurhamLaw</title>
        <meta
          name="description"
          content="Student lounge, essentials and life around Durham — curated for MyDurhamLaw students and families."
        />
      </Head>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        <HeroSection />
        <StatusControls />

        <section className="space-y-6">
          <CategoryTabs />
          <EventsCarousel />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HealthcareSection />
          <DiningSection />
        </section>

        <TransportSection />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SafetyTipsSection />
          <EmergencyEssentialsSection />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParentEssentials />
          <PostAndGovSection />
        </section>

        <MapSection />
        <StudentSocialCard />
      </main>
    </>
  );
}
