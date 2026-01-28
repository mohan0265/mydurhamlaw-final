// src/config/nav.ts
// Central navigation config for Caseway.
// This version fixes the broken "Community Network" link by pointing to an existing page.

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "My Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Year at a Glance", href: "/year-at-a-glance", icon: "Calendar" },

  // FIX: previously "/community-network" (404). Point to a real route:
  { label: "Community", href: "/community", icon: "Users" },
  // If you prefer the hub, swap the line above with:
  // { label: "Community Hub", href: "/community-hub", icon: "Users" },

  { label: "Library", href: "/library", icon: "BookOpen" },
  { label: "Planner", href: "/planner", icon: "ListChecks" },
  { label: "Assessments", href: "/assessments", icon: "ClipboardList" },
  { label: "Notes", href: "/notes", icon: "StickyNote" },

  // Settings & account
  { label: "Settings", href: "/settings", icon: "Settings" },

  // Help / docs (optional; comment out if not used)
  // { label: "Help & Guides", href: "/help", icon: "LifeBuoy" },

  // External links (example)
  // { label: "Durham Law (Official)", href: "https://www.dur.ac.uk/law/", external: true, icon: "ExternalLink" },
];

// Named exports commonly used across the app
export const mainNav: NavItem[] = NAV_ITEMS;
export const nav: NavItem[] = NAV_ITEMS;

// Default export for convenience
export default NAV_ITEMS;
