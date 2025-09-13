// src/constants/Routes.ts

const Routes = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  // DASHBOARD: '/dashboard', // Removed - use year-specific dashboards only
  STUDY_MATERIALS: '/study-materials',
  MEMORY_MANAGER: '/memory-manager',
  ASSIGNMENTS: '/assignments',
  CALENDAR: '/calendar',
  LECTURES: '/lectures',
  WELLBEING: '/wellbeing',
  SETTINGS: '/settings',
  REFERENCES: '/references',
  ETHICS: '/ethics',
  COMMUNITY_NETWORK: '/community-network',
  STUDY_SCHEDULE: '/study-schedule',
} as const;

type RouteKey = keyof typeof Routes;
type RouteValue = typeof Routes[RouteKey];

export type { RouteKey, RouteValue };
export default Routes;