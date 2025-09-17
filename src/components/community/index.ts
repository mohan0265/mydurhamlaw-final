// src/components/community/index.ts
// Barrel for Community sections.
// Most files export *named* components (no default). ParentEssentials exports default.
// We re-export accordingly so pages can import from this one place.

export * from './HeroSection';
export * from './CategoryTabs';
export * from './EventsCarousel';
export * from './HealthcareSection';
export * from './DiningSection';
export * from './TransportSection';
export * from './SafetyTipsSection';
export * from './EmergencyEssentialsSection';

// This file exports a *default* component; give it a named handle here:
export { default as ParentEssentials } from './ParentEssentials';

export * from './PostAndGovSection';
export * from './MapSection';
export * from './StudentSocialCard';
