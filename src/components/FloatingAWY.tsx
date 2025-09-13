// src/components/FloatingAWY.tsx
import { isAWYEnabled } from '@/lib/feature-flags';

export default function FloatingAWY() {
  if (!isAWYEnabled()) return null
  return (
    <button
      aria-label="Open AWY Video"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700"
    >
      🎥 AWY
    </button>
  )
}