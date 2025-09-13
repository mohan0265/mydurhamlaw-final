// src/pages/community.tsx
import React from "react";
import {
  HeroSection,
  CategoryTabs,
  EmergencyEssentialsSection,
  HealthcareSection,
  TransportSection,
  PostAndGovSection,
  DiningSection,
  EventsCarousel,
  MapSection,
  SafetyTipsSection,
  StudentSocialCard,
} from "@/components/community";

export default function CommunityPage() {
  return (
    <main
      className="container mx-auto max-w-6xl px-4 sm:px-6 py-10"
      aria-label="Durham Community page"
    >
      <HeroSection />
      <CategoryTabs />
      <EmergencyEssentialsSection />
      <HealthcareSection />
      <TransportSection />
      <PostAndGovSection />
      <DiningSection />
      <EventsCarousel />
      <SafetyTipsSection />
      <MapSection />
      <StudentSocialCard />
    </main>
  );
}
