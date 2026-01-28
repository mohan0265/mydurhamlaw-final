import { Step } from "react-joyride";

export const GUEST_TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    content:
      "Welcome to Caseway! Let us show you around your new legal study companion.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="landing-hero"]',
    content:
      "This is your starting point. Explore features, pricing, and how Caseway helps you succeed.",
  },
  {
    target: '[data-tour="landing-features"]',
    content:
      "Discover our core tools: Year at a Glance, Assignment Assistant, and more.",
  },
  {
    target: '[data-tour="landing-durmah"]',
    content:
      "Meet Durmah, your 24/7 AI voice tutor. Click to chat or ask questions anytime.",
  },
  {
    target: '[data-tour="landing-cta"]',
    content: "Ready to excel? Start your free trial here.",
  },
];

export const STUDENT_DASHBOARD_TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    content:
      "Welcome to your Student Dashboard. This is your command center for the academic year.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-nav"]',
    content:
      "Navigate between your Calendar, Modules, Assignments, and Exam Prep here.",
  },
  {
    target: '[data-tour="dashboard-yaag"]',
    content:
      "Year at a Glance: See your entire term structure and upcoming deadlines in one view.",
  },
  {
    target: '[data-tour="dashboard-assignments"]',
    content: "Track and draft your assignments with our AI-powered assistant.",
  },
  {
    target: '[data-tour="global-durmah-fab"]',
    content:
      "This is Durmah. Click this floating button anywhere to get instant voice or text help.",
    spotlightClicks: true,
  },
];
