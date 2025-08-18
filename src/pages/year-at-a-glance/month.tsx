// src/pages/year-at-a-glance/month.tsx
import dynamic from 'next/dynamic'

// Client-only: avoids SSR/prerender touching React Query/Auth
const MonthPage = dynamic(() => import('@/features/calendar/MonthPageClient'), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Loading calendar…</div>,
})

export default MonthPage
