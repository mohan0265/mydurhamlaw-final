// src/config/nav.ts
export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'My Year at a Glance', href: '/year-at-a-glance' },
  { label: 'Legal News', href: '/legal/tools/legal-news-feed' },
  { label: 'AI Tools', href: '/wellbeing' },
  { label: 'Study Resources', href: '/study-materials' },
  { label: 'Voice Chat', href: '/wellbeing' },
  { label: 'Student Lounge', href: '/lounge' },
  { label: 'Community Network', href: '/community-network' },
  { label: 'About', href: '/about' },
  { label: 'My Dashboard', href: '/dashboard' },
];