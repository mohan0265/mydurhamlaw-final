// src/pages/year-at-a-glance/week.tsx
import dynamic from 'next/dynamic'

// Client-only: avoids SSR/prerender touching React Query/Auth
const WeekPage = dynamic(() => import('@/features/calendar/WeekPageClient'), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Loading calendar…</div>,
})

export default WeekPage
