// src/components/LayoutShell.tsx
import GlobalHeader from '../GlobalHeader'
import GlobalFooter from '../GlobalFooter'
import FloatingDurmah from '../FloatingDurmah'
import FloatingAWY from '../FloatingAWY'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <GlobalHeader />
      <main className="flex-1">{children}</main>
      <GlobalFooter />
      <FloatingDurmah />
      <FloatingAWY />
    </div>
  )
}