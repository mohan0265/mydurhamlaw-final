import React from "react";
import { HeroSection } from "../components/community/HeroSection";
import { CategoryTabs } from "../components/community/CategoryTabs";
import { EmergencyEssentialsSection } from "../components/community/EmergencyEssentialsSection";
import { HealthcareSection } from "../components/community/HealthcareSection";
import { TransportSection } from "../components/community/TransportSection";
import { PostAndGovSection } from "../components/community/PostAndGovSection";
import { DiningSection } from "../components/community/DiningSection";
import { EventsCarousel } from "../components/community/EventsCarousel";
import { MapSection } from "../components/community/MapSection";
import { SafetyTipsSection } from "../components/community/SafetyTipsSection";
import { StudentSocialCard } from "../components/community/StudentSocialCard";

export default function CommunityPage() {
  return (
    <main className="container mx-auto max-w-4xl px-2 sm:px-6 py-10" aria-label="Durham Community page">
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
